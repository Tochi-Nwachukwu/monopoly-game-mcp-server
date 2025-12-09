"use client";

import { useState } from "react";
import { GameState, PLAYER_COLORS } from "@/types/game";
import GameStats from "./GameStats";

interface LobbyProps {
  gameState: GameState | null;
  onRegister: (name: string) => void;
  onStartGame: () => void;
  currentPlayerName: string | null;
  setCurrentPlayerName: (name: string) => void;
}

export default function Lobby({
  gameState,
  onRegister,
  onStartGame,
  currentPlayerName,
  setCurrentPlayerName,
}: LobbyProps) {
  const [inputName, setInputName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const players = Array.isArray(gameState?.players) 
    ? gameState.players 
    : Object.keys(gameState?.players || {});

  const handleRegister = () => {
    if (inputName.trim()) {
      setIsRegistering(true);
      onRegister(inputName.trim());
      setCurrentPlayerName(inputName.trim());
      setInputName("");
      setTimeout(() => setIsRegistering(false), 500);
    }
  };

  const canStart = players.length >= 2;
  const isRegistered = currentPlayerName && players.includes(currentPlayerName);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gap-6">
      <div className="card-glass rounded-3xl p-8 max-w-lg w-full animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="monopoly-title text-5xl font-bold text-white mb-2 tracking-wider">
            MONOPOLY
          </h1>
          <p className="text-emerald-300 text-lg font-light">
            Real-Time Edition
          </p>
          <div className="h-1 w-32 mx-auto mt-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full" />
        </div>

        {/* Registration Form */}
        {!isRegistered && (
          <div className="mb-8">
            <label className="block text-white/80 text-sm mb-2 font-medium">
              Enter Your Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                placeholder="Your name..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white 
                         placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 
                         focus:border-transparent transition-all font-body"
                maxLength={20}
              />
              <button
                onClick={handleRegister}
                disabled={!inputName.trim() || isRegistering}
                className="action-btn bg-emerald-500 hover:bg-emerald-400 text-white px-6"
              >
                {isRegistering ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  "Join"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Registered Players */}
        <div className="mb-8">
          <h2 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Players in Lobby ({players.length})
          </h2>
          <div className="space-y-2">
            {players.length === 0 ? (
              <p className="text-white/40 text-sm italic py-4 text-center">
                No players yet. Be the first to join!
              </p>
            ) : (
              players.map((name, idx) => (
                <div
                  key={name}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 
                           border border-white/10 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                  >
                    {name[0].toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{name}</span>
                  {name === currentPlayerName && (
                    <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Start Game Button */}
        {isRegistered && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 monopoly-title
                      ${canStart 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg hover:shadow-emerald-500/30" 
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                      }`}
          >
            {canStart ? "START GAME" : `WAITING FOR PLAYERS (${2 - players.length} more needed)`}
          </button>
        )}

        {/* Connection Status */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            Powered by WebSocket • Real-time multiplayer
          </p>
        </div>
      </div>
      
      {/* Game Statistics Sidebar */}
      <div className="hidden lg:block w-80 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <GameStats />
      </div>
    </div>
  );
}

