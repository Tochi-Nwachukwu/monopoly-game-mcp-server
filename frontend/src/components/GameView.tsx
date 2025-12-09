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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="card-glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full text-center">
            <h1 className="monopoly-title text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">
              🏆 GAME OVER 🏆
            </h1>
            <p className="text-white text-lg sm:text-xl mb-2">Winner</p>
            <p className="text-emerald-400 text-2xl sm:text-3xl font-bold">{winner}</p>
            <p className="text-white/60 mt-4 mb-6">
              Completed in {turnNumber} turns
            </p>
            {onResetGame && (
              <button
                onClick={onResetGame}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 
                         hover:from-amber-400 hover:to-red-400 text-white font-bold 
                         rounded-xl transition-all shadow-lg w-full sm:w-auto"
              >
                🎮 Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="monopoly-title text-2xl sm:text-3xl font-bold text-white">
                MONOPOLY
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Turn {turnNumber} • {gameState.phase?.replace(/_/g, " ")}
              </p>
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="sm:hidden p-2 rounded-lg bg-white/10"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span className="text-white text-xl">☰</span>
            </button>
          </div>
          
          {/* Desktop controls */}
          <div className={`
            flex flex-wrap items-center gap-2 sm:gap-4
            ${showMobileMenu ? 'flex' : 'hidden'} sm:flex
          `}>
            {isAIGame ? (
              <div className="card-glass px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🧠</span>
                <span className="text-amber-400 font-semibold text-sm sm:text-base">Model Battle</span>
                {isAIRunning && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
            ) : myPlayerName && (
              <div className="card-glass px-3 sm:px-4 py-2 rounded-xl">
                <span className="text-white/60 text-xs sm:text-sm">Playing as </span>
                <span className="text-emerald-400 font-semibold text-sm">{myPlayerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60 text-xs sm:text-sm">Connected</span>
            </div>
            {isAIGame && isAIRunning && onStopAI && (
              <button
                onClick={onStopAI}
                className="px-3 sm:px-4 py-2 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 
                         rounded-xl text-xs sm:text-sm font-medium transition-colors border border-orange-500/30"
                title="Stop model battle"
              >
                ⏹ Stop
              </button>
            )}
            {onResetGame && (
              <button
                onClick={onResetGame}
                className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 
                         rounded-xl text-xs sm:text-sm font-medium transition-colors border border-red-500/30"
                title="Reset game and return to lobby"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Current Turn Banner */}
      {isAIGame && (
        <div className="sm:hidden mb-4 card-glass rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isAIRunning ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-white/60 text-xs">Now playing:</span>
          </div>
          <span className="text-white font-semibold text-sm">{currentPlayer}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Game Board - First on mobile */}
        <main className="lg:col-span-7 xl:col-span-6 order-1">
          <GameBoard players={players} playerOrder={playerOrder} />
        </main>

        {/* Right sidebar - Info panels */}
        <aside className="lg:col-span-5 xl:col-span-3 order-2 space-y-4 sm:space-y-6">
          {/* Dice and Current Turn - Horizontal on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <DiceDisplay dice={lastDice} isRolling={isRolling} />
            
            {isAIGame ? (
              <div className="card-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 hidden lg:block">
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
            ) : (
              <ActionsPanel
                gameState={gameState}
                myPlayerName={myPlayerName}
                onAction={handleAction}
              />
            )}
          </div>

          {/* Message Log - Collapsible on mobile */}
          <details className="group" open>
            <summary className="lg:hidden card-glass rounded-xl p-3 cursor-pointer flex items-center justify-between list-none">
              <span className="text-white/80 text-sm font-medium">📜 Message Log</span>
              <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 lg:mt-0">
              <MessageLog messages={messages} />
            </div>
          </details>
        </aside>

        {/* Left sidebar - Players (shows last on mobile, first on desktop) */}
        <aside className="lg:col-span-12 xl:col-span-3 order-3 xl:order-first">
          <PlayerPanel
            players={players}
            playerOrder={playerOrder}
            currentPlayer={currentPlayer}
            myPlayerName={myPlayerName}
          />
        </aside>
      </div>

      {/* Game Stats - At bottom */}
      <div className="mt-4 sm:mt-6">
        <details className="group">
          <summary className="card-glass rounded-xl p-3 cursor-pointer flex items-center justify-between list-none">
            <span className="text-white/80 text-sm font-medium">📊 Game Statistics</span>
            <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2">
            <GameStats />
          </div>
        </details>
      </div>
    </div>
  );
}
