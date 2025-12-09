"use client";

import { useState } from "react";
import { GameState, Player, TILE_DATA } from "@/types/game";

interface ActionsPanelProps {
  gameState: GameState;
  myPlayerName: string | null;
  onAction: (action: string, params?: Record<string, unknown>) => void;
}

export default function ActionsPanel({
  gameState,
  myPlayerName,
  onAction,
}: ActionsPanelProps) {
  const [isActing, setIsActing] = useState(false);

  const isMyTurn = gameState.current_player === myPlayerName;
  const phase = gameState.phase;
  const players = gameState.players as Record<string, Player>;
  const myPlayer = myPlayerName ? players[myPlayerName] : null;

  const handleAction = (action: string, params?: Record<string, unknown>) => {
    setIsActing(true);
    onAction(action, params);
    setTimeout(() => setIsActing(false), 500);
  };

  // Get available actions based on phase
  const getAvailableActions = () => {
    if (!isMyTurn) return [];

    const actions: { label: string; action: string; params?: Record<string, unknown>; variant: string }[] = [];

    switch (phase) {
      case "waiting_for_roll":
        actions.push({
          label: "🎲 Roll Dice",
          action: "roll_dice_and_move",
          variant: "primary",
        });
        break;
      
      case "in_jail":
        actions.push({
          label: "🎲 Roll for Doubles",
          action: "roll_for_doubles",
          variant: "primary",
        });
        actions.push({
          label: "💵 Pay $50 Bail",
          action: "pay_jail_bail",
          variant: "secondary",
        });
        if (myPlayer && myPlayer.jail_cards > 0) {
          actions.push({
            label: "🎫 Use Jail Card",
            action: "use_jail_card",
            variant: "secondary",
          });
        }
        break;
      
      case "waiting_for_buy_decision":
        const currentTile = myPlayer ? TILE_DATA[myPlayer.position] : null;
        actions.push({
          label: `🏠 Buy ${currentTile?.name || "Property"} ($${currentTile?.price || 0})`,
          action: "buy_property",
          variant: "primary",
        });
        actions.push({
          label: "❌ Decline Purchase",
          action: "decline_purchase",
          variant: "secondary",
        });
        break;
      
      case "turn_complete":
        actions.push({
          label: "✅ End Turn",
          action: "end_turn",
          variant: "primary",
        });
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  const getButtonClass = (variant: string) => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white";
      case "secondary":
        return "bg-white/10 hover:bg-white/20 text-white border border-white/20";
      case "danger":
        return "bg-red-500/80 hover:bg-red-500 text-white";
      default:
        return "bg-white/10 hover:bg-white/20 text-white";
    }
  };

  return (
    <div className="card-glass rounded-2xl p-4">
      <h2 className="text-white/80 text-sm font-medium flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
        Actions
      </h2>

      {/* Turn indicator */}
      <div className={`mb-4 p-3 rounded-xl ${isMyTurn ? "bg-emerald-500/20" : "bg-white/5"}`}>
        {isMyTurn ? (
          <p className="text-emerald-400 font-semibold text-center">
            🎮 Your Turn!
          </p>
        ) : (
          <p className="text-white/60 text-center">
            Waiting for <span className="text-white font-semibold">{gameState.current_player}</span>
          </p>
        )}
      </div>

      {/* Current phase */}
      <div className="mb-4 text-center">
        <span className="text-xs text-white/40 uppercase tracking-wider">Phase</span>
        <p className="text-white/80 font-mono text-sm">
          {phase?.replace(/_/g, " ")}
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {actions.length > 0 ? (
          actions.map((actionItem, idx) => (
            <button
              key={idx}
              onClick={() => handleAction(actionItem.action, actionItem.params)}
              disabled={isActing}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200
                       hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       ${getButtonClass(actionItem.variant)}`}
            >
              {isActing ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                actionItem.label
              )}
            </button>
          ))
        ) : (
          <p className="text-white/40 text-sm text-center py-4">
            {isMyTurn ? "No actions available" : "Wait for your turn"}
          </p>
        )}
      </div>

      {/* Quick stats */}
      {myPlayer && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center">
              <p className="text-white/40 text-xs">Your Money</p>
              <p className={`font-mono font-bold ${myPlayer.money < 0 ? "text-red-400" : "text-emerald-400"}`}>
                ${myPlayer.money.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs">Position</p>
              <p className="text-white font-mono">{TILE_DATA[myPlayer.position]?.name || myPlayer.position}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

