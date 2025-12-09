"""
Game orchestrator that manages AI agent gameplay and broadcasts updates.
"""
import asyncio
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from dotenv import load_dotenv

from openai import AsyncOpenAI

from .agent_config import get_agent_by_id, get_system_prompt

# Load environment variables from .env file in backend directory
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

print(f"[GameOrchestrator] Looking for .env at: {env_path}")
print(f"[GameOrchestrator] AI_GATEWAY_API_KEY found: {'Yes' if os.environ.get('AI_GATEWAY_API_KEY') else 'No'}")


@dataclass
class AgentThought:
    """Represents an AI agent's reasoning/thought."""
    agent_id: str
    agent_name: str
    timestamp: str
    thought_type: str  # "reasoning", "decision", "action_result", "error"
    content: str
    action: Optional[str] = None
    params: Optional[Dict] = None


@dataclass
class GameOrchestrator:
    """Orchestrates AI agent gameplay."""
    
    selected_agents: List[str] = field(default_factory=list)
    ai_client: Optional[AsyncOpenAI] = None
    model_id: str = "openai/gpt-4o"
    is_running: bool = False
    game_task: Optional[asyncio.Task] = None
    
    # Callbacks for broadcasting
    broadcast_callback: Optional[Callable] = None
    state_getter: Optional[Callable] = None
    action_handler: Optional[Callable] = None
    player_registrar: Optional[Callable] = None
    game_starter: Optional[Callable] = None
    
    # Thought history
    thoughts: List[AgentThought] = field(default_factory=list)
    max_thoughts: int = 100
    
    def __post_init__(self):
        # Initialize AI client
        gateway_key = os.environ.get("AI_GATEWAY_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if gateway_key:
            self.ai_client = AsyncOpenAI(
                base_url="https://ai-gateway.vercel.sh/v1",
                api_key=gateway_key,
                default_headers={
                    "x-title": "Monopoly-MCP-Agent",
                    "http-referer": "https://monopoly.local",
                },
            )
    
    def set_callbacks(
        self,
        broadcast_callback: Callable,
        state_getter: Callable,
        action_handler: Callable,
        player_registrar: Callable,
        game_starter: Callable
    ):
        """Set callback functions for game operations."""
        self.broadcast_callback = broadcast_callback
        self.state_getter = state_getter
        self.action_handler = action_handler
        self.player_registrar = player_registrar
        self.game_starter = game_starter
    
    def _add_thought(self, thought: AgentThought):
        """Add a thought to history and broadcast it."""
        self.thoughts.append(thought)
        if len(self.thoughts) > self.max_thoughts:
            self.thoughts = self.thoughts[-self.max_thoughts:]
        
        # Broadcast the thought
        if self.broadcast_callback:
            self.broadcast_callback("agent_thought", {
                "thought": {
                    "agent_id": thought.agent_id,
                    "agent_name": thought.agent_name,
                    "timestamp": thought.timestamp,
                    "thought_type": thought.thought_type,
                    "content": thought.content,
                    "action": thought.action,
                    "params": thought.params
                }
            })
    
    def get_recent_thoughts(self, limit: int = 20) -> List[Dict]:
        """Get recent thoughts for display."""
        return [
            {
                "agent_id": t.agent_id,
                "agent_name": t.agent_name,
                "timestamp": t.timestamp,
                "thought_type": t.thought_type,
                "content": t.content,
                "action": t.action,
                "params": t.params
            }
            for t in self.thoughts[-limit:]
        ]
    
    async def start_game(self, agent_ids: List[str]) -> Dict[str, Any]:
        """Start a new game with selected agents."""
        if self.is_running:
            return {"error": "Game already running"}
        
        if len(agent_ids) < 2:
            return {"error": "Need at least 2 agents"}
        
        if len(agent_ids) > 4:
            return {"error": "Maximum 4 agents allowed"}
        
        if not self.ai_client:
            return {"error": "AI client not configured. Set AI_GATEWAY_API_KEY or OPENAI_API_KEY"}
        
        self.selected_agents = agent_ids
        self.thoughts = []
        
        # Get agent configs
        agents = [get_agent_by_id(aid) for aid in agent_ids]
        agent_names = [a["name"] for a in agents if a]
        
        # Register agents
        for agent in agents:
            if agent and self.player_registrar:
                result = self.player_registrar(agent["name"])
                self._add_thought(AgentThought(
                    agent_id=agent["id"],
                    agent_name=agent["name"],
                    timestamp=datetime.now().isoformat(),
                    thought_type="action_result",
                    content=f"Registered: {result}"
                ))
                # Broadcast updated state after each registration
                if self.broadcast_callback and self.state_getter:
                    self.broadcast_callback("player_registered", {
                        "player_name": agent["name"],
                        "message": result,
                        "state": self.state_getter()
                    })
        
        # Start the game
        if self.game_starter:
            result = self.game_starter()
            self._add_thought(AgentThought(
                agent_id="system",
                agent_name="System",
                timestamp=datetime.now().isoformat(),
                thought_type="action_result",
                content=f"Game started: {result}"
            ))
            # Broadcast game started with full state
            if self.broadcast_callback and self.state_getter:
                self.broadcast_callback("game_started", {
                    "message": result,
                    "state": self.state_getter()
                })
        
        # Start the game loop in background
        self.is_running = True
        self.game_task = asyncio.create_task(self._game_loop())
        
        return {
            "success": True,
            "message": f"Game started with agents: {', '.join(agent_names)}",
            "agents": agent_names
        }
    
    def stop_game(self) -> Dict[str, Any]:
        """Stop the current game."""
        if not self.is_running:
            return {"error": "No game running"}
        
        self.is_running = False
        if self.game_task:
            self.game_task.cancel()
            self.game_task = None
        
        self._add_thought(AgentThought(
            agent_id="system",
            agent_name="System",
            timestamp=datetime.now().isoformat(),
            thought_type="action_result",
            content="Game stopped by user"
        ))
        
        return {"success": True, "message": "Game stopped"}
    
    def _clean_json_content(self, content: str) -> str:
        """Remove markdown code blocks from LLM response."""
        if "```" in content:
            match = re.search(r"```(?:json)?(.*?)```", content, re.DOTALL)
            if match:
                return match.group(1).strip()
        return content.strip()
    
    def _get_action_prompt(self, game_state: Dict, agent_name: str, available_actions: List[str]) -> str:
        """Build the action prompt for an agent."""
        player_info = game_state["players"].get(agent_name, {})
        
        other_players_txt = ""
        for name, info in game_state["players"].items():
            if name != agent_name:
                other_players_txt += f"- {name}: ${info['money']}, {len(info.get('properties', []))} properties\n"
        
        recent_msgs = game_state.get("recent_messages", [])
        recent_history = "\n".join(recent_msgs[-5:]) if isinstance(recent_msgs, list) else "No recent history."
        
        return f"""
GAME STATE:
- Your name: {agent_name}
- Your money: ${player_info.get('money', 0)}
- Your position: {player_info.get('tile_name', 'Unknown')} (position {player_info.get('position', 0)})
- Your properties: {', '.join(player_info.get('properties', [])) or 'None'}
- In jail: {player_info.get('in_jail', False)}
- Get Out of Jail cards: {player_info.get('jail_cards', 0)}

CURRENT PHASE: {game_state.get('phase', 'unknown')}
LAST DICE ROLL: {game_state.get('last_dice', [0,0])}

OTHER PLAYERS:
{other_players_txt}

AVAILABLE ACTIONS: {available_actions}

RECENT EVENTS:
{recent_history}

Choose your action. Respond with JSON only:
{{"action": "<action_name>", "params": {{}}, "reasoning": "<brief explanation>"}}

For build_house: {{"action": "build_house", "params": {{"property_position": <position>}}, "reasoning": "..."}}
For mortgage/unmortgage: {{"action": "<action>", "params": {{"property_position": <position>}}, "reasoning": "..."}}
For other actions: {{"action": "<action_name>", "params": {{}}, "reasoning": "..."}}
"""
    
    async def _agent_think_and_act(self, agent_config: Dict, game_state: Dict, available_actions: List[str]):
        """Have an agent think and take an action."""
        agent_name = agent_config["name"]
        agent_id = agent_config["id"]
        model_id = agent_config.get("model_id", "openai/gpt-4o")
        
        # Get system prompt (same for all models - they compete on reasoning ability)
        system_prompt = get_system_prompt()
        user_prompt = self._get_action_prompt(game_state, agent_name, available_actions)
        
        # Add thinking thought
        self._add_thought(AgentThought(
            agent_id=agent_id,
            agent_name=agent_name,
            timestamp=datetime.now().isoformat(),
            thought_type="reasoning",
            content=f"🤔 Analyzing game state... Phase: {game_state.get('phase')}, Available actions: {available_actions} [Model: {model_id}]"
        ))
        
        try:
            # Call AI with the agent's specific model
            response = await self.ai_client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            
            raw_content = response.choices[0].message.content
            cleaned_content = self._clean_json_content(raw_content)
            decision = json.loads(cleaned_content)
            
            action_name = decision.get("action")
            params = decision.get("params", {})
            reasoning = decision.get("reasoning", "No reasoning provided")
            
            # Add decision thought
            self._add_thought(AgentThought(
                agent_id=agent_id,
                agent_name=agent_name,
                timestamp=datetime.now().isoformat(),
                thought_type="decision",
                content=reasoning,
                action=action_name,
                params=params
            ))
            
            # Execute action
            if self.action_handler:
                result = self.action_handler(agent_name, action_name, params)
                
                # Add result thought
                result_str = json.dumps(result) if isinstance(result, dict) else str(result)
                self._add_thought(AgentThought(
                    agent_id=agent_id,
                    agent_name=agent_name,
                    timestamp=datetime.now().isoformat(),
                    thought_type="action_result",
                    content=f"Action result: {result_str[:200]}"
                ))
                
                # Broadcast updated game state to all clients
                if self.broadcast_callback and self.state_getter:
                    updated_state = self.state_getter()
                    self.broadcast_callback("action_result", {
                        "player_name": agent_name,
                        "action": action_name,
                        "result": result,
                        "state": updated_state
                    })
                
        except json.JSONDecodeError as e:
            self._add_thought(AgentThought(
                agent_id=agent_id,
                agent_name=agent_name,
                timestamp=datetime.now().isoformat(),
                thought_type="error",
                content=f"Failed to parse AI response: {str(e)}"
            ))
        except Exception as e:
            self._add_thought(AgentThought(
                agent_id=agent_id,
                agent_name=agent_name,
                timestamp=datetime.now().isoformat(),
                thought_type="error",
                content=f"Error: {str(e)}"
            ))
    
    async def _game_loop(self):
        """Main game loop that runs agent turns."""
        turn_count = 0
        max_turns = 200
        
        # Build agent lookup
        agent_lookup = {get_agent_by_id(aid)["name"]: get_agent_by_id(aid) for aid in self.selected_agents}
        
        while self.is_running and turn_count < max_turns:
            await asyncio.sleep(1.5)  # Pause between actions for readability
            
            try:
                # Get game state
                if not self.state_getter:
                    continue
                    
                game_state = self.state_getter()
                
                # Check for game over
                if game_state.get("phase") == "game_over":
                    self._add_thought(AgentThought(
                        agent_id="system",
                        agent_name="System",
                        timestamp=datetime.now().isoformat(),
                        thought_type="action_result",
                        content="🏆 GAME OVER!"
                    ))
                    # Broadcast game over state
                    if self.broadcast_callback:
                        self.broadcast_callback("state_update", {
                            "state": game_state
                        })
                    self.is_running = False
                    break
                
                # Get current player
                current_player_name = game_state.get("current_player")
                
                if current_player_name not in agent_lookup:
                    continue
                
                agent_config = agent_lookup[current_player_name]
                
                # Get available actions from game engine
                from game.logic.game_engine import MonopolyGameEngine
                # We need to check what actions are available
                phase = game_state.get("phase", "")
                available_actions = []
                
                if phase == "waiting_for_roll":
                    available_actions = ["roll_dice_and_move"]
                elif phase == "in_jail":
                    available_actions = ["roll_for_doubles", "pay_jail_bail"]
                    player_info = game_state["players"].get(current_player_name, {})
                    if player_info.get("jail_cards", 0) > 0:
                        available_actions.append("use_jail_card")
                elif phase == "waiting_for_buy_decision":
                    available_actions = ["buy_property", "decline_purchase"]
                elif phase == "turn_complete":
                    available_actions = ["end_turn"]
                
                if available_actions:
                    await self._agent_think_and_act(agent_config, game_state, available_actions)
                    turn_count += 1
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                self._add_thought(AgentThought(
                    agent_id="system",
                    agent_name="System",
                    timestamp=datetime.now().isoformat(),
                    thought_type="error",
                    content=f"Game loop error: {str(e)}"
                ))
                await asyncio.sleep(2)
        
        self.is_running = False


# Global orchestrator instance
orchestrator = GameOrchestrator()

