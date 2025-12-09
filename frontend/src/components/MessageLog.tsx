"use client";

import { useEffect, useRef } from "react";

interface MessageLogProps {
  messages: string[];
}

export default function MessageLog({ messages }: MessageLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="card-glass rounded-2xl p-4">
      <h2 className="text-white/80 text-sm font-medium flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-purple-400" />
        Game Log
      </h2>
      
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto scroll-container space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4 italic">
            No messages yet...
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="px-3 py-2 bg-white/5 rounded-lg text-sm text-white/80 
                       animate-slide-up border-l-2 border-purple-500/50"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

