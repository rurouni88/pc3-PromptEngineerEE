// src/engine/achievements.ts
// Lifetime achievements — pure predicates over the meta store.
// Tone: corporate puns. `implemented: false` marks aspirational entries
// (the joke: the roadmap is a wish list).

import type { LifetimeStats, RunRecord } from './meta';
import type { Tier } from '../types/content';
import { tierRank } from './game';

export interface AchievementContext {
  lifetime: LifetimeStats;
  topRuns: RunRecord[];
  tier: Tier;
  /** Achievement ids already unlocked (for meta-achievements). */
  unlocked: string[];
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Shipped your first ticket. The confetti is a lie.',
    implemented: true,
    check: ctx => ctx.lifetime.deliveries >= 1,
  },
  {
    id: 'clean_slate',
    name: 'Clean Slate',
    description: 'Ten clean deploys. The codebase suspects you of witchcraft.',
    implemented: true,
    check: ctx => ctx.lifetime.cleanDeploys >= 10,
  },
  {
    id: 'cobra_effect',
    name: 'Cobra Effect',
    description:
      'Elite LTTC and a terrible failure rate in one run. You optimized the thing that was never the problem.',
    implemented: true,
    check: ctx =>
      ctx.topRuns.some(
        r =>
          r.bestLttcMs > 0 &&
          r.bestLttcMs < 45_000 &&
          r.ticketsResolved + r.ticketsFailed > 0 &&
          r.ticketsFailed / (r.ticketsResolved + r.ticketsFailed) > 0.4,
      ),
  },
  {
    id: 'nightmare_support',
    name: '24/7',
    description: 'You have been paged 25 times. Sleep is a rumor.',
    implemented: true,
    check: ctx => ctx.lifetime.failedDeliveries >= 25,
  },
  {
    id: 'loc_baron',
    name: 'LOC Baron',
    description: '100,000 lines shipped. Most of it a load-bearing prayer.',
    implemented: true,
    check: ctx => ctx.lifetime.locShipped >= 100_000,
  },
  {
    id: 'coffee_addict',
    name: 'Caffeinated',
    description: 'Drank 100 coffees. Your doctor has left the chat.',
    implemented: true,
    check: ctx => ctx.lifetime.coffeeUsed >= 100,
  },
  {
    id: 'cascade_survivor',
    name: 'Chaos Tamer',
    description: 'Survived a cascade depth of 4. The office plant is still alive.',
    implemented: true,
    check: ctx => ctx.lifetime.maxCascade >= 4,
  },
  {
    id: 'ai_incident',
    name: 'AI Incident',
    description: 'The AI apologized. HR has been notified.',
    implemented: true,
    check: ctx => ctx.lifetime.aiApologized,
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Sub-30s lead time. Your keyboard is a hazard.',
    implemented: true,
    check: ctx => ctx.lifetime.bestLttcMs > 0 && ctx.lifetime.bestLttcMs < 30_000,
  },
  {
    id: 'resilience',
    name: 'Resilience',
    description: 'Recovered from a meltdown in under 60s. Psychologically, maybe not.',
    implemented: true,
    check: ctx => ctx.lifetime.recoveryBestMs > 0 && ctx.lifetime.recoveryBestMs < 60_000,
  },
  {
    id: 'glitch_hunter',
    name: 'Glitch Hunter',
    description: "Cleared 100 glitches. They're learning to dodge.",
    implemented: true,
    check: ctx => ctx.lifetime.glitchesCleared >= 100,
  },
  {
    id: 'hype_train',
    name: 'Hype Train',
    description: 'Earned 500 hype. The dashboard is a carnival.',
    implemented: true,
    check: ctx => ctx.lifetime.hype >= 500,
  },
  {
    id: 'survivor',
    name: 'Week One',
    description: 'Finished a full day (10+ tickets). The building is still standing.',
    implemented: true,
    check: ctx => ctx.lifetime.ticketsResolved >= 10,
  },
  {
    id: 'promotion',
    name: 'Promoted',
    description: "Reached Tech Lead. Your title now contains a word you can't pronounce.",
    implemented: true,
    check: ctx => tierRank(ctx.tier) >= tierRank('tech-lead'),
  },
  {
    id: 'v0_99_9',
    name: 'v0.99.9',
    description: 'Implemented: false. Aspirational: true.',
    implemented: false,
    check: () => false,
  },
  {
    id: 'cto_of_one',
    name: 'CTO of One',
    description: 'You have achieved everything. The company is now a suggestion.',
    implemented: true,
    check: ctx =>
      ACHIEVEMENTS.filter(a => a.implemented && a.id !== 'cto_of_one').every(a =>
        ctx.unlocked.includes(a.id),
      ),
  },
];

/**
 * Evaluate achievements against the current context. Returns ids that are
 * implemented, currently passing, and not yet unlocked. Pure.
 */
export function newlyUnlockedAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter(
    a => a.implemented && !ctx.unlocked.includes(a.id) && a.check(ctx),
  ).map(a => a.id);
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
