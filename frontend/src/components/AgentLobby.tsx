"use client";

import { useState, useEffect } from "react";
import { AIAgent } from "@/types/game";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface AgentLobbyProps {
  onStartGame: (agentIds: string[]) => void;
  isLoading?: boolean;
}

export default function AgentLobby({ onStartGame, isLoading }: AgentLobbyProps) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Fetch available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/agents`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 agents
      }
      return [...prev, agentId];
    });
  };

  const canStart = selectedAgents.length >= 2 && selectedAgents.length <= 4;

  const handleStart = () => {
    if (canStart) {
      onStartGame(selectedAgents);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-glass rounded-3xl p-8 max-w-4xl w-full animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="monopoly-title text-5xl font-bold text-white mb-2 tracking-wider">
            MONOPOLY
          </h1>
          <p className="text-emerald-300 text-lg font-light">
            AI Battle Arena
          </p>
          <div className="h-1 w-32 mx-auto mt-4 bg-gradient-to-r from-amber-400 via-red-500 to-purple-500 rounded-full" />
        </div>

        {/* Instructions */}
        <div className="text-center mb-6">
          <p className="text-white/70">
            Select <span className="text-emerald-400 font-semibold">2-4 AI models</span> to compete against each other
          </p>
          <p className="text-white/50 text-sm mt-1">
            Watch different AI models battle it out using the same strategy prompt!
          </p>
        </div>

        {/* Agent Selection Grid */}
        {loadingAgents ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {agents.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              const selectionOrder = selectedAgents.indexOf(agent.id) + 1;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  disabled={!isSelected && selectedAgents.length >= 4}
                  className={`
                    relative p-5 rounded-2xl text-left transition-all duration-300
                    border-2 group
                    ${isSelected 
                      ? "border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/20" 
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }
                    ${!isSelected && selectedAgents.length >= 4 ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <div 
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center
                               text-white font-bold text-sm shadow-lg"
                      style={{ backgroundColor: agent.color }}
                    >
                      {selectionOrder}
                    </div>
                  )}
                  
                  {/* Agent emoji */}
                  <div className="text-4xl mb-3">{agent.emoji}</div>
                  
                  {/* Agent name */}
                  <h3 
                    className="font-semibold text-lg mb-1"
                    style={{ color: isSelected ? agent.color : "white" }}
                  >
                    {agent.name}
                  </h3>
                  
                  {/* Provider tag */}
                  <span 
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                    style={{ 
                      backgroundColor: `${agent.color}30`,
                      color: agent.color 
                    }}
                  >
                    {agent.provider}
                  </span>
                  
                  {/* Description */}
                  <p className="text-white/60 text-sm line-clamp-2">
                    {agent.description}
                  </p>
                  
                  {/* Selection indicator */}
                  <div className={`
                    absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300
                    ${isSelected ? "opacity-100" : "opacity-0"}
                  `}>
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-10"
                      style={{ backgroundColor: agent.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected agents summary */}
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Selected Models ({selectedAgents.length}/4)
          </p>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedAgents.length === 0 ? (
              <span className="text-white/40 text-sm italic">
                Click models above to select them...
              </span>
            ) : (
              selectedAgents.map((agentId) => {
                const agent = agents.find((a) => a.id === agentId);
                if (!agent) return null;
                return (
                  <div
                    key={agentId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: `${agent.color}30` }}
                  >
                    <span>{agent.emoji}</span>
                    <span style={{ color: agent.color }} className="font-medium text-sm">
                      {agent.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAgent(agentId);
                      }}
                      className="text-white/40 hover:text-white/80 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 monopoly-title
                    ${canStart && !isLoading
                      ? "bg-gradient-to-r from-amber-500 via-red-500 to-purple-500 hover:from-amber-400 hover:via-red-400 hover:to-purple-400 text-white shadow-lg hover:shadow-red-500/30" 
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
        >
          {isLoading ? (
            <span className="animate-pulse">Starting Game...</span>
          ) : canStart ? (
            "🤖 START MODEL BATTLE"
          ) : selectedAgents.length === 0 ? (
            "SELECT AT LEAST 2 MODELS"
          ) : selectedAgents.length === 1 ? (
            "SELECT 1 MORE MODEL"
          ) : (
            "SELECT 2-4 MODELS"
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            🧠 Same prompt, different models • Watch AI models compete in real-time
          </p>
        </div>
      </div>
    </div>
  );
}

