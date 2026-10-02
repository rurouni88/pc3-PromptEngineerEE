// src/components/ResultOverlay.tsx
import type { RunResult, RunStats } from '../types/game';
import { doraForRun, formatMs, BAND_LABEL, type DoraBand } from '../engine/dora';

interface ResultOverlayProps {
  result: RunResult;
  stats: RunStats;
  seed: string;
  onContinue: () => void;
}

const outcomeCopy: Record<
  RunResult['outcome'],
  { icon: string; title: string; blurb: string; color: string }
> = {
  clean: {
    icon: '✅',
    title: 'CLEAN DEPLOY',
    blurb: 'Zero pages. The AI is suspiciously competent. HR wants to know your secret.',
    color: 'text-emerald-400',
  },
  rough: {
    icon: '⚠️',
    title: 'SHIPPED WITH CAVEATS',
    blurb: 'It works. Probably. The TODOs will haunt you until the next sprint.',
    color: 'text-amber-400',
  },
  shaky: {
    icon: '🩹',
    title: 'SHAKY DEPLOY',
    blurb: 'It is up. It is also a crime scene. The band-aids are load-bearing.',
    color: 'text-orange-400',
  },
  fail: {
    icon: '🔥',
    title: 'PRODUCTION MELTDOWN',
    blurb: 'Corruption hit 100%. The deploy bot has filed for a restraining order.',
    color: 'text-red-400',
  },
  timeout: {
    icon: '⏰',
    title: 'MISSED THE STANDUP',
    blurb: 'The ticket expired. The PM has started a group chat. You are in it.',
    color: 'text-red-400',
  },
};

const bandColor: Record<DoraBand, string> = {
  elite: 'text-emerald-400',
  good: 'text-amber-400',
  poor: 'text-red-400',
};

export function ResultOverlay({ result, stats, seed, onContinue }: ResultOverlayProps) {
  const copy = outcomeCopy[result.outcome];
  const dora = doraForRun(stats);
  const lttcBand = dora.metrics.find(m => m.key === 'lttc');

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-secondary border border-theme rounded-2xl p-6 max-w-sm w-full text-center max-h-full overflow-y-auto">
        <div className="text-5xl mb-3" aria-hidden>
          {copy.icon}
        </div>
        <h2 className={`text-xl font-bold ${copy.color} mb-1`}>{copy.title}</h2>
        <p className="text-xs text-secondary leading-relaxed mb-4">{copy.blurb}</p>

        {/* LTTC — the vanity metric, banded like DORA */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[10px] text-muted uppercase">Lead Time to Change</span>
          <span className="font-mono font-bold text-primary">{formatMs(result.lttcMs)}</span>
          {result.outcome !== 'timeout' && lttcBand && (
            <span className={`text-[10px] font-bold ${bandColor[lttcBand.band]}`}>
              [{BAND_LABEL[lttcBand.band].toUpperCase()}]
            </span>
          )}
        </div>

        <div className="flex justify-center gap-4 mb-4 text-sm">
          <div>
            <div className="text-emerald-400 font-bold">${result.cashEarned.toLocaleString()}</div>
            <div className="text-[10px] text-muted">CASH</div>
          </div>
          <div>
            <div className="text-amber-400 font-bold">+{result.hypeEarned}</div>
            <div className="text-[10px] text-muted">HYPE</div>
          </div>
          <div>
            <div className="text-primary font-bold">{result.glitchesCleared}</div>
            <div className="text-[10px] text-muted">HOTFIXED</div>
          </div>
          {result.maxCascade > 1 && (
            <div>
              <div className="text-orange-400 font-bold">d{result.maxCascade}</div>
              <div className="text-[10px] text-muted">CASCADE</div>
            </div>
          )}
        </div>

        {/* Per-run DORA mini dashboard */}
        <div className="bg-tertiary border border-theme rounded-xl p-3 mb-3 text-left">
          <div className="text-[10px] text-muted font-bold uppercase mb-2">
            DORA · this shift
          </div>
          <div className="space-y-1.5">
            {dora.metrics.map(m => (
              <div key={m.key} className="flex items-center justify-between text-xs">
                <span className="text-secondary">{m.label}</span>
                <span className="font-mono text-primary">
                  {m.value}{' '}
                  <span className={`text-[10px] font-bold ${bandColor[m.band]}`}>
                    {BAND_LABEL[m.band]}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted italic mt-2 leading-relaxed">"{dora.summary}"</p>
        </div>

        <button
          onClick={onContinue}
          className="w-full h-12 bg-emerald-600 active:bg-emerald-500 rounded-xl font-bold text-white transition-colors"
        >
          NEXT TICKET →
        </button>

        <div className="mt-4 pt-3 border-t border-theme space-y-1">
          <p className="text-[10px] text-muted">SEED: {seed}</p>
          <p className="text-[9px] text-muted/70">
            Copyright 2026 PC3 Enterprises. This document is not a strategy.
          </p>
        </div>
      </div>
    </div>
  );
}
