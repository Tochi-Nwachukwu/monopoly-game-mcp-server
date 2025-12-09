"use client";

import { TILE_DATA, COLOR_MAP, PLAYER_COLORS, Player } from "@/types/game";

interface GameBoardProps {
  players: Record<string, Player>;
  playerOrder: string[];
}

function getTileClass(type: string, color?: string): string {
  const baseClass = "tile-property";
  if (color && COLOR_MAP[color]) {
    return `${baseClass} tile-${color.replace("_", "-")}`;
  }
  return "";
}

function TileIcon({ type }: { type: string }) {
  switch (type) {
    case "go":
      return <span className="text-2xl">→</span>;
    case "jail":
      return <span className="text-xl">🔒</span>;
    case "free_parking":
      return <span className="text-xl">🅿️</span>;
    case "go_to_jail":
      return <span className="text-xl">👮</span>;
    case "chance":
      return <span className="text-xl">❓</span>;
    case "community_chest":
      return <span className="text-xl">💰</span>;
    case "tax":
      return <span className="text-xl">💸</span>;
    case "railroad":
      return <span className="text-xl">🚂</span>;
    case "utility":
      return <span className="text-xl">💡</span>;
    default:
      return null;
  }
}

function Tile({ 
  position, 
  playersOnTile, 
  playerOrder 
}: { 
  position: number; 
  playersOnTile: string[];
  playerOrder: string[];
}) {
  const tile = TILE_DATA[position];
  const isCorner = [0, 10, 20, 30].includes(position);
  const tileColor = tile.color ? COLOR_MAP[tile.color] : undefined;
  
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center p-1 
        bg-[#e8f5e9] border border-[#2e7d32]/30
        ${isCorner ? "col-span-1 row-span-1" : ""}
        ${getTileClass(tile.type, tile.color)}
        transition-all hover:bg-[#c8e6c9] group
      `}
      style={{ minHeight: isCorner ? "80px" : "60px" }}
    >
      {/* Color band for properties */}
      {tileColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-3"
          style={{ backgroundColor: tileColor }}
        />
      )}
      
      {/* Tile content */}
      <div className={`text-center ${tileColor ? "mt-2" : ""}`}>
        <TileIcon type={tile.type} />
        <p className="text-[8px] leading-tight font-medium text-gray-700 line-clamp-2">
          {tile.name}
        </p>
        {tile.price && (
          <p className="text-[7px] text-gray-500">${tile.price}</p>
        )}
      </div>
      
      {/* Players on tile */}
      {playersOnTile.length > 0 && (
        <div className="absolute bottom-1 flex gap-0.5 flex-wrap justify-center">
          {playersOnTile.map((playerName) => {
            const playerIdx = playerOrder.indexOf(playerName);
            return (
              <div
                key={playerName}
                className="w-4 h-4 rounded-full border border-white shadow-sm animate-player-move"
                style={{ backgroundColor: PLAYER_COLORS[playerIdx % PLAYER_COLORS.length] }}
                title={playerName}
              />
            );
          })}
        </div>
      )}
      
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                    bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                    transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tile.name}
      </div>
    </div>
  );
}

export default function GameBoard({ players, playerOrder }: GameBoardProps) {
  // Get player positions
  const getPlayersOnTile = (position: number): string[] => {
    return Object.entries(players)
      .filter(([, player]) => player.position === position)
      .map(([name]) => name);
  };

  // Board layout - positions around the board
  const bottomRow = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // Left to right (reversed)
  const leftCol = [11, 12, 13, 14, 15, 16, 17, 18, 19]; // Top to bottom
  const topRow = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]; // Left to right
  const rightCol = [39, 38, 37, 36, 35, 34, 33, 32, 31]; // Bottom to top (reversed)

  return (
    <div className="card-glass rounded-2xl p-4 overflow-auto">
      <div className="grid grid-cols-11 gap-0.5 bg-[#2e7d32]/20 p-1 rounded-xl min-w-[600px]">
        {/* Top row */}
        {topRow.map((pos) => (
          <Tile 
            key={pos} 
            position={pos} 
            playersOnTile={getPlayersOnTile(pos)}
            playerOrder={playerOrder}
          />
        ))}
        
        {/* Middle section */}
        {leftCol.map((leftPos, idx) => (
          <div key={`row-${idx}`} className="contents">
            {/* Left tile */}
            <Tile 
              position={leftPos} 
              playersOnTile={getPlayersOnTile(leftPos)}
              playerOrder={playerOrder}
            />
            
            {/* Center area (9 columns) */}
            {idx === 0 && (
              <div className="col-span-9 row-span-9 bg-[#c8e6c9] rounded-lg flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="monopoly-title text-4xl font-bold text-[#2e7d32] mb-2">
                    MONOPOLY
                  </h2>
                  <div className="w-24 h-1 mx-auto bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                  <p className="text-[#2e7d32]/60 text-sm mt-4 font-body">
                    Real-Time Edition
                  </p>
                </div>
              </div>
            )}
            
            {/* Right tile */}
            <Tile 
              position={rightCol[idx]} 
              playersOnTile={getPlayersOnTile(rightCol[idx])}
              playerOrder={playerOrder}
            />
          </div>
        ))}
        
        {/* Bottom row */}
        {bottomRow.map((pos) => (
          <Tile 
            key={pos} 
            position={pos} 
            playersOnTile={getPlayersOnTile(pos)}
            playerOrder={playerOrder}
          />
        ))}
      </div>
    </div>
  );
}

