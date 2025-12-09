"use client";

import { useEffect, useRef } from "react";
import { AgentThought } from "@/types/game";

interface AIReasoningPanelProps {
  thoughts: AgentThought[];
  isRunning: boolean;
  onStop?: () => void;
}

// Model color mapping (matches agent_config.py)
const AGENT_COLORS: Record<string, string> = {
  "gpt-4o": "#10a37f",
  "gpt-4o-mini": "#74aa9c",
  "claude-sonnet": "#d97706",
  "claude-haiku": "#fb923c",
  "gemini-pro": "#4285f4",
  "gemini-flash": "#34a853",
  "grok-beta": "#1d9bf0",
  "llama-70b": "#6366f1",
  system: "#6b7280",
};

const THOUGHT_TYPE_STYLES: Record<string, { icon: string; bgClass: string }> = {
  reasoning: { icon: "🤔", bgClass: "bg-blue-500/20 border-blue-500/30" },
  decision: { icon: "💡", bgClass: "bg-emerald-500/20 border-emerald-500/30" },
  action_result: { icon: "⚡", bgClass: "bg-amber-500/20 border-amber-500/30" },
  error: { icon: "❌", bgClass: "bg-red-500/20 border-red-500/30" },
};

function ThoughtBubble({ thought }: { thought: AgentThought }) {
  const agentColor = AGENT_COLORS[thought.agent_id] || "#888";
  const typeStyle = THOUGHT_TYPE_STYLES[thought.thought_type] || THOUGHT_TYPE_STYLES.reasoning;
  const time = new Date(thought.timestamp).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <div 
      className={`p-3 rounded-xl border animate-slide-up ${typeStyle.bgClass}`}
      style={{ borderLeftColor: agentColor, borderLeftWidth: "3px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeStyle.icon}</span>
          <span 
            className="font-semibold text-sm"
            style={{ color: agentColor }}
          >
            {thought.agent_name}
          </span>
          <span className="text-white/40 text-xs capitalize px-2 py-0.5 rounded bg-white/10">
            {thought.thought_type.replace("_", " ")}
          </span>
        </div>
        <span className="text-white/30 text-xs font-mono">{time}</span>
      </div>
      
      {/* Content */}
      <p className="text-white/80 text-sm leading-relaxed">
        {thought.content}
      </p>
      
      {/* Action details */}
      {thought.action && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-white/50 text-xs">Action:</span>
          <code className="px-2 py-0.5 bg-white/10 rounded text-emerald-400 text-xs font-mono">
            {thought.action}
          </code>
          {thought.params && Object.keys(thought.params).length > 0 && (
            <code className="px-2 py-0.5 bg-white/10 rounded text-amber-400 text-xs font-mono">
              {JSON.stringify(thought.params)}
            </code>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIReasoningPanel({ thoughts, isRunning, onStop }: AIReasoningPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <div className="card-glass rounded-2xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/80 text-sm font-medium flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
          Model Reasoning
          {isRunning && (
            <span className="text-emerald-400 text-xs animate-pulse">• Live</span>
          )}
        </h2>
        {isRunning && onStop && (
          <button
            onClick={onStop}
            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 
                     text-red-400 rounded-lg transition-colors border border-red-500/30"
          >
            ⏹ Stop
          </button>
        )}
      </div>

      {/* Thoughts list */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-container space-y-3 pr-1"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        {thoughts.length === 0 ? (
          <div className="text-center py-8">
            {isRunning ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/60 text-sm">
                  Waiting for model responses...
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Models are analyzing the game
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🧠</div>
                <p className="text-white/40 text-sm italic">
                  No model thoughts yet
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Start a game to see model reasoning
                </p>
              </>
            )}
          </div>
        ) : (
          thoughts.map((thought, idx) => (
            <ThoughtBubble key={`${thought.timestamp}-${idx}`} thought={thought} />
          ))
        )}
      </div>

      {/* Stats footer */}
      {thoughts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span>{thoughts.length} thought{thoughts.length !== 1 ? "s" : ""}</span>
          <span>
            {new Set(thoughts.map(t => t.agent_id)).size} model{new Set(thoughts.map(t => t.agent_id)).size !== 1 ? "s" : ""} active
          </span>
        </div>
      )}
    </div>
  );
}

