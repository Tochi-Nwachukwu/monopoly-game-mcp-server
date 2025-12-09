"use client";

import { useState, useEffect } from "react";

interface DiceDisplayProps {
  dice: [number, number] | null;
  isRolling?: boolean;
}

function DiceFace({ value }: { value: number }) {
  const dotPositions: Record<number, string[]> = {
    1: ["center"],
    2: ["top-right", "bottom-left"],
    3: ["top-right", "center", "bottom-left"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
  };

  const positions = dotPositions[value] || [];

  const getPosition = (pos: string) => {
    switch (pos) {
      case "top-left": return "top-1 left-1";
      case "top-right": return "top-1 right-1";
      case "middle-left": return "top-1/2 -translate-y-1/2 left-1";
      case "middle-right": return "top-1/2 -translate-y-1/2 right-1";
      case "bottom-left": return "bottom-1 left-1";
      case "bottom-right": return "bottom-1 right-1";
      case "center": return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      default: return "";
    }
  };

  return (
    <div className="relative w-14 h-14 bg-white rounded-xl shadow-lg border-2 border-gray-200">
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className={`absolute w-2.5 h-2.5 bg-gray-800 rounded-full ${getPosition(pos)}`}
        />
      ))}
    </div>
  );
}

export default function DiceDisplay({ dice, isRolling = false }: DiceDisplayProps) {
  const [displayDice, setDisplayDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setRolling(true);
      // Animate dice rolling
      const interval = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setRolling(false);
        if (dice) {
          setDisplayDice(dice);
        }
      }, 800);

      return () => clearInterval(interval);
    } else if (dice) {
      setDisplayDice(dice);
    }
  }, [dice, isRolling]);

  const isDoubles = displayDice[0] === displayDice[1];
  const total = displayDice[0] + displayDice[1];

  return (
    <div className="card-glass rounded-2xl p-6">
      <h2 className="text-white/80 text-sm font-medium flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        Dice
      </h2>
      
      <div className="flex items-center justify-center gap-4">
        <div className={rolling ? "animate-dice-roll" : ""}>
          <DiceFace value={displayDice[0]} />
        </div>
        <div className={rolling ? "animate-dice-roll" : ""} style={{ animationDelay: "50ms" }}>
          <DiceFace value={displayDice[1]} />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-white font-mono">{total}</p>
        {isDoubles && !rolling && (
          <p className="text-yellow-400 text-sm font-semibold animate-pulse mt-1">
            🎲 DOUBLES! 🎲
          </p>
        )}
      </div>
    </div>
  );
}

