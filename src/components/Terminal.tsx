// src/components/Terminal.tsx
// Main viewport: terminal logs, and during deploy the live stream with
// tappable glitches. Thin renderer — all state comes from props.

import { useEffect, useRef } from 'react';
import type { GameContentProfile } from '../types/content';
import type { DeployState, Glitch, TerminalLog } from '../types/game';
import { TUNING } from '../engine/game';

interface TerminalProps {
  logs: TerminalLog[];
  isCompiling: boolean;
  /** Live deploy stream (null outside the deploying phase). */
  deploy: DeployState | null;
  onTapGlitch: (id: number) => void;
  content: GameContentProfile;
}

const VISIBLE_LINES = 18;

function lineStyle(text: string): { color: string; icon: string } {
  if (text.includes('PAGERDUTY')) return { color: 'text-red-400 animate-neon-flash', icon: '🚨' };
  if (text.includes('CRITICAL') || text.includes('ERROR') || text.includes('DEPLOY FAILED'))
    return { color: 'text-red-400', icon: '❌' };
  if (text.includes('WARN')) return { color: 'text-amber-400', icon: '⚠️' };
  if (text.includes('SUCCESS') || text.includes('DEPLOYED'))
    return { color: 'text-emerald-400', icon: '✅' };
  if (text.includes('TICKET INBOUND')) return { color: 'text-blue-400', icon: '🎫' };
  return { color: 'text-secondary', icon: '>' };
}

export function Terminal({ logs, isCompiling, deploy, onTapGlitch, content }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, deploy?.revealed, deploy?.glitches.length]);

  // Active glitches by line index (first one wins).
  const activeByLine = new Map<number, Glitch>();
  if (deploy) {
    for (const g of deploy.glitches) {
      if (g.state === 'active' && !activeByLine.has(g.lineIndex)) {
        activeByLine.set(g.lineIndex, g);
      }
    }
  }

  // Visible deploy window (last N revealed lines).
  const windowStart = deploy ? Math.max(0, deploy.revealed - VISIBLE_LINES) : 0;
  const visibleLines = deploy ? deploy.lines.slice(windowStart, deploy.revealed) : [];

  return (
    <section className="flex-1 min-h-0 flex flex-col bg-tertiary border-x border-theme">
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-secondary border-b border-theme">
        <div className="flex gap-1" aria-hidden>
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-[10px] text-muted font-mono">
          {deploy ? '⚡ deploy stream — TAP THE GLITCHES' : `terminal — ${content.modeName}`}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="terminal-scroll flex-1 min-h-0 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
      >
        {deploy ? (
          <div className="space-y-1">
            {visibleLines.length === 0 && (
              <div className="text-emerald-400">
                <span className="text-muted">$</span> pushing to prod
                <span className="animate-cursor-blink">_</span>
              </div>
            )}
            {visibleLines.map((line, i) => {
              const lineIndex = windowStart + i;
              const glitch = activeByLine.get(lineIndex);
              if (glitch) {
                const fusePct = Math.max(0, (glitch.fuse / TUNING.fuseTicks) * 100);
                return (
                  <button
                    key={line.id}
                    onPointerDown={() => onTapGlitch(glitch.id)}
                    aria-label={`Hotfix glitch on line ${lineIndex + 1}`}
                    className={`w-full min-h-12 flex flex-col justify-center px-2 rounded-md border text-left animate-glitch-shake ${
                      glitch.boss
                        ? 'bg-red-950/80 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'bg-red-950/50 border-red-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
                      <span aria-hidden>{glitch.boss ? '👹' : '🐛'}</span>
                      <span className="truncate text-red-300">{line.text}</span>
                      {glitch.boss && (
                        <span className="shrink-0 font-bold text-red-400">
                          ×{glitch.tapsNeeded}
                        </span>
                      )}
                      {glitch.cascadeDepth > 0 && (
                        <span className="shrink-0 text-[9px] text-orange-400">
                          CASCADe d{glitch.cascadeDepth}
                        </span>
                      )}
                    </div>
                    <div className="h-0.5 bg-red-950 mt-1.5 rounded overflow-hidden">
                      <div
                        className="h-full bg-red-400"
                        style={{ width: `${fusePct}%`, transition: 'width 450ms linear' }}
                      />
                    </div>
                  </button>
                );
              }
              return (
                <div key={line.id} className="text-secondary text-[11px] truncate animate-line-in">
                  <span className="text-emerald-700">+</span> {line.text}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {logs.length === 0 && !isCompiling && (
              <div className="text-muted">
                <span className="text-emerald-400">$</span>{' '}
                <span className="animate-cursor-blink">_</span>
              </div>
            )}
            {logs.map(log => {
              const style = lineStyle(log.text);
              return (
                <div key={log.id} className={`${style.color} break-all`}>
                  <span className="mr-1.5">{style.icon}</span>
                  {log.text}
                </div>
              );
            })}
            {isCompiling && (
              <div className="text-emerald-400">
                <span className="text-muted">$</span> compiling
                <span className="animate-cursor-blink">_</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
