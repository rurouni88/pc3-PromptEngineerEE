// src/engine/dora.ts
// The fake DORA dashboard. Real metric names, real bands (Elite/Good/Poor),
// satirical reading. The Cobra Effect is the feature: chasing Elite LTTC
// means shipping more garbage, so the dashboard is always half-green,
// half-forensic.

import type { LifetimeStats } from './meta';
import { avgLttcMs, failureRatePct } from './meta';
import type { RunStats } from '../types/game';

export type DoraBand = 'elite' | 'good' | 'poor';

export interface DoraMetric {
  key: string;
  label: string;
  value: string;
  band: DoraBand;
  detail: string;
}

export interface DoraDashboard {
  metrics: DoraMetric[];
  summary: string;
}

export const BAND_LABEL: Record<DoraBand, string> = {
  elite: 'Elite',
  good: 'Good',
  poor: 'Poor',
};

export function formatMs(ms: number): string {
  if (ms <= 0) return '—';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

// --- Bands (DORA-style thresholds, tuned for the joke) ---

function deploymentBand(n: number): DoraBand {
  return n >= 8 ? 'elite' : n >= 4 ? 'good' : 'poor';
}
function lttcBand(ms: number): DoraBand {
  if (ms <= 0) return 'poor';
  return ms < 45_000 ? 'elite' : ms <= 90_000 ? 'good' : 'poor';
}
function cfrBand(pct: number): DoraBand {
  return pct < 15 ? 'elite' : pct <= 40 ? 'good' : 'poor';
}
function recoveryBand(ms: number): DoraBand {
  if (ms <= 0) return 'poor';
  return ms < 20_000 ? 'elite' : ms <= 45_000 ? 'good' : 'poor';
}

function summaryFor(metrics: DoraMetric[]): string {
  const elite = metrics.filter(m => m.band === 'elite').length;
  const poor = metrics.filter(m => m.band === 'poor').length;
  const lttc = metrics.find(m => m.key === 'lttc');
  const cfr = metrics.find(m => m.key === 'cfr');
  if (lttc?.band === 'elite' && cfr?.band === 'poor') {
    return 'You ship faster than your code can die. Impressive, in a forensic sense.';
  }
  if (elite >= 3) {
    return 'Your metrics are Elite. Your codebase is a load-bearing prayer.';
  }
  if (poor === metrics.length) {
    return 'The dashboard is red. So is the exit sign.';
  }
  return 'The dashboard is green enough. Nobody reads it anyway.';
}

/** Lifetime dashboard (start screen). */
export function doraForLifetime(lifetime: LifetimeStats): DoraDashboard {
  const lttc = avgLttcMs(lifetime);
  const cfr = failureRatePct(lifetime);
  const metrics: DoraMetric[] = [
    {
      key: 'deploys',
      label: 'Deployment Frequency',
      value: lifetime.deliveries === 0 ? '—' : `${lifetime.deliveries}/day`,
      band: deploymentBand(lifetime.deliveries),
      detail:
        lifetime.deliveries >= 8
          ? 'You deploy more than you sleep.'
          : lifetime.deliveries >= 4
            ? 'A respectable cadence of chaos.'
            : 'The pipeline is mostly decorative.',
    },
    {
      key: 'lttc',
      label: 'Lead Time to Change',
      value: formatMs(lttc),
      band: lttcBand(lttc),
      detail:
        lttcBand(lttc) === 'elite'
          ? 'Blazing. The on-call rotation is just you, at 3am.'
          : lttcBand(lttc) === 'good'
            ? 'Fast enough to matter, slow enough to survive.'
            : 'Your "quick fix" has a project plan.',
    },
    {
      key: 'cfr',
      label: 'Change Failure Rate',
      value: lifetime.deliveries === 0 ? '—' : `${cfr}%`,
      band: lifetime.deliveries === 0 ? 'poor' : cfrBand(cfr),
      detail:
        cfrBand(cfr) === 'elite'
          ? 'Barely anything breaks. Suspicious.'
          : cfrBand(cfr) === 'good'
            ? 'Mostly fires, some buildings.'
            : 'The incident channel has its own weather system.',
    },
    {
      key: 'recovery',
      label: 'Mean Time to Recover',
      value: formatMs(lifetime.recoveryBestMs),
      band: recoveryBand(lifetime.recoveryBestMs),
      detail:
        recoveryBand(lifetime.recoveryBestMs) === 'elite'
          ? 'You recover faster than the blame does.'
          : recoveryBand(lifetime.recoveryBestMs) === 'good'
            ? 'The postmortem is already a template.'
            : 'Recovery is a theoretical concept here.',
    },
  ];
  return { metrics, summary: summaryFor(metrics) };
}

/** Per-run dashboard (result screen). */
export function doraForRun(stats: RunStats): DoraDashboard {
  const lttc = stats.bestLttcMs;
  const cfr = stats.deliveries > 0 ? Math.round((stats.failedDeliveries / stats.deliveries) * 100) : 0;
  const metrics: DoraMetric[] = [
    {
      key: 'deploys',
      label: 'Deployment Frequency',
      value: stats.deliveries === 0 ? '—' : `${stats.deliveries} today`,
      band: deploymentBand(stats.deliveries),
      detail: stats.deliveries >= 8 ? 'A full day. The coffee machine mourns.' : 'The day is young.',
    },
    {
      key: 'lttc',
      label: 'Lead Time to Change',
      value: formatMs(lttc),
      band: lttcBand(lttc),
      detail:
        lttcBand(lttc) === 'elite'
          ? 'Blazing. The on-call rotation is just you, at 3am.'
          : lttcBand(lttc) === 'good'
            ? 'Fast enough to matter, slow enough to survive.'
            : 'Your "quick fix" has a project plan.',
    },
    {
      key: 'cfr',
      label: 'Change Failure Rate',
      value: stats.deliveries === 0 ? '—' : `${cfr}%`,
      band: stats.deliveries === 0 ? 'poor' : cfrBand(cfr),
      detail:
        cfrBand(cfr) === 'elite'
          ? 'Barely anything breaks. Suspicious.'
          : cfrBand(cfr) === 'good'
            ? 'Mostly fires, some buildings.'
            : 'The incident channel has its own weather system.',
    },
    {
      key: 'recovery',
      label: 'Mean Time to Recover',
      value: formatMs(stats.recoveryBestMs),
      band: recoveryBand(stats.recoveryBestMs),
      detail:
        recoveryBand(stats.recoveryBestMs) === 'elite'
          ? 'You recover faster than the blame does.'
          : recoveryBand(stats.recoveryBestMs) === 'good'
            ? 'The postmortem is already a template.'
            : 'Recovery is a theoretical concept here.',
    },
  ];
  return { metrics, summary: summaryFor(metrics) };
}
