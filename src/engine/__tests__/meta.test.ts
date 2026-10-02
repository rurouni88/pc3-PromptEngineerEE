import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMetaStore,
  loadMetaStore,
  saveMetaStore,
  recordRunComplete,
  zeroLifetime,
  promotedTier,
  nextTierHint,
  avgLttcMs,
  failureRatePct,
  type LifetimeStats,
  type RunRecord,
} from '../meta';
import { ACHIEVEMENTS, newlyUnlockedAchievements, type AchievementContext } from '../achievements';
import { doraForLifetime, doraForRun } from '../dora';
import { createRun, zeroStats } from '../game';
import { EngineeringContent } from '../../data/engineeringContent';
import type { GameState } from '../../types/game';

const C = EngineeringContent;

function fakeRun(overrides: Partial<GameState> = {}): GameState {
  return { ...createRun(C, 'METASEED'), ...overrides };
}

function ctx(
  lifetime: Partial<LifetimeStats> = {},
  extra: Partial<AchievementContext> = {},
): AchievementContext {
  return {
    lifetime: { ...zeroLifetime(), ...lifetime },
    topRuns: [],
    tier: 'junior',
    unlocked: [],
    ...extra,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('meta store', () => {
  it('creates a fresh store', () => {
    const store = createMetaStore();
    expect(store.tier).toBe('junior');
    expect(store.topRuns).toEqual([]);
    expect(store.lifetime.runs).toBe(0);
  });

  it('recovers from corrupt or wrong-version storage', () => {
    localStorage.setItem('pm_meta', '{"version":99,"lifetime":{"runs":"nope"}}');
    const store = loadMetaStore();
    expect(store.version).toBe(1);
    expect(store.lifetime.runs).toBe(0);
    expect(store.tier).toBe('junior');
  });

  it('recovers from garbage storage', () => {
    localStorage.setItem('pm_meta', 'not json at all');
    expect(loadMetaStore().lifetime.runs).toBe(0);
  });

  it('persists and reloads', () => {
    const store = recordRunComplete(createMetaStore(), fakeRun());
    saveMetaStore(store);
    const loaded = loadMetaStore();
    expect(loaded.lifetime.runs).toBe(1);
    expect(loaded.topRuns).toHaveLength(1);
    expect(loaded.topRuns[0].seed).toBe('METASEED');
  });

  it('caps top runs at 30, sorted by cash', () => {
    let store = createMetaStore();
    for (let i = 0; i < 35; i++) {
      store = recordRunComplete(store, fakeRun({ cash: i * 100, hype: i }));
    }
    expect(store.topRuns).toHaveLength(30);
    expect(store.topRuns[0].cash).toBe(3400);
    expect(store.topRuns[29].cash).toBe(500);
  });

  it('merges run stats into lifetime (min for bests, max for cascades)', () => {
    let store = createMetaStore();
    store = recordRunComplete(
      store,
      fakeRun({
        cash: 100,
        stats: { ...zeroStats(), bestLttcMs: 60_000, maxCascade: 2, cleanDeploys: 1 },
      }),
    );
    store = recordRunComplete(
      store,
      fakeRun({
        cash: 50,
        stats: { ...zeroStats(), bestLttcMs: 30_000, maxCascade: 5, cleanDeploys: 2 },
      }),
    );
    expect(store.lifetime.bestLttcMs).toBe(30_000);
    expect(store.lifetime.maxCascade).toBe(5);
    expect(store.lifetime.cleanDeploys).toBe(3);
    expect(store.lifetime.cash).toBe(150);
  });
});

describe('career ladder', () => {
  it('promotes on cash thresholds', () => {
    expect(promotedTier({ ...zeroLifetime(), cash: 4_999 }, 'junior')).toBe('junior');
    expect(promotedTier({ ...zeroLifetime(), cash: 5_000 }, 'junior')).toBe('mid');
    expect(promotedTier({ ...zeroLifetime(), cash: 15_000 }, 'mid')).toBe('senior');
    expect(promotedTier({ ...zeroLifetime(), cash: 50_000 }, 'senior')).toBe('principal');
  });

  it('promotes on clean deploys and glitch clearing', () => {
    expect(promotedTier({ ...zeroLifetime(), cleanDeploys: 3, cash: 15_000 }, 'senior')).toBe(
      'staff',
    );
    expect(
      promotedTier({ ...zeroLifetime(), glitchesCleared: 50, cash: 50_000 }, 'principal'),
    ).toBe('tech-lead');
  });

  it('is monotonic: never demotes', () => {
    expect(promotedTier({ ...zeroLifetime(), cash: 0 }, 'principal')).toBe('principal');
  });

  it('tracks the highest tier across runs', () => {
    let store = createMetaStore();
    store = recordRunComplete(store, fakeRun({ cash: 15_000 }));
    expect(store.tier).toBe('senior');
    store = recordRunComplete(store, fakeRun({ cash: 100 }));
    expect(store.tier).toBe('senior');
  });

  it('nextTierHint points at the first unmet rung', () => {
    const hint = nextTierHint(zeroLifetime(), 'junior');
    expect(hint?.rung.tier).toBe('mid');
    expect(hint?.progress).toBe(0);
    expect(hint?.target).toBe(5_000);

    const mid = { ...zeroLifetime(), cash: 5_000 };
    const hint2 = nextTierHint(mid, 'mid');
    expect(hint2?.rung.tier).toBe('senior');
  });
});

describe('dora helpers', () => {
  it('avgLttcMs and failureRatePct handle zero deliveries', () => {
    expect(avgLttcMs(zeroLifetime())).toBe(0);
    expect(failureRatePct(zeroLifetime())).toBe(0);
    expect(avgLttcMs({ ...zeroLifetime(), lttcSumMs: 90_000, lttcCount: 3 })).toBe(30_000);
    expect(failureRatePct({ ...zeroLifetime(), deliveries: 10, failedDeliveries: 3 })).toBe(30);
  });
});

describe('achievements', () => {
  it('unlocks first_blood after a delivery', () => {
    const ids = newlyUnlockedAchievements(ctx({ deliveries: 1 }));
    expect(ids).toContain('first_blood');
  });

  it('never unlocks aspirational v0.99.9', () => {
    const ids = newlyUnlockedAchievements(
      ctx({
        deliveries: 99,
        cleanDeploys: 99,
        locShipped: 999_999,
        coffeeUsed: 999,
        maxCascade: 9,
        aiApologized: true,
        bestLttcMs: 10_000,
        recoveryBestMs: 10_000,
        glitchesCleared: 999,
        hype: 999,
        ticketsResolved: 99,
      }),
    );
    expect(ids).not.toContain('v0_99_9');
  });

  it('cobra_effect: elite LTTC + poor failure rate in one run', () => {
    const run: RunRecord = {
      seed: 'COBRA1',
      tier: 'junior',
      cash: 100,
      hype: 0,
      loc: 10,
      ticketsResolved: 2,
      ticketsFailed: 3,
      cleanDeploys: 1,
      bestLttcMs: 40_000,
      glitchesCleared: 5,
      date: '2026-01-01T00:00:00.000Z',
    };
    expect(newlyUnlockedAchievements(ctx({}, { topRuns: [run] }))).toContain('cobra_effect');
    // Slow LTTC: not elite, no unlock.
    expect(
      newlyUnlockedAchievements(ctx({}, { topRuns: [{ ...run, bestLttcMs: 60_000 }] })),
    ).not.toContain('cobra_effect');
    // Healthy failure rate: no unlock.
    expect(
      newlyUnlockedAchievements(
        ctx({}, { topRuns: [{ ...run, ticketsFailed: 0, ticketsResolved: 5 }] }),
      ),
    ).not.toContain('cobra_effect');
  });

  it('cto_of_one requires every other implemented achievement unlocked', () => {
    const all = ACHIEVEMENTS.filter(a => a.implemented && a.id !== 'cto_of_one').map(a => a.id);
    const ids = newlyUnlockedAchievements(
      ctx({ deliveries: 1 }, { unlocked: all, tier: 'cto' }),
    );
    expect(ids).toContain('cto_of_one');

    const missing = all.filter(id => id !== 'first_blood');
    expect(newlyUnlockedAchievements(ctx({ deliveries: 99 }, { unlocked: missing }))).not.toContain(
      'cto_of_one',
    );
  });

  it('does not re-report already-unlocked achievements', () => {
    const ids = newlyUnlockedAchievements(ctx({ deliveries: 1 }, { unlocked: ['first_blood'] }));
    expect(ids).not.toContain('first_blood');
  });
});

describe('dora dashboard', () => {
  it('bands a strong lifetime as all-elite with the prayer summary', () => {
    const d = doraForLifetime({
      ...zeroLifetime(),
      deliveries: 10,
      lttcSumMs: 300_000,
      lttcCount: 10,
      failedDeliveries: 1,
      recoveryBestMs: 15_000,
    });
    expect(d.metrics.every(m => m.band === 'elite')).toBe(true);
    expect(d.summary).toContain('load-bearing prayer');
  });

  it('cobra summary: elite LTTC with poor failure rate', () => {
    const d = doraForLifetime({
      ...zeroLifetime(),
      deliveries: 10,
      lttcSumMs: 200_000,
      lttcCount: 10,
      failedDeliveries: 7,
    });
    expect(d.summary).toContain('forensic');
  });

  it('all-poor summary for a fresh store', () => {
    const d = doraForLifetime(zeroLifetime());
    expect(d.metrics.every(m => m.band === 'poor')).toBe(true);
    expect(d.summary).toContain('exit sign');
  });

  it('per-run dashboard reflects the run stats', () => {
    const d = doraForRun({
      ...zeroStats(),
      deliveries: 3,
      failedDeliveries: 3,
      bestLttcMs: 25_000,
    });
    const cfr = d.metrics.find(m => m.key === 'cfr');
    expect(cfr?.band).toBe('poor');
    expect(cfr?.value).toBe('100%');
  });
});
