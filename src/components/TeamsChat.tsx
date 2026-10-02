// src/components/TeamsChat.tsx
import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/content';

interface TeamsChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

export function TeamsChat({ isOpen, onClose, messages }: TeamsChatProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />

      <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-secondary border-l border-theme z-50 flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-teams border-b border-theme">
          <div className="flex items-center gap-2">
            <span aria-hidden>💬</span>
            <span className="font-bold text-white">MS Teams</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Teams chat"
            className="w-11 h-11 flex items-center justify-center bg-white/10 active:bg-white/20 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <div ref={chatRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2">
              <span className="text-lg shrink-0" aria-hidden>
                {msg.avatar}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-primary">{msg.sender}</span>
                  <span className="text-[10px] text-muted">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-secondary leading-relaxed break-words">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
