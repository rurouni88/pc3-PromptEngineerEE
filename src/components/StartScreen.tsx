// src/components/StartScreen.tsx
// Lobby: play, the fake DORA dashboard, the career ladder, achievements.
// Thin renderer — all data comes from the meta store via props.

import { useState } from 'react';
import type { Tier } from '../types/content';
import type { MetaStore } from '../engine/meta';
import { CAREER_LADDER, nextTierHint } from '../engine/meta';
import { ACHIEVEMENTS } from '../engine/achievements';
import { doraForLifetime, formatMs, BAND_LABEL, type DoraBand } from '../engine/dora';
import { tierRank } from '../engine/game';
import { HelpModal } from './HelpModal';
import { SettingsModal } from './SettingsModal';

interface StartScreenProps {
  meta: MetaStore;
  unlockedAchievements: string[];
  /** Achievement ids unlocked on the run that just ended. */
  newAchievements: string[];
  onStart: (tier: Tier) => void;
  /** Reload in-memory meta after a settings reset. */
  onMetaReset: () => void;
}

type Tab = 'play' | 'dora' | 'career' | 'achievements';

const bandColor: Record<DoraBand, string> = {
  elite: 'text-emerald-400',
  good: 'text-amber-400',
  poor: 'text-red-400',
};

const TIER_BADGE: Record<Tier, string> = {
  junior: 'bg-gray-600/40 text-gray-300',
  mid: 'bg-blue-600/40 text-blue-300',
  senior: 'bg-purple-600/40 text-purple-300',
  staff: 'bg-pink-600/40 text-pink-300',
  principal: 'bg-amber-600/40 text-amber-300',
  'tech-lead': 'bg-emerald-600/40 text-emerald-300',
  architect: 'bg-cyan-600/40 text-cyan-300',
  cto: 'bg-red-600/40 text-red-300',
};

export function StartScreen({
  meta,
  unlockedAchievements,
  newAchievements,
  onStart,
  onMetaReset,
}: StartScreenProps) {
  const [tab, setTab] = useState<Tab>('play');
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { lifetime, tier, topRuns } = meta;
  const dora = doraForLifetime(lifetime);
  const hint = nextTierHint(lifetime, tier);
  const architectUnlocked = tierRank(tier) >= tierRank('architect');

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-primary">
      {/* Header */}
      <div className="shrink-0 relative px-4 pt-4 pb-3 text-center">
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="How to play"
            className="w-11 h-11 rounded-lg bg-secondary/60 border border-theme text-lg active:bg-tertiary transition-colors"
          >
            ❓
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="w-11 h-11 rounded-lg bg-secondary/60 border border-theme text-lg active:bg-tertiary transition-colors"
          >
            ⚙️
          </button>
        </div>
        <div className="text-5xl mb-2" aria-hidden>
          🐒
        </div>
        <h1 className="text-xl font-bold text-primary">Prompt Monkey</h1>
        <p className="text-[11px] text-muted">
          Architect Edition · {tierRank(tier) >= tierRank('architect') ? 'boxes unlocked' : 'boxes load-bearing'}
        </p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-theme">
        {(
          [
            ['play', 'PLAY'],
            ['dora', 'DORA'],
            ['career', 'CAREER'],
            ['achievements', 'ACHIEVEMENTS'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 h-11 text-[11px] font-bold transition-colors ${
              tab === key
                ? 'text-primary border-b-2 border-emerald-400'
                : 'text-muted active:text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {tab === 'play' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${TIER_BADGE[tier]}`}>
                {tier}
              </span>
              <div className="text-right">
                <div className="text-emerald-400 text-sm font-bold">
                  ${lifetime.cash.toLocaleString()}
                </div>
                <div className="text-amber-400 text-xs font-bold">⭐{lifetime.hype}</div>
              </div>
            </div>

            {hint && (
              <div className="bg-secondary border border-theme rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-secondary">
                    Next: <span className="text-primary font-bold">{hint.rung.label}</span>
                  </span>
                  <span className="text-muted font-mono">
                    {Math.min(hint.progress, hint.target)}/{hint.target} {hint.label}
                  </span>
                </div>
                <div className="h-1.5 bg-tertiary rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, (hint.progress / hint.target) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted italic mt-1.5 leading-relaxed">
                  {hint.rung.detail}
                </p>
              </div>
            )}

            {newAchievements.length > 0 && (
              <div className="bg-secondary border border-theme rounded-xl p-3">
                <div className="text-[10px] text-muted font-bold uppercase mb-1.5">
                  🏆 New badges
                </div>
                <div className="space-y-1">
                  {newAchievements.map(id => {
                    const a = ACHIEVEMENTS.find(x => x.id === id);
                    return a ? (
                      <div key={id} className="text-xs text-primary">
                        <span className="font-bold">{a.name}</span>{' '}
                        <span className="text-muted">— {a.description}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => onStart(tier)}
              className="w-full h-14 bg-emerald-600 active:bg-emerald-500 rounded-xl font-bold text-white text-lg shadow-lg transition-colors"
            >
              START WORK DAY
            </button>

            <p className="text-[9px] text-muted/70 text-center">
              Copyright 2026 PC3 Enterprises. This document is not a strategy.
            </p>

            {/* Architect DLC gate */}
            <button
              disabled
              className="w-full h-12 bg-secondary/60 border border-theme rounded-xl text-xs font-bold text-muted flex items-center justify-center gap-2"
            >
              <span aria-hidden>📐</span>
              {architectUnlocked ? (
                <span className="text-cyan-300">ARCHITECT MODE — SOON</span>
              ) : (
                <span>⚠ LOCKED — 42 requirements, you meet 38</span>
              )}
            </button>
          </div>
        )}

        {tab === 'dora' && (
          <div className="space-y-4">
            <div className="bg-secondary border border-theme rounded-xl p-3">
              <div className="text-[10px] text-muted font-bold uppercase mb-2">
                DORA · lifetime · PC3 Enterprises
              </div>
              <div className="space-y-2">
                {dora.metrics.map(m => (
                  <div key={m.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary">{m.label}</span>
                      <span className="font-mono text-primary">
                        {m.value}{' '}
                        <span className={`text-[10px] font-bold ${bandColor[m.band]}`}>
                          {BAND_LABEL[m.band]}
                        </span>
                      </span>
                    </div>
                    <p className="text-[10px] text-muted italic leading-snug">{m.detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary italic mt-3 leading-relaxed">
                "{dora.summary}"
              </p>
            </div>

            {topRuns.length > 0 && (
              <div className="bg-secondary border border-theme rounded-xl p-3">
                <div className="text-[10px] text-muted font-bold uppercase mb-2">Top days</div>
                <div className="space-y-1.5">
                  {topRuns.slice(0, 5).map((r, i) => (
                    <div key={`${r.seed}-${i}`} className="flex items-center gap-2 text-xs">
                      <span className="text-muted w-4">#{i + 1}</span>
                      <span className="text-emerald-400 font-mono flex-1">
                        ${r.cash.toLocaleString()}
                      </span>
                      <span className="text-muted">{r.ticketsResolved} ship</span>
                      <span className="text-[9px] font-mono text-muted">{r.seed}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'career' && (
          <div className="space-y-2">
            {CAREER_LADDER.map(rung => {
              const met = rung.met(lifetime);
              const isCurrent = rung.tier === tier;
              return (
                <div
                  key={rung.tier}
                  className={`rounded-xl border p-3 ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : met
                        ? 'border-theme bg-secondary'
                        : 'border-theme bg-secondary/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-primary">
                      {met ? '✓' : '·'} {rung.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">you</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted leading-snug">{rung.detail}</p>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedAchievements.includes(a.id);
              const isNew = newAchievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 ${
                    unlocked
                      ? 'border-amber-500/60 bg-amber-950/20'
                      : 'border-theme bg-secondary/40'
                  }`}
                >
                  <div className="text-xs font-bold mb-1">
                    <span className={unlocked ? 'text-amber-300' : 'text-muted'}>
                      {a.implemented ? '🏆' : '🚧'} {a.name}
                    </span>
                    {isNew && <span className="text-emerald-400 text-[9px] ml-1">NEW</span>}
                  </div>
                  <p
                    className={`text-[10px] leading-snug ${
                      unlocked ? 'text-secondary' : 'text-muted/70'
                    }`}
                  >
                    {a.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onMetaReset={onMetaReset} />
      )}
    </div>
  );
}
