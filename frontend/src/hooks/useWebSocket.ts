"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, WebSocketMessage, ActionResult, AgentThought } from "@/types/game";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001/api/ws";

interface UseWebSocketReturn {
  isConnected: boolean;
  gameState: GameState | null;
  lastResult: ActionResult | null;
  thoughts: AgentThought[];
  isAgentGameRunning: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  registerPlayer: (playerName: string) => void;
  startGame: () => void;
  performAction: (playerName: string, action: string, params?: Record<string, unknown>) => void;
  requestState: () => void;
  reconnect: () => void;
  resetGame: () => void;
  startAgentGame: (agentIds: string[]) => void;
  stopAgentGame: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [isAgentGameRunning, setIsAgentGameRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("WS Message:", data);

          switch (data.type) {
            case "connected":
            case "state_update":
              if (data.state) {
                setGameState(data.state);
              }
              break;
            case "player_registered":
            case "game_started":
            case "action_result":
            case "action_performed":
              if (data.state) {
                setGameState(data.state);
              }
              if (data.result) {
                setLastResult(data.result);
              }
              break;
            case "game_reset":
              if (data.state) {
                setGameState(data.state);
              }
              setLastResult(null);
              setThoughts([]);
              setIsAgentGameRunning(false);
              break;
            case "agent_game_started":
              if (data.state) {
                setGameState(data.state);
              }
              setIsAgentGameRunning(true);
              setThoughts([]);
              break;
            case "agent_game_stopped":
              setIsAgentGameRunning(false);
              break;
            case "agent_thought":
              if (data.thought) {
                setThoughts((prev) => [...prev.slice(-99), data.thought as AgentThought]);
              }
              break;
            case "thoughts_update":
              if (data.thoughts) {
                setThoughts(data.thoughts);
              }
              break;
            case "pong":
              // Heartbeat response
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
    }
  }, []);

  useEffect(() => {
    connect();

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  const registerPlayer = useCallback((playerName: string) => {
    sendMessage({ type: "register_player", player_name: playerName });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: "start_game" });
  }, [sendMessage]);

  const performAction = useCallback((playerName: string, action: string, params?: Record<string, unknown>) => {
    sendMessage({
      type: "action",
      player_name: playerName,
      action,
      ...(params && { params }),
    } as WebSocketMessage);
  }, [sendMessage]);

  const requestState = useCallback(() => {
    sendMessage({ type: "get_state" });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    wsRef.current?.close();
    connect();
  }, [connect]);

  const resetGame = useCallback(() => {
    sendMessage({ type: "reset_game" });
    setThoughts([]);
    setIsAgentGameRunning(false);
  }, [sendMessage]);

  const startAgentGame = useCallback((agentIds: string[]) => {
    sendMessage({ type: "start_agent_game", agent_ids: agentIds } as WebSocketMessage);
  }, [sendMessage]);

  const stopAgentGame = useCallback(() => {
    sendMessage({ type: "stop_agent_game" });
  }, [sendMessage]);

  return {
    isConnected,
    gameState,
    lastResult,
    thoughts,
    isAgentGameRunning,
    sendMessage,
    registerPlayer,
    startGame,
    performAction,
    requestState,
    reconnect,
    resetGame,
    startAgentGame,
    stopAgentGame,
  };
}

