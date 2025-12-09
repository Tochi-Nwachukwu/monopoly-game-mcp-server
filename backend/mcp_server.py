from fastmcp import FastMCP
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
import threading
import asyncio

# Import your existing engine
from game.logic.game_engine import MonopolyGameEngine, GamePhase
from game.data.game_persistence import persistence
from api.routes import router as api_router, setup_game_handlers, setup_game_resetter, get_connection_manager, setup_orchestrator
from agents.game_orchestrator import orchestrator

mcp = FastMCP("Monopoly Game Server")

# Create FastAPI app for REST + WebSocket endpoints
app = FastAPI(
    title="Monopoly Game API",
    description="REST and WebSocket API for the Monopoly game",
    version="1.0.0"
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Global Server State ---
class ServerState:
    def __init__(self):
        self.registered_players: List[str] = []
        self.game_engine: Optional[MonopolyGameEngine] = None
        self.is_game_started: bool = False
        self.game_id: Optional[str] = None

        # Runner Logic State
        self.actions_this_turn: int = 0
        self.max_actions_per_turn: int = 20
        self.max_turns: int = 100
        self.lock = threading.Lock()


state = ServerState()

# Global event loop reference for async broadcasting
_broadcast_loop: Optional[asyncio.AbstractEventLoop] = None


def _broadcast_to_clients(update_type: str, data: Dict[str, Any]):
    """
    Broadcast game updates to all connected WebSocket clients.
    This bridges the sync MCP context to the async WebSocket broadcasting.
    """
    try:
        manager = get_connection_manager()
        message = {"type": update_type, **data}
        
        # Try to get the running event loop
        try:
            asyncio.get_running_loop()
            # If we're in an async context, create a task
            asyncio.create_task(manager.broadcast(message))
        except RuntimeError:
            # No running event loop - we're in a sync context
            # Use the global broadcast loop if available
            global _broadcast_loop
            if _broadcast_loop and _broadcast_loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast(message), _broadcast_loop)
            else:
                # Create a new event loop in a thread
                def run_broadcast():
                    asyncio.run(manager.broadcast(message))
                threading.Thread(target=run_broadcast, daemon=True).start()
    except Exception as e:
        print(f"Broadcast error: {e}")


# --- Helper Functions (Ported from game_runner.py) ---


def _clean_action_name(action: str) -> str:
    """
    Ported from game_runner.py:
    Cleans up action name (remove annotations like '(on positions: [1, 3])')
    """
    if "(" in action:
        action = action.split("(")[0].strip()
    return action.replace(" ", "_")


def _execute_runner_action(
    game: MonopolyGameEngine, action: str, params: Dict
) -> Dict[str, Any]:
    """
    Ported from game_runner.py: execute_action
    Maps string actions to engine methods.
    """
    action_map = {
        "roll_dice_and_move": lambda: game.roll_and_move(),
        "buy_property": lambda: game.buy_current_property(),
        "decline_purchase": lambda: game.decline_purchase(),
        "pay_jail_bail": lambda: game.pay_bail(),
        "use_jail_card": lambda: game.use_jail_card(),
        "roll_for_doubles": lambda: game.roll_for_doubles(),
        "build_house": lambda: game.build_house(params.get("property_position", 0)),
        "mortgage": lambda: game.mortgage_property(
            params.get("property_position", 0)
        ),
        "unmortgage": lambda: game.unmortgage_property(
            params.get("property_position", 0)
        ),
        "end_turn": lambda: game.end_turn(),
    }

    if action in action_map:
        return action_map[action]()
    return {"error": f"Unknown action: {action}"}


def _save_game_state():
    """Helper to save current game state to persistence."""
    if state.is_game_started and state.game_engine:
        game_state = state.game_engine.get_full_state()
        game_state["registered_players"] = state.registered_players
        state.game_id = persistence.save_game_state(game_state, state.game_id)


# --- API Helper Functions (for routes.py integration) ---


def get_game_state_for_api() -> Dict[str, Any]:
    """Get game state for API endpoints."""
    if not state.is_game_started:
        return {"status": "lobby", "players": state.registered_players}
    return state.game_engine.get_full_state()


def register_player_for_api(player_name: str) -> str:
    """Register player via API."""
    with state.lock:
        if state.is_game_started:
            return "Error: Game has already started."
        if player_name in state.registered_players:
            return f"Error: Player '{player_name}' is already registered."

        state.registered_players.append(player_name)
        return f"Success: {player_name} joined. Total: {len(state.registered_players)}"


def start_game_for_api() -> str:
    """Start game via API."""
    with state.lock:
        if state.is_game_started:
            return "Error: Game already running."
        if len(state.registered_players) < 2:
            return "Error: Need at least 2 players."

        state.game_engine = MonopolyGameEngine(state.registered_players)
        init_res = state.game_engine.initialize()

        state.is_game_started = True
        state.actions_this_turn = 0
        
        _save_game_state()
        
        return f"Game Started! Players: {init_res['players']}"


def perform_action_for_api(player_name: str, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Perform action via API."""
    if params is None:
        params = {}
    
    with state.lock:
        if not state.is_game_started:
            return {"error": "Game not started"}

        game = state.game_engine

        # 1. Identity Check
        if game.current_player.name != player_name:
            return {
                "error": f"Not your turn. Current player: {game.current_player.name}"
            }

        # 2. Check Game Over / Max Turns
        if game.phase == GamePhase.GAME_OVER or game.turn_number >= state.max_turns:
            # Save final game stats
            final_state = game.get_full_state()
            persistence.save_game_stats({
                "game_id": state.game_id,
                "final_state": final_state,
                "total_turns": game.turn_number,
                "winner": _get_winner(game)
            })
            return {"error": "Game is over", "game_over": True}

        # 3. Clean Input (Runner Logic)
        clean_action = _clean_action_name(action)

        # 4. Execute (Runner Logic)
        result = _execute_runner_action(game, clean_action, params)

        # 5. Update Runner State (actions_this_turn)
        state.actions_this_turn += 1

        # Check for Turn End
        if clean_action == "end_turn" or game.phase == GamePhase.GAME_OVER:
            state.actions_this_turn = 0

        # Safety Valve: Force end turn if stuck
        if state.actions_this_turn > state.max_actions_per_turn:
            game._log(f"Forced end turn for {player_name} (max actions exceeded)")
            game.end_turn()
            state.actions_this_turn = 0
            result["warning"] = "Turn ended automatically due to action limit."

        # Save state after each action
        _save_game_state()

        return result


def _get_winner(game: MonopolyGameEngine) -> Optional[str]:
    """Get the winner of the game."""
    active = [name for name, player in game.players.items() if not player.bankrupt]
    return active[0] if len(active) == 1 else None


# --- MCP Tools ---


@mcp.tool
def register_as_player(player_name: str) -> str:
    """Register a new player. Only allowed BEFORE game starts."""
    result = register_player_for_api(player_name)
    # Broadcast player registration to all clients
    _broadcast_to_clients("player_registered", {
        "player_name": player_name,
        "message": result,
        "state": get_game_state_for_api()
    })
    return result


@mcp.tool
def start_game() -> str:
    """Starts the game if at least 2 players are registered."""
    result = start_game_for_api()
    # Broadcast game start to all clients
    _broadcast_to_clients("game_started", {
        "message": result,
        "state": get_game_state_for_api()
    })
    return result


@mcp.tool
def get_game_state() -> Dict[str, Any]:
    """Get the full game state."""
    return get_game_state_for_api()


@mcp.tool
def get_my_available_actions(player_name: str) -> Dict[str, Any]:
    """Get valid actions for a specific player."""
    if not state.is_game_started:
        return {"error": "Game not started"}

    current = state.game_engine.current_player.name
    if current != player_name:
        return {"is_your_turn": False, "current_player": current, "actions": []}

    return {"is_your_turn": True, **state.game_engine.get_available_actions()}


@mcp.tool
def perform_action(
    player_name: str, action: str, params: Dict[str, Any] = {}
) -> Dict[str, Any]:
    """
    Executes an action using the Game Runner logic (cleaning inputs, checking limits).
    """
    result = perform_action_for_api(player_name, action, params)
    # Broadcast action result to all clients
    _broadcast_to_clients("action_result", {
        "player_name": player_name,
        "action": action,
        "result": result,
        "state": get_game_state_for_api()
    })
    return result


@mcp.tool
def get_game_stats() -> Dict[str, Any]:
    """Get game statistics and history."""
    return persistence.get_game_stats_summary()


@mcp.tool
def reset_game() -> str:
    """Reset the game to initial state (lobby)."""
    result = reset_game_for_api()
    # Broadcast game reset to all clients
    _broadcast_to_clients("game_reset", {
        "message": result,
        "state": {"status": "lobby", "players": []}
    })
    return result


def reset_game_for_api() -> str:
    """Reset game via API."""
    with state.lock:
        # Save final state if game was in progress
        if state.is_game_started and state.game_engine:
            final_state = state.game_engine.get_full_state()
            persistence.save_game_stats({
                "game_id": state.game_id,
                "final_state": final_state,
                "total_turns": state.game_engine.turn_number,
                "status": "reset",
                "winner": None
            })
        
        # Reset state
        state.registered_players = []
        state.game_engine = None
        state.is_game_started = False
        state.game_id = None
        state.actions_this_turn = 0
        
        persistence.clear_current_game()
        
        return "Game reset successfully. Ready for new players."


# Setup API handlers
setup_game_handlers(
    state_getter=get_game_state_for_api,
    action_handler=perform_action_for_api,
    player_registrar=register_player_for_api,
    game_starter=start_game_for_api
)

# Setup reset handler
setup_game_resetter(reset_game_for_api)

# Setup orchestrator with callbacks
orchestrator.set_callbacks(
    broadcast_callback=_broadcast_to_clients,
    state_getter=get_game_state_for_api,
    action_handler=perform_action_for_api,
    player_registrar=register_player_for_api,
    game_starter=start_game_for_api
)
setup_orchestrator(orchestrator)

# Include API router in FastAPI app
app.include_router(api_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "game_started": state.is_game_started}


if __name__ == "__main__":
    import uvicorn

    # Run both MCP server and FastAPI
    # Option 1: Run MCP with SSE (for MCP clients) + FastAPI on different port
    
    def run_fastapi():
        global _broadcast_loop
        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        _broadcast_loop = loop
        
        config = uvicorn.Config(app, host="0.0.0.0", port=8001, loop="asyncio")
        server = uvicorn.Server(config)
        loop.run_until_complete(server.serve())
    
    # Start FastAPI in a separate thread
    api_thread = threading.Thread(target=run_fastapi, daemon=True)
    api_thread.start()
    
    print("FastAPI server running on http://0.0.0.0:8001")
    print("WebSocket endpoint: ws://localhost:8001/api/ws")
    print("MCP server running on http://0.0.0.0:8000")
    
    # Run MCP server (blocking)
    mcp.run(transport="sse", port=8000, host="0.0.0.0")
