# Monopoly Game MCP Server

A real-time Monopoly game server with MCP (Model Context Protocol) support, REST API, and WebSocket endpoints.

## Features

- 🎮 **Full Monopoly Game Engine** - Complete game logic with properties, railroads, utilities, cards, and more
- 🔌 **MCP Server** - Model Context Protocol support for AI agent integration
- 🌐 **REST API** - FastAPI-based REST endpoints for game management
- 📡 **WebSocket** - Real-time game updates via WebSocket
- 💾 **Game Persistence** - Game state saved to JSON files
- 📊 **Statistics** - Track game history, wins, and player stats

## Project Structure

```
backend/
├── api/
│   ├── __init__.py
│   └── routes.py          # FastAPI routes & WebSocket handler
├── game/
│   ├── data/
│   │   ├── card_decks.py  # Chance & Community Chest cards
│   │   ├── game_persistence.py  # JSON file persistence
│   │   ├── player.py      # Player data model
│   │   ├── property.py    # Property data model
│   │   └── tiles.py       # Board tile definitions
│   └── logic/
│       └── game_engine.py # Core game logic
├── game_data/             # Saved game JSON files (auto-created)
├── main.py
├── mcp_server.py          # Main server with MCP + FastAPI
└── pyproject.toml
```

## Installation

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager (recommended)

### Setup

```bash
cd backend

# Using uv (recommended)
uv sync

# Or using pip
pip install -e .
```

## Running the Server

```bash
cd backend

# Using uv
uv run python mcp_server.py

# Or directly
python mcp_server.py
```

This starts:
- **FastAPI server** on `http://localhost:8001`
- **MCP server** on `http://localhost:8000`
- **WebSocket endpoint** at `ws://localhost:8001/api/ws`

## API Endpoints

### REST API (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/status` | Get current game status |
| GET | `/api/players` | Get registered players |
| POST | `/api/players/register?player_name=NAME` | Register a player |
| POST | `/api/game/start` | Start the game |
| POST | `/api/game/action` | Perform a game action |
| POST | `/api/game/reset` | Reset to lobby |
| GET | `/api/stats` | Get game statistics summary |
| GET | `/api/stats/current` | Get current game live stats |
| GET | `/api/game/live` | Get live game data |
| GET | `/api/game/saved` | Get raw saved game JSON |
| GET | `/api/history` | Get game history |

### WebSocket API

Connect to `ws://localhost:8001/api/ws`

**Send Messages:**
```json
{ "type": "register_player", "player_name": "Alice" }
{ "type": "start_game" }
{ "type": "action", "player_name": "Alice", "action": "roll_dice_and_move" }
{ "type": "action", "player_name": "Alice", "action": "buy_property" }
{ "type": "action", "player_name": "Alice", "action": "end_turn" }
{ "type": "get_state" }
{ "type": "reset_game" }
{ "type": "ping" }
```

**Receive Messages:**
```json
{ "type": "connected", "state": {...} }
{ "type": "player_registered", "player_name": "Alice", "message": "...", "state": {...} }
{ "type": "game_started", "message": "...", "state": {...} }
{ "type": "action_result", "player_name": "Alice", "action": "...", "result": {...}, "state": {...} }
{ "type": "game_reset", "message": "...", "state": {...} }
{ "type": "pong" }
```

### MCP Tools (Port 8000)

| Tool | Description |
|------|-------------|
| `register_as_player` | Register a new player |
| `start_game` | Start the game |
| `get_game_state` | Get full game state |
| `get_my_available_actions` | Get valid actions for a player |
| `perform_action` | Execute a game action |
| `get_game_stats` | Get game statistics |
| `reset_game` | Reset to lobby |

## Game Actions

| Action | When Available | Parameters |
|--------|----------------|------------|
| `roll_dice_and_move` | `waiting_for_roll` phase | None |
| `buy_property` | `waiting_for_buy_decision` phase | None |
| `decline_purchase` | `waiting_for_buy_decision` phase | None |
| `end_turn` | `turn_complete` phase | None |
| `pay_jail_bail` | `in_jail` phase | None |
| `use_jail_card` | `in_jail` phase (if has card) | None |
| `roll_for_doubles` | `in_jail` phase | None |
| `build_house` | Anytime (if owns monopoly) | `property_position: int` |
| `mortgage` | Anytime | `property_position: int` |
| `unmortgage` | Anytime | `property_position: int` |

## Game Data Persistence

Game data is automatically saved to `backend/game_data/`:

- `current_game.json` - Current game state
- `game_history.json` - Completed games history
- `game_stats.json` - All-time statistics

### Sample Game State Structure

```json
{
  "game_id": "20241208_143052",
  "timestamp": "2024-12-08T14:30:52.123456",
  "state": {
    "phase": "waiting_for_roll",
    "current_player": "Alice",
    "turn_number": 5,
    "players": {
      "Alice": {
        "money": 1350,
        "position": 11,
        "tile_name": "St. Charles Place",
        "in_jail": false,
        "properties": ["Mediterranean Avenue"],
        "property_positions": [1],
        "bankrupt": false
      }
    },
    "last_dice": [4, 3],
    "recent_messages": ["Alice rolled [4][3] = 7", "..."]
  }
}
```

## Development

### Running Tests

```bash
cd backend
uv run pytest
```

### Code Structure

- **game_engine.py**: Core game logic with phases, actions, and rules
- **mcp_server.py**: MCP + FastAPI server setup and state management
- **routes.py**: REST and WebSocket endpoint handlers
- **game_persistence.py**: JSON file save/load operations

## Frontend Integration

See the `../frontend/` directory for the Next.js frontend that connects to this server via WebSocket.

## License

MIT

