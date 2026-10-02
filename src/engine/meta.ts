// src/engine/meta.ts
// Lifetime meta layer: career ladder, lifetime stats, top runs.
// Storage: isolated 'pm_meta' key, validated on load (guardrail #4).
// Pure + deterministic: no Math.random, no React.

import type { GameState, RunStats } from '../types/game';
import type { Tier } from '../types/content';
import { tierRank } from './game';

const STORE_KEY = 'pm_meta';
const ACHIEVEMENTS_KEY = 'pm_achievements';
const MAX_RUNS = 30;
const VERSION = 1;

export interface LifetimeStats {
  runs: number;
  deliveries: number;
  failedDeliveries: number;
  deploys: number;
  cleanDeploys: number;
  glitchesCleared: number;
  glitchesExpired: number;
  maxCascade: number;
  coffeeUsed: number;
  aiApologized: boolean;
  bestLttcMs: number;
  lttcSumMs: number;
  lttcCount: number;
  locShipped: number;
  recoveryBestMs: number;
  cash: number;
  hype: number;
  ticketsResolved: number;
  ticketsFailed: number;
}

export interface RunRecord {
  seed: string;
  tier: Tier;
  cash: number;
  hype: number;
  loc: number;
  ticketsResolved: number;
  ticketsFailed: number;
  cleanDeploys: number;
  bestLttcMs: number; // 0 = nothing shipped
  glitchesCleared: number;
  date: string; // ISO
}

export interface MetaStore {
  version: number;
  lifetime: LifetimeStats;
  tier: Tier; // highest tier reached (monotonic)
  topRuns: RunRecord[];
}

// --- Creation / persistence ---

export function zeroLifetime(): LifetimeStats {
  return {
    runs: 0,
    deliveries: 0,
    failedDeliveries: 0,
    deploys: 0,
    cleanDeploys: 0,
    glitchesCleared: 0,
    glitchesExpired: 0,
    maxCascade: 0,
    coffeeUsed: 0,
    aiApologized: false,
    bestLttcMs: 0,
    lttcSumMs: 0,
    lttcCount: 0,
    locShipped: 0,
    recoveryBestMs: 0,
    cash: 0,
    hype: 0,
    ticketsResolved: 0,
    ticketsFailed: 0,
  };
}

export function createMetaStore(): MetaStore {
  return { version: VERSION, lifetime: zeroLifetime(), tier: 'junior', topRuns: [] };
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function loadMetaStore(): MetaStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return createMetaStore();
    const parsed = JSON.parse(raw) as Partial<MetaStore>;
    if (parsed.version !== VERSION || typeof parsed !== 'object' || parsed === null) {
      console.warn('[meta] save rejected: version or shape mismatch — starting fresh');
      return createMetaStore();
    }

    // Validate on load: collect ALL problems, repair what we can, log the rest.
    const issues: string[] = [];
    const lifetime = { ...zeroLifetime(), ...(parsed.lifetime ?? {}) };
    if (!parsed.lifetime) issues.push('lifetime missing');
    for (const key of Object.keys(lifetime) as (keyof LifetimeStats)[]) {
      if (key !== 'aiApologized' && !isNumber(lifetime[key])) {
        issues.push(`lifetime.${key} is not a number`);
        lifetime[key] = zeroLifetime()[key] as never;
      }
    }
    lifetime.aiApologized = Boolean(parsed.lifetime?.aiApologized);
    const tier = parsed.tier;
    const tierValid = tier !== undefined && tierRank(tier) >= 0 && tierRank(tier) <= 7;
    if (!tierValid) issues.push(`tier ${String(tier)} is not a known tier`);
    if (!Array.isArray(parsed.topRuns)) issues.push('topRuns is not an array');

    if (issues.length > 0) {
      console.warn(`[meta] save repaired (${issues.length} issue(s)): ${issues.join('; ')}`);
    }

    return {
      version: VERSION,
      lifetime,
      tier: tierValid ? tier : 'junior',
      topRuns: Array.isArray(parsed.topRuns) ? parsed.topRuns.slice(0, MAX_RUNS) : [],
    };
  } catch {
    console.warn('[meta] save unreadable (JSON parse failed) — starting fresh');
    return createMetaStore();
  }
}

export function saveMetaStore(store: MetaStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable (private mode) — meta is best-effort.
  }
}

export function resetMetaStore(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // ignore
  }
}

// --- Achievements (isolated store, own key) ---

export function loadAchievements(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveAchievements(ids: string[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — achievements are best-effort.
  }
}

// --- Recording ---

function mergeLifetime(lifetime: LifetimeStats, stats: RunStats): LifetimeStats {
  const minPositive = (a: number, b: number) =>
    a === 0 ? b : b === 0 ? a : Math.min(a, b);
  return {
    runs: lifetime.runs + 1,
    deliveries: lifetime.deliveries + stats.deliveries,
    failedDeliveries: lifetime.failedDeliveries + stats.failedDeliveries,
    deploys: lifetime.deploys + stats.deploys,
    cleanDeploys: lifetime.cleanDeploys + stats.cleanDeploys,
    glitchesCleared: lifetime.glitchesCleared + stats.glitchesCleared,
    glitchesExpired: lifetime.glitchesExpired + stats.glitchesExpired,
    maxCascade: Math.max(lifetime.maxCascade, stats.maxCascade),
    coffeeUsed: lifetime.coffeeUsed + stats.coffeeUsed,
    aiApologized: lifetime.aiApologized || stats.aiApologized,
    bestLttcMs: minPositive(lifetime.bestLttcMs, stats.bestLttcMs),
    lttcSumMs: lifetime.lttcSumMs + stats.lttcSumMs,
    lttcCount: lifetime.lttcCount + stats.lttcCount,
    locShipped: lifetime.locShipped + stats.locShipped,
    recoveryBestMs: minPositive(lifetime.recoveryBestMs, stats.recoveryBestMs),
    cash: lifetime.cash + 0, // updated by caller with run totals
    hype: lifetime.hype + 0,
    ticketsResolved: lifetime.ticketsResolved + 0,
    ticketsFailed: lifetime.ticketsFailed + 0,
  };
}

export function recordRunComplete(store: MetaStore, run: GameState): MetaStore {
  const lifetime = mergeLifetime(store.lifetime, run.stats);
  lifetime.cash += run.cash;
  lifetime.hype += run.hype;
  lifetime.ticketsResolved += run.ticketsResolved;
  lifetime.ticketsFailed += run.ticketsFailed;

  const record: RunRecord = {
    seed: run.seed,
    tier: run.tier,
    cash: run.cash,
    hype: run.hype,
    loc: run.loc,
    ticketsResolved: run.ticketsResolved,
    ticketsFailed: run.ticketsFailed,
    cleanDeploys: run.stats.cleanDeploys,
    bestLttcMs: run.stats.bestLttcMs,
    glitchesCleared: run.stats.glitchesCleared,
    date: new Date().toISOString(),
  };

  const topRuns = [...store.topRuns, record]
    .sort((a, b) => b.cash - a.cash || b.ticketsResolved - a.ticketsResolved || b.hype - a.hype)
    .slice(0, MAX_RUNS);

  const tier = promotedTier(lifetime, store.tier);
  return { version: VERSION, lifetime, tier, topRuns };
}

// --- Career ladder ---

export interface TierRequirement {
  tier: Tier;
  label: string;
  detail: string;
  met: (s: LifetimeStats) => boolean;
}

/**
 * The corporate ladder. Each rung is a vanity gate on lifetime stats.
 * (The satire: promotion is measured in things you can game, not things
 * you actually fixed.)
 */
export const CAREER_LADDER: TierRequirement[] = [
  { tier: 'junior', label: 'Junior Prompt Engineer', detail: 'Where every legend starts. The coffee is free. The hope is not.', met: () => true },
  {
    tier: 'mid',
    label: 'Mid-Level Prompt Engineer',
    detail: 'You now own a ticket. Congratulations, it is broken.',
    met: s => s.cash >= 5_000,
  },
  {
    tier: 'senior',
    label: 'Senior Prompt Engineer',
    detail: '+1 coffee. The meeting about the meeting has a meeting.',
    met: s => s.cash >= 15_000,
  },
  {
    tier: 'staff',
    label: 'Staff Prompt Engineer',
    detail: 'Three clean deploys. The team pretends to be surprised.',
    met: s => s.cleanDeploys >= 3,
  },
  {
    tier: 'principal',
    label: 'Principal Prompt Engineer',
    detail: 'You now "influence" things. Nothing is fixed. Everything is a framework.',
    met: s => s.cash >= 50_000,
  },
  {
    tier: 'tech-lead',
    label: 'Tech Lead',
    detail: '50 glitches tamed. Your coffee now comes with a freeze spell.',
    met: s => s.glitchesCleared >= 50,
  },
  {
    tier: 'architect',
    label: 'Architect',
    detail: 'You may now draw boxes. The boxes do not run the code.',
    met: s => s.cash >= 150_000 && s.cleanDeploys >= 10,
  },
  {
    tier: 'cto',
    label: 'CTO',
    detail: 'Chief Vibes Officer. The company is now a suggestion.',
    met: () => false, // gated on achievements, checked by the caller
  },
];

export function promotedTier(lifetime: LifetimeStats, current: Tier): Tier {
  let best = current;
  for (const rung of CAREER_LADDER) {
    if (rung.tier === 'cto') continue; // handled separately (achievements)
    if (rung.met(lifetime) && tierRank(rung.tier) > tierRank(best)) {
      best = rung.tier;
    }
  }
  return best;
}

/** The next rung you have not reached yet, with progress toward it. */
export function nextTierHint(
  lifetime: LifetimeStats,
  current: Tier,
): { rung: TierRequirement; progress: number; target: number; label: string } | null {
  for (const rung of CAREER_LADDER) {
    if (rung.tier === 'cto' || tierRank(rung.tier) <= tierRank(current)) continue;
    if (rung.met(lifetime)) continue;
    // Progress toward the first unmet requirement.
    if (rung.tier === 'mid') return { rung, progress: lifetime.cash, target: 5_000, label: 'cash' };
    if (rung.tier === 'senior') return { rung, progress: lifetime.cash, target: 15_000, label: 'cash' };
    if (rung.tier === 'staff')
      return { rung, progress: lifetime.cleanDeploys, target: 3, label: 'clean deploys' };
    if (rung.tier === 'principal')
      return { rung, progress: lifetime.cash, target: 50_000, label: 'cash' };
    if (rung.tier === 'tech-lead')
      return { rung, progress: lifetime.glitchesCleared, target: 50, label: 'glitches cleared' };
    if (rung.tier === 'architect')
      return { rung, progress: lifetime.cleanDeploys, target: 10, label: 'clean deploys ($150K cash also required)' };
  }
  return null;
}

export function avgLttcMs(lifetime: LifetimeStats): number {
  return lifetime.lttcCount > 0 ? Math.round(lifetime.lttcSumMs / lifetime.lttcCount) : 0;
}

export function failureRatePct(lifetime: LifetimeStats): number {
  return lifetime.deliveries > 0
    ? Math.round((lifetime.failedDeliveries / lifetime.deliveries) * 100)
    : 0;
}
