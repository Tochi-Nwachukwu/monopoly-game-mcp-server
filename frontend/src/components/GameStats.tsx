"use client";

import { useState, useEffect, useCallback } from "react";

interface GameStatsData {
  total_games: number;
  total_turns_played: number;
  average_turns_per_game: number;
  win_counts: Record<string, number>;
  recent_games: Array<{
    timestamp: string;
    game_id: string;
    winner?: string;
    total_turns?: number;
    status?: string;
  }>;
  current_game?: {
    game_id: string;
    timestamp: string;
    state: Record<string, unknown>;
  } | null;
}

interface CurrentGameStats {
  active: boolean;
  game_id?: string;
  turn_number?: number;
  phase?: string;
  current_player?: string;
  player_stats?: Record<string, {
    money: number;
    properties: number;
    in_jail: boolean;
    bankrupt: boolean;
    position?: number;
    tile_name?: string;
  }>;
  last_updated?: string;
  last_dice?: [number, number];
  recent_messages?: string[];
  game_summary?: {
    total_properties_owned: number;
    total_money_in_game: number;
    active_players: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function GameStats() {
  const [stats, setStats] = useState<GameStatsData | null>(null);
  const [currentStats, setCurrentStats] = useState<CurrentGameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, currentRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/stats/current`)
      ]);
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      
      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentStats(data);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds for more real-time feel
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="card-glass rounded-2xl p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/2" />
          <div className="h-16 bg-white/10 rounded" />
          <div className="h-24 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white/80 text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Game Statistics
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStats}
            className="text-white/40 hover:text-white/80 transition-colors text-sm 
                     hover:rotate-180 transition-transform duration-500"
            title="Refresh stats"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 
                      border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-amber-300/80 text-xs mb-1 uppercase tracking-wider">Games</p>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            {stats?.total_games || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 
                      border border-cyan-500/20 rounded-xl p-3 text-center">
          <p className="text-cyan-300/80 text-xs mb-1 uppercase tracking-wider">Turns</p>
          <p className="text-2xl font-bold text-cyan-400 font-mono">
            {stats?.total_turns_played || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 
                      border border-purple-500/20 rounded-xl p-3 text-center">
          <p className="text-purple-300/80 text-xs mb-1 uppercase tracking-wider">Avg</p>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            {stats?.average_turns_per_game || 0}
          </p>
        </div>
      </div>

      {/* Current Game Status */}
      {currentStats?.active && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 
                      border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent 
                        animate-pulse opacity-50" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full 
                              bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">
                Live Game
              </span>
            </div>
            
            {/* Game Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-white/50 text-xs">Turn</p>
                <p className="text-white font-mono text-lg font-bold">
                  #{currentStats.turn_number}
                </p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-white/50 text-xs">Phase</p>
                <p className="text-white font-mono text-sm capitalize truncate">
                  {currentStats.phase?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            
            {/* Current Player Highlight */}
            <div className="mt-3 bg-black/20 rounded-lg px-3 py-2">
              <p className="text-white/50 text-xs mb-1">Currently Playing</p>
              <p className="text-emerald-400 font-bold text-lg truncate">
                🎮 {currentStats.current_player}
              </p>
            </div>
            
            {/* Game Summary */}
            {currentStats.game_summary && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-white/40">Players</p>
                  <p className="text-white font-mono">
                    {currentStats.game_summary.active_players}
                  </p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-white/40">Properties</p>
                  <p className="text-white font-mono">
                    {currentStats.game_summary.total_properties_owned}
                  </p>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <p className="text-white/40">Total $</p>
                  <p className="text-emerald-400 font-mono">
                    {(currentStats.game_summary.total_money_in_game / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            )}
            
            {/* Last Dice */}
            {currentStats.last_dice && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-white/40 text-xs">Last Roll:</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded font-mono font-bold text-sm">
                  {currentStats.last_dice[0]}
                </span>
                <span className="text-white/60">+</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded font-mono font-bold text-sm">
                  {currentStats.last_dice[1]}
                </span>
                <span className="text-white/40">=</span>
                <span className="text-yellow-400 font-mono font-bold">
                  {currentStats.last_dice[0] + currentStats.last_dice[1]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win Leaderboard */}
      {stats?.win_counts && Object.keys(stats.win_counts).length > 0 && (
        <div>
          <p className="text-white/50 text-xs mb-2 uppercase tracking-wider flex items-center gap-2">
            <span>🏆</span>
            Win Leaderboard
          </p>
          <div className="space-y-1">
            {Object.entries(stats.win_counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([player, wins], idx) => (
                <div
                  key={player}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all
                            ${idx === 0 
                              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30" 
                              : "bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      idx === 0 ? "text-yellow-400" : 
                      idx === 1 ? "text-gray-300" : 
                      idx === 2 ? "text-amber-600" : "text-white/60"
                    }`}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                    </span>
                    <span className={`text-sm truncate ${idx === 0 ? "text-yellow-100 font-semibold" : "text-white"}`}>
                      {player}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${idx === 0 ? "text-yellow-400" : "text-amber-400"}`}>
                    {wins}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Games Toggle */}
      {stats?.recent_games && stats.recent_games.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-white/50 text-xs 
                     hover:text-white/80 transition-colors py-2 group"
          >
            <span className="uppercase tracking-wider flex items-center gap-2">
              <span>📜</span>
              Recent Games ({stats.recent_games.length})
            </span>
            <span 
              className="transform transition-transform duration-300 group-hover:text-white"
              style={{ transform: showHistory ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
          </button>
          
          {showHistory && (
            <div className="space-y-2 animate-slide-up">
              {stats.recent_games.slice().reverse().map((game, idx) => (
                <div
                  key={game.game_id || idx}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-sm 
                           transition-all border border-white/5 hover:border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/40 text-xs font-mono">
                      {new Date(game.timestamp).toLocaleDateString()} 
                      <span className="text-white/30 ml-1">
                        {new Date(game.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    {game.status === "reset" && (
                      <span className="text-orange-400 text-xs bg-orange-500/20 px-2 py-0.5 rounded">
                        Reset
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white flex items-center gap-1">
                      {game.winner ? (
                        <>
                          <span className="text-yellow-400">🏆</span>
                          <span className="font-semibold">{game.winner}</span>
                        </>
                      ) : (
                        <span className="text-white/50 italic">No winner</span>
                      )}
                    </span>
                    {game.total_turns && (
                      <span className="text-white/60 font-mono text-xs bg-white/10 px-2 py-1 rounded">
                        {game.total_turns} turns
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No games yet */}
      {(!stats || stats.total_games === 0) && !currentStats?.active && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎲</div>
          <p className="text-white/40 text-sm italic">
            No games played yet
          </p>
          <p className="text-white/30 text-xs mt-1">
            Start your first game!
          </p>
        </div>
      )}
    </div>
  );
}
