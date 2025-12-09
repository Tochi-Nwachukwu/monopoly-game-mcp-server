"use client";

import { useState, useEffect } from "react";
import { GameState, Player } from "@/types/game";
import GameBoard from "./GameBoard";
import PlayerPanel from "./PlayerPanel";
import DiceDisplay from "./DiceDisplay";
import ActionsPanel from "./ActionsPanel";
import MessageLog from "./MessageLog";
import GameStats from "./GameStats";

interface GameViewProps {
  gameState: GameState;
  myPlayerName: string | null;
  onAction: (action: string, params?: Record<string, unknown>) => void;
  lastDice: [number, number] | null;
  onResetGame?: () => void;
  isAIGame?: boolean;
  isAIRunning?: boolean;
  onStopAI?: () => void;
}

export default function GameView({
  gameState,
  myPlayerName,
  onAction,
  lastDice,
  onResetGame,
  isAIGame = false,
  isAIRunning = false,
  onStopAI,
}: GameViewProps) {
  const [isRolling, setIsRolling] = useState(false);

  const players = (gameState.players || {}) as Record<string, Player>;
  const playerOrder = Object.keys(players);
  const currentPlayer = gameState.current_player || "";
  const messages = gameState.recent_messages || [];
  const turnNumber = gameState.turn_number || 0;

  // Detect when dice change to trigger animation
  useEffect(() => {
    if (lastDice) {
      setIsRolling(true);
      const timer = setTimeout(() => setIsRolling(false), 800);
      return () => clearTimeout(timer);
    }
  }, [lastDice]);

  // Check for game over
  const isGameOver = gameState.phase === "game_over";
  const winner = isGameOver
    ? Object.entries(players).find(([, p]) => !p.bankrupt)?.[0]
    : null;

  const handleAction = (action: string, params?: Record<string, unknown>) => {
    if (action === "roll_dice_and_move" || action === "roll_for_doubles") {
      setIsRolling(true);
    }
    onAction(action, params);
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="card-glass rounded-3xl p-8 max-w-md text-center">
            <h1 className="monopoly-title text-4xl font-bold text-yellow-400 mb-4">
              🏆 GAME OVER 🏆
            </h1>
            <p className="text-white text-xl mb-2">Winner</p>
            <p className="text-emerald-400 text-3xl font-bold">{winner}</p>
            <p className="text-white/60 mt-4 mb-6">
              Completed in {turnNumber} turns
            </p>
            {onResetGame && (
              <button
                onClick={onResetGame}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 
                         hover:from-amber-400 hover:to-red-400 text-white font-bold 
                         rounded-xl transition-all shadow-lg"
              >
                🎮 Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="monopoly-title text-3xl font-bold text-white">
              MONOPOLY
            </h1>
            <p className="text-white/60 text-sm">
              Turn {turnNumber} • {gameState.phase?.replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isAIGame ? (
              <div className="card-glass px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span className="text-amber-400 font-semibold">Model Battle Mode</span>
                {isAIRunning && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            ) : myPlayerName && (
              <div className="card-glass px-4 py-2 rounded-xl">
                <span className="text-white/60 text-sm">Playing as </span>
                <span className="text-emerald-400 font-semibold">{myPlayerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60 text-sm">Connected</span>
            </div>
            {isAIGame && isAIRunning && onStopAI && (
              <button
                onClick={onStopAI}
                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 
                         rounded-xl text-sm font-medium transition-colors border border-orange-500/30"
                title="Stop model battle"
              >
                ⏹ Stop Battle
              </button>
            )}
            {onResetGame && (
              <button
                onClick={onResetGame}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 
                         rounded-xl text-sm font-medium transition-colors border border-red-500/30"
                title="Reset game and return to lobby"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left sidebar - Players */}
        <aside className="xl:col-span-3 order-2 xl:order-1">
          <PlayerPanel
            players={players}
            playerOrder={playerOrder}
            currentPlayer={currentPlayer}
            myPlayerName={myPlayerName}
          />
        </aside>

        {/* Center - Game Board */}
        <main className="xl:col-span-6 order-1 xl:order-2">
          <GameBoard players={players} playerOrder={playerOrder} />
        </main>

        {/* Right sidebar - Actions & Info */}
        <aside className="xl:col-span-3 order-3 space-y-6">
          <DiceDisplay dice={lastDice} isRolling={isRolling} />
          {!isAIGame && (
            <ActionsPanel
              gameState={gameState}
              myPlayerName={myPlayerName}
              onAction={handleAction}
            />
          )}
          {isAIGame && (
            <div className="card-glass rounded-2xl p-4">
              <h2 className="text-white/80 text-sm font-medium flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${isAIRunning ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                Current Turn
              </h2>
              <div className="text-center py-4">
                <p className="text-white/60 text-sm mb-2">Now playing</p>
                <p className="text-2xl font-bold text-white">{currentPlayer}</p>
                <p className="text-white/40 text-xs mt-2 capitalize">
                  {gameState.phase?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          )}
          <MessageLog messages={messages} />
          <GameStats />
        </aside>
      </div>
    </div>
  );
}

