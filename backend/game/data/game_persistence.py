"""
Game persistence layer - saves and loads game state to/from JSON files.
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path


class GamePersistence:
    def __init__(self, data_dir: str = None):
        # Use absolute path relative to backend directory for consistent file location
        if data_dir is None:
            backend_dir = Path(__file__).parent.parent.parent
            self.data_dir = backend_dir / "game_data"
        else:
            self.data_dir = Path(data_dir)
        
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.current_game_file = self.data_dir / "current_game.json"
        self.game_history_file = self.data_dir / "game_history.json"
        self.stats_file = self.data_dir / "game_stats.json"
    
    def save_game_state(self, game_state: Dict[str, Any], game_id: Optional[str] = None) -> str:
        """Save the current game state to a JSON file."""
        if game_id is None:
            game_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        save_data = {
            "game_id": game_id,
            "timestamp": datetime.now().isoformat(),
            "state": game_state
        }
        
        # Save current game state
        with open(self.current_game_file, 'w') as f:
            json.dump(save_data, f, indent=2, default=str)
        
        return game_id
    
    def load_game_state(self) -> Optional[Dict[str, Any]]:
        """Load the current game state from JSON file."""
        if not self.current_game_file.exists():
            return None
        
        try:
            with open(self.current_game_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    
    def save_game_stats(self, stats: Dict[str, Any]) -> None:
        """Save game statistics (for completed games)."""
        history = self.load_game_history()
        history.append({
            "timestamp": datetime.now().isoformat(),
            **stats
        })
        
        with open(self.game_history_file, 'w') as f:
            json.dump(history, f, indent=2, default=str)
    
    def load_game_history(self) -> list:
        """Load game history."""
        if not self.game_history_file.exists():
            return []
        
        try:
            with open(self.game_history_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    
    def get_game_stats_summary(self) -> Dict[str, Any]:
        """Get a summary of all game statistics."""
        history = self.load_game_history()
        current_game = self.load_game_state()
        all_time_stats = self._load_all_time_stats()
        
        if not history and all_time_stats.get("total_games", 0) == 0:
            return {
                "total_games": 0,
                "total_turns_played": 0,
                "average_turns_per_game": 0,
                "win_counts": {},
                "recent_games": [],
                "current_game": current_game,
                "all_time_stats": all_time_stats
            }
        
        # Calculate stats from history
        total_turns = sum(g.get("total_turns", 0) for g in history)
        winners = {}
        for game in history:
            winner = game.get("winner")
            if winner:
                winners[winner] = winners.get(winner, 0) + 1
        
        # Merge with all-time stats
        merged_winners = {**all_time_stats.get("win_counts", {})}
        for player, wins in winners.items():
            merged_winners[player] = merged_winners.get(player, 0) + wins
        
        total_games = len(history) + all_time_stats.get("total_games", 0)
        all_turns = total_turns + all_time_stats.get("total_turns_played", 0)
        
        return {
            "total_games": total_games,
            "total_turns_played": all_turns,
            "average_turns_per_game": all_turns // total_games if total_games else 0,
            "win_counts": merged_winners,
            "recent_games": history[-10:],  # Last 10 games
            "current_game": current_game,
            "all_time_stats": all_time_stats
        }
    
    def _load_all_time_stats(self) -> Dict[str, Any]:
        """Load all-time aggregated statistics."""
        if not self.stats_file.exists():
            return {"total_games": 0, "total_turns_played": 0, "win_counts": {}}
        
        try:
            with open(self.stats_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"total_games": 0, "total_turns_played": 0, "win_counts": {}}
    
    def _save_all_time_stats(self, stats: Dict[str, Any]) -> None:
        """Save all-time aggregated statistics."""
        with open(self.stats_file, 'w') as f:
            json.dump(stats, f, indent=2, default=str)
    
    def clear_current_game(self) -> None:
        """Clear the current game state."""
        if self.current_game_file.exists():
            os.remove(self.current_game_file)
    
    def get_current_game_stats(self) -> Dict[str, Any]:
        """Get current game statistics for live display."""
        current = self.load_game_state()
        if not current:
            return {"active": False}
        
        state = current.get("state", {})
        players = state.get("players", {})
        
        # Calculate current game stats
        player_stats = {}
        total_properties_owned = 0
        total_money_in_game = 0
        
        for name, player in players.items():
            if isinstance(player, dict):
                money = player.get("money", 0)
                properties = player.get("property_positions", [])
                player_stats[name] = {
                    "money": money,
                    "properties": len(properties),
                    "property_positions": properties,
                    "in_jail": player.get("in_jail", False),
                    "bankrupt": player.get("bankrupt", False),
                    "jail_cards": player.get("jail_cards", 0),
                    "position": player.get("position", 0),
                    "tile_name": player.get("tile_name", ""),
                }
                total_properties_owned += len(properties)
                total_money_in_game += money
        
        return {
            "active": True,
            "game_id": current.get("game_id"),
            "turn_number": state.get("turn_number", 0),
            "phase": state.get("phase"),
            "current_player": state.get("current_player"),
            "player_stats": player_stats,
            "last_updated": current.get("timestamp"),
            "last_dice": state.get("last_dice"),
            "recent_messages": state.get("recent_messages", [])[-5:],
            "game_summary": {
                "total_properties_owned": total_properties_owned,
                "total_money_in_game": total_money_in_game,
                "active_players": sum(1 for p in player_stats.values() if not p.get("bankrupt")),
            }
        }
    
    def get_live_game_data(self) -> Dict[str, Any]:
        """Get complete live game data for WebSocket broadcast."""
        current = self.load_game_state()
        if not current:
            return {
                "active": False,
                "status": "no_game"
            }
        
        state = current.get("state", {})
        return {
            "active": True,
            "status": "in_progress",
            "game_id": current.get("game_id"),
            "timestamp": current.get("timestamp"),
            "state": state
        }


# Global persistence instance
persistence = GamePersistence()

