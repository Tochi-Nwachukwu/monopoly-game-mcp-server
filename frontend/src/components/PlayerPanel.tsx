"use client";

import { Player, PLAYER_COLORS, TILE_DATA } from "@/types/game";

interface PlayerPanelProps {
  players: Record<string, Player>;
  playerOrder: string[];
  currentPlayer: string;
  myPlayerName: string | null;
}

export default function PlayerPanel({
  players,
  playerOrder,
  currentPlayer,
  myPlayerName,
}: PlayerPanelProps) {
  return (
    <div className="card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <h2 className="text-white/80 text-sm font-medium flex items-center gap-2 mb-3 sm:mb-4">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        Players ({playerOrder.length})
      </h2>
      
      {/* Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="flex xl:flex-col gap-3 overflow-x-auto pb-2 xl:pb-0 xl:overflow-visible snap-x snap-mandatory">
        {playerOrder.map((name, idx) => {
          const player = players[name];
          if (!player) return null;
          
          const isCurrentTurn = name === currentPlayer;
          const isMe = name === myPlayerName;
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const tileName = TILE_DATA[player.position]?.name || `Position ${player.position}`;
          
          return (
            <div
              key={name}
              className={`
                relative p-3 sm:p-4 rounded-xl transition-all duration-300
                min-w-[200px] sm:min-w-[240px] xl:min-w-0 snap-start
                ${isCurrentTurn 
                  ? "bg-white/15 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 border border-white/10"
                }
                ${player.bankrupt ? "opacity-50 grayscale" : ""}
              `}
            >
              {/* Current turn indicator */}
              {isCurrentTurn && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 sm:w-2 h-6 sm:h-8 
                              bg-emerald-400 rounded-r-full animate-pulse-soft" />
              )}
              
              {/* Player header */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
                           text-white font-bold shadow-lg text-sm sm:text-base flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm sm:text-base truncate">{name}</span>
                    {isMe && (
                      <span className="text-[10px] sm:text-xs text-cyan-400 bg-cyan-400/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    {player.bankrupt && (
                      <span className="text-[10px] sm:text-xs text-red-400 bg-red-400/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                        Bankrupt
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-[10px] sm:text-xs truncate">{tileName}</p>
                </div>
                {isCurrentTurn && (
                  <span className="text-emerald-400 animate-bounce-subtle flex-shrink-0">▶</span>
                )}
              </div>
              
              {/* Player stats */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="bg-white/5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-white/50 text-[10px] sm:text-xs">Money</p>
                  <p className={`font-mono font-bold text-xs sm:text-sm ${player.money < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    ${player.money.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-white/50 text-[10px] sm:text-xs">Properties</p>
                  <p className="text-white font-bold text-xs sm:text-sm">{player.property_positions.length}</p>
                </div>
              </div>
              
              {/* Jail status */}
              {player.in_jail && (
                <div className="mt-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-500/20 rounded-lg text-orange-400 text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
                  <span>🔒</span>
                  <span>In Jail ({3 - player.jail_turns} left)</span>
                </div>
              )}
              
              {/* Jail cards */}
              {player.jail_cards > 0 && (
                <div className="mt-2 text-[10px] sm:text-xs text-white/60">
                  🎫 {player.jail_cards} Jail Free card{player.jail_cards > 1 ? "s" : ""}
                </div>
              )}
              
              {/* Properties list (collapsed on mobile, shown on desktop) */}
              {player.properties.length > 0 && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10 hidden sm:block">
                  <p className="text-white/50 text-[10px] sm:text-xs mb-1.5 sm:mb-2">Properties</p>
                  <div className="flex flex-wrap gap-1">
                    {player.property_positions.slice(0, 6).map((pos) => {
                      const tile = TILE_DATA[pos];
                      const tileColor = tile?.color;
                      return (
                        <div
                          key={pos}
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm border border-white/20"
                          style={{ 
                            backgroundColor: tileColor 
                              ? {
                                  brown: "#955436",
                                  light_blue: "#aae0fa",
                                  pink: "#d93a96",
                                  orange: "#f7941d",
                                  red: "#ed1b24",
                                  yellow: "#fef200",
                                  green: "#1fb25a",
                                  dark_blue: "#0072bb",
                                }[tileColor] 
                              : "#666" 
                          }}
                          title={tile?.name}
                        />
                      );
                    })}
                    {player.property_positions.length > 6 && (
                      <span className="text-white/40 text-[10px] sm:text-xs">
                        +{player.property_positions.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
