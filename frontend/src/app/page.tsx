"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import AgentLobby from "@/components/AgentLobby";
import GameView from "@/components/GameView";
import AIReasoningPanel from "@/components/AIReasoningPanel";
import { Player } from "@/types/game";

export default function Home() {
  const {
    isConnected,
    gameState,
    lastResult,
    thoughts,
    isAgentGameRunning,
    reconnect,
    resetGame,
    startAgentGame,
    stopAgentGame,
  } = useWebSocket();

  const [lastDice, setLastDice] = useState<[number, number] | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Update dice when result comes in
  useEffect(() => {
    if (lastResult?.dice) {
      setLastDice(lastResult.dice);
    }
  }, [lastResult]);

  // Handle starting agent game
  const handleStartAgentGame = (agentIds: string[]) => {
    setIsStarting(true);
    startAgentGame(agentIds);
    setTimeout(() => setIsStarting(false), 2000);
  };

  // Handle game reset
  const handleResetGame = () => {
    if (isAgentGameRunning) {
      stopAgentGame();
    }
    resetGame();
    setLastDice(null);
  };

  // Determine if we're in lobby or game
  const isInGame = gameState?.status !== "lobby" && gameState?.phase && gameState.phase !== "lobby";
  const hasPlayers = gameState?.players && (
    Array.isArray(gameState.players) 
      ? gameState.players.length > 0 
      : Object.keys(gameState.players as Record<string, Player>).length > 0
  );

  // Connection status overlay
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-glass rounded-3xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <h1 className="monopoly-title text-2xl font-bold text-white mb-2">
            Connecting...
          </h1>
          <p className="text-white/60 mb-6">
            Establishing connection to game server
          </p>
          <button
            onClick={reconnect}
            className="action-btn bg-emerald-500 hover:bg-emerald-400 text-white px-6"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show lobby or game
  if (isInGame && hasPlayers) {
    return (
      <div className="flex h-screen">
        {/* Main game area */}
        <div className="flex-1 overflow-hidden">
          <GameView
            gameState={gameState!}
            myPlayerName={null} // No human player
            onAction={() => {}} // No human actions
            lastDice={lastDice}
            onResetGame={handleResetGame}
            isAIGame={true}
            isAIRunning={isAgentGameRunning}
            onStopAI={stopAgentGame}
          />
        </div>
        
        {/* AI Reasoning Panel - Right side */}
        <div className="w-96 border-l border-white/10 bg-black/20 p-4 overflow-hidden">
          <AIReasoningPanel 
            thoughts={thoughts} 
            isRunning={isAgentGameRunning}
            onStop={stopAgentGame}
          />
        </div>
      </div>
    );
  }

  // Show agent selection lobby
  return (
    <AgentLobby 
      onStartGame={handleStartAgentGame}
      isLoading={isStarting}
    />
  );
}
