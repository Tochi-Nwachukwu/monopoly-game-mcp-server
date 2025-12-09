"""
FastAPI routes for the Monopoly game API with WebSocket support.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Set
import asyncio
import json

router = APIRouter(prefix="/api", tags=["game"])


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)


# Global connection manager instance
manager = ConnectionManager()


# Import state from mcp_server (will be set up in app setup)
_game_state_getter = None
_game_action_handler = None
_player_registrar = None
_game_starter = None


def setup_game_handlers(
    state_getter,
    action_handler,
    player_registrar,
    game_starter
):
    """Setup handlers from mcp_server state."""
    global _game_state_getter, _game_action_handler, _player_registrar, _game_starter
    _game_state_getter = state_getter
    _game_action_handler = action_handler
    _player_registrar = player_registrar
    _game_starter = game_starter


@router.get("/status")
async def get_game_status():
    """Get the current game status."""
    if _game_state_getter is None:
        raise HTTPException(status_code=500, detail="Game handlers not initialized")
    
    state = _game_state_getter()
    return JSONResponse(content=state)


@router.get("/players")
async def get_players():
    """Get all registered players."""
    if _game_state_getter is None:
        raise HTTPException(status_code=500, detail="Game handlers not initialized")
    
    state = _game_state_getter()
    if "players" in state:
        return JSONResponse(content={"players": state.get("players", {})})
    return JSONResponse(content={"players": []})


@router.post("/players/register")
async def register_player(player_name: str):
    """Register a new player."""
    if _player_registrar is None:
        raise HTTPException(status_code=500, detail="Game handlers not initialized")
    
    result = _player_registrar(player_name)
    
    # Broadcast player registration
    await manager.broadcast({
        "type": "player_registered",
        "player_name": player_name,
        "message": result
    })
    
    return JSONResponse(content={"result": result})


@router.post("/game/start")
async def start_game():
    """Start the game."""
    if _game_starter is None:
        raise HTTPException(status_code=500, detail="Game handlers not initialized")
    
    result = _game_starter()
    
    # Broadcast game start
    await manager.broadcast({
        "type": "game_started",
        "message": result,
        "state": _game_state_getter() if _game_state_getter else {}
    })
    
    return JSONResponse(content={"result": result})


@router.post("/game/action")
async def perform_action(player_name: str, action: str, params: Dict[str, Any] = None):
    """Perform a game action."""
    if _game_action_handler is None:
        raise HTTPException(status_code=500, detail="Game handlers not initialized")
    
    if params is None:
        params = {}
    
    result = _game_action_handler(player_name, action, params)
    
    # Broadcast action result
    await manager.broadcast({
        "type": "action_performed",
        "player_name": player_name,
        "action": action,
        "result": result,
        "state": _game_state_getter() if _game_state_getter else {}
    })
    
    return JSONResponse(content=result)


@router.get("/stats")
async def get_game_stats():
    """Get game statistics."""
    from game.data.game_persistence import persistence
    
    stats = persistence.get_game_stats_summary()
    return JSONResponse(content=stats)


@router.get("/history")
async def get_game_history():
    """Get game history."""
    from game.data.game_persistence import persistence
    
    history = persistence.load_game_history()
    return JSONResponse(content={"history": history})


@router.get("/stats/current")
async def get_current_game_stats():
    """Get current game statistics for live display."""
    from game.data.game_persistence import persistence
    
    stats = persistence.get_current_game_stats()
    return JSONResponse(content=stats)


@router.get("/game/live")
async def get_live_game_data():
    """Get live game data for real-time display."""
    from game.data.game_persistence import persistence
    
    data = persistence.get_live_game_data()
    return JSONResponse(content=data)


@router.get("/game/saved")
async def get_saved_game_file():
    """Get the raw saved game JSON file contents."""
    from game.data.game_persistence import persistence
    
    state = persistence.load_game_state()
    if state is None:
        return JSONResponse(content={"error": "No saved game found"}, status_code=404)
    return JSONResponse(content=state)


# Game reset handler (will be set up from mcp_server)
_game_resetter = None


def setup_game_resetter(resetter):
    """Setup game reset handler."""
    global _game_resetter
    _game_resetter = resetter


@router.post("/game/reset")
async def reset_game():
    """Reset the game to lobby state."""
    if _game_resetter is None:
        raise HTTPException(status_code=500, detail="Game reset handler not initialized")
    
    result = _game_resetter()
    
    # Broadcast game reset
    await manager.broadcast({
        "type": "game_reset",
        "message": result,
        "state": _game_state_getter() if _game_state_getter else {"status": "lobby", "players": []}
    })
    
    return JSONResponse(content={"result": result})


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time game updates."""
    await manager.connect(websocket)
    
    try:
        # Send initial state
        if _game_state_getter:
            await manager.send_personal(websocket, {
                "type": "connected",
                "state": _game_state_getter()
            })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            message_type = data.get("type", "")
            
            if message_type == "register_player":
                player_name = data.get("player_name", "")
                if _player_registrar:
                    result = _player_registrar(player_name)
                    await manager.broadcast({
                        "type": "player_registered",
                        "player_name": player_name,
                        "message": result,
                        "state": _game_state_getter() if _game_state_getter else {}
                    })
            
            elif message_type == "start_game":
                if _game_starter:
                    result = _game_starter()
                    await manager.broadcast({
                        "type": "game_started",
                        "message": result,
                        "state": _game_state_getter() if _game_state_getter else {}
                    })
            
            elif message_type == "action":
                player_name = data.get("player_name", "")
                action = data.get("action", "")
                params = data.get("params", {})
                
                if _game_action_handler:
                    result = _game_action_handler(player_name, action, params)
                    await manager.broadcast({
                        "type": "action_result",
                        "player_name": player_name,
                        "action": action,
                        "result": result,
                        "state": _game_state_getter() if _game_state_getter else {}
                    })
            
            elif message_type == "get_state":
                if _game_state_getter:
                    await manager.send_personal(websocket, {
                        "type": "state_update",
                        "state": _game_state_getter()
                    })
            
            elif message_type == "reset_game":
                if _game_resetter:
                    # Also stop any running agent game
                    if _orchestrator and _orchestrator.is_running:
                        _orchestrator.stop_game()
                    result = _game_resetter()
                    await manager.broadcast({
                        "type": "game_reset",
                        "message": result,
                        "state": _game_state_getter() if _game_state_getter else {"status": "lobby", "players": []}
                    })
            
            elif message_type == "start_agent_game":
                agent_ids = data.get("agent_ids", [])
                if _orchestrator and len(agent_ids) >= 2 and len(agent_ids) <= 4:
                    # Reset first
                    if _game_resetter:
                        _game_resetter()
                    result = await _orchestrator.start_game(agent_ids)
                    await manager.broadcast({
                        "type": "agent_game_started",
                        "result": result,
                        "state": _game_state_getter() if _game_state_getter else {}
                    })
                else:
                    await manager.send_personal(websocket, {
                        "type": "error",
                        "message": "Invalid agent selection (need 2-4 agents)"
                    })
            
            elif message_type == "stop_agent_game":
                if _orchestrator:
                    result = _orchestrator.stop_game()
                    await manager.broadcast({
                        "type": "agent_game_stopped",
                        "result": result
                    })
            
            elif message_type == "get_thoughts":
                if _orchestrator:
                    thoughts = _orchestrator.get_recent_thoughts(data.get("limit", 20))
                    await manager.send_personal(websocket, {
                        "type": "thoughts_update",
                        "thoughts": thoughts
                    })
            
            elif message_type == "ping":
                await manager.send_personal(websocket, {"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


async def broadcast_game_update(update_type: str, data: Dict[str, Any]):
    """Helper function to broadcast game updates from outside the router."""
    await manager.broadcast({
        "type": update_type,
        **data
    })


def get_connection_manager():
    """Get the connection manager for external broadcasting."""
    return manager


async def broadcast_state_update(state: Dict[str, Any], update_type: str = "state_update"):
    """Broadcast a state update to all connected clients."""
    await manager.broadcast({
        "type": update_type,
        "state": state
    })


# --- AI Agent Routes ---

_orchestrator = None


def setup_orchestrator(orchestrator):
    """Setup the game orchestrator."""
    global _orchestrator
    _orchestrator = orchestrator


@router.get("/agents")
async def get_available_agents():
    """Get list of available AI agents."""
    from agents.agent_config import AVAILABLE_AGENTS
    
    # Return agent info (model-based agents)
    agents = [
        {
            "id": agent["id"],
            "name": agent["name"],
            "emoji": agent["emoji"],
            "color": agent["color"],
            "provider": agent["provider"],
            "model_id": agent["model_id"],
            "description": agent["description"]
        }
        for agent in AVAILABLE_AGENTS
    ]
    
    return JSONResponse(content={"agents": agents})


@router.post("/agents/start-game")
async def start_agent_game(agent_ids: List[str]):
    """Start a game with selected AI agents."""
    if _orchestrator is None:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")
    
    if len(agent_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 agents")
    
    if len(agent_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 agents allowed")
    
    # Reset the game first
    if _game_resetter:
        _game_resetter()
    
    # Start agent game
    result = await _orchestrator.start_game(agent_ids)
    
    # Broadcast game start
    await manager.broadcast({
        "type": "agent_game_started",
        "result": result,
        "state": _game_state_getter() if _game_state_getter else {}
    })
    
    return JSONResponse(content=result)


@router.post("/agents/stop-game")
async def stop_agent_game():
    """Stop the current AI agent game."""
    if _orchestrator is None:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")
    
    result = _orchestrator.stop_game()
    
    # Broadcast game stop
    await manager.broadcast({
        "type": "agent_game_stopped",
        "result": result
    })
    
    return JSONResponse(content=result)


@router.get("/agents/thoughts")
async def get_agent_thoughts(limit: int = 20):
    """Get recent AI agent thoughts/reasoning."""
    if _orchestrator is None:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")
    
    thoughts = _orchestrator.get_recent_thoughts(limit)
    return JSONResponse(content={"thoughts": thoughts})


@router.get("/agents/status")
async def get_agent_game_status():
    """Get current agent game status."""
    if _orchestrator is None:
        return JSONResponse(content={"running": False, "agents": []})
    
    from agents.agent_config import get_agent_by_id
    
    selected = []
    for aid in _orchestrator.selected_agents:
        agent = get_agent_by_id(aid)
        if agent:
            selected.append({
                "id": agent["id"],
                "name": agent["name"],
                "emoji": agent["emoji"],
                "color": agent["color"]
            })
    
    return JSONResponse(content={
        "running": _orchestrator.is_running,
        "agents": selected
    })

