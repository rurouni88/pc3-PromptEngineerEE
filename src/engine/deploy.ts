// src/engine/deploy.ts
// The deploy phase — the active core of the game. Lines stream in, glitches
// erupt, the player taps to hotfix before the fuse runs out. Misses cascade.
// Corruption at 100 = production meltdown. Pure + seeded: same seed and same
// input sequence produce the identical deploy.

import { RngEngine } from './seeded-rng';
import {
  TUNING,
  promptQuality,
  glitchChance,
  appendLog,
  appendChat,
  withStress,
  tierRank,
} from './game';
import type { GameContentProfile } from '../types/content';
import type { GameState, DeployState, DeployLine, Glitch, Outcome } from '../types/game';

// --- Setup ---

/** Builds the deploy stream and switches to the deploying phase. */
export function startDeploy(state: GameState, content: GameContentProfile): GameState {
  if (state.phase !== 'compiling' || !state.ticket) return state;
  const ticket = state.ticket;
  const { quality, hype } = promptQuality(state, content);
  const chance = glitchChance(quality, hype);
  const lineCount = TUNING.linesBase + ticket.storyPoints;

  let nextId = state.nextId;
  const lines: DeployLine[] = [];
  for (let i = 0; i < lineCount; i++) {
    // Fixed draw order per line keeps the RNG stream aligned across prompts,
    // so the glitch layout is monotonic in chance (testable).
    const rText = RngEngine.random();
    const rGlitch = RngEngine.random();
    const rBoss = RngEngine.random();
    const glitched = rGlitch < chance;
    const boss = glitched && rBoss < TUNING.bossChance;
    const text =
      content.deployLines[Math.floor(rText * content.deployLines.length)] ?? '';
    lines.push({ id: nextId++, text, glitched, boss });
  }

  return {
    ...state,
    phase: 'deploying',
    nextId,
    deploy: {
      lines,
      revealed: 0,
      glitches: [],
      corruption: 0,
      cleared: 0,
      expired: 0,
      maxCascade: 0,
      extraCash: 0,
      hypeLevel: hype,
      blastFreezeTicks: 0,
      done: false,
    },
  };
}

// --- Tick (500ms) ---

export function tickDeploy(
  state: GameState,
  content: GameContentProfile,
  now: () => string,
): GameState {
  if (state.phase !== 'deploying' || !state.deploy || state.deploy.done) return state;

  // Working copies — mutate these, never the previous state.
  const deploy: DeployState = {
    ...state.deploy,
    lines: state.deploy.lines.map(l => ({ ...l })),
    glitches: state.deploy.glitches.map(g => ({ ...g })),
  };
  let next: GameState = { ...state, runClockMs: state.runClockMs + TUNING.deployTickMs };
  let stressDelta = 0;
  let expiredNow = 0;

  // 1. Stream the next line. Glitched lines erupt on reveal.
  if (deploy.revealed < deploy.lines.length) {
    const index = deploy.revealed;
    deploy.revealed += 1;
    const line = deploy.lines[index];
    if (line.glitched) {
      deploy.glitches.push({
        id: next.nextId,
        lineIndex: index,
        tapsNeeded: line.boss ? TUNING.bossTaps : 1,
        boss: line.boss,
        fuse: TUNING.fuseTicks,
        cascadeDepth: 0,
        state: 'active',
      });
      next = { ...next, nextId: next.nextId + 1 };
    }
  }

  // 2. Fuse decay on live glitches.
  for (const g of deploy.glitches) {
    if (g.state === 'active') g.fuse -= 1;
  }

  // 3. Expired glitches: corruption, stress, and cascades.
  for (const g of deploy.glitches) {
    if (g.state !== 'active' || g.fuse > 0) continue;
    g.state = 'expired';
    deploy.expired += 1;
    expiredNow += 1;
    deploy.corruption = Math.min(
      100,
      deploy.corruption + (g.boss ? TUNING.corruptionPerBossExpired : TUNING.corruptionPerExpired),
    );
    stressDelta += g.boss ? TUNING.stressPerBossExpired : TUNING.stressPerExpired;

    if (g.cascadeDepth < TUNING.maxCascadeDepth && deploy.blastFreezeTicks <= 0) {
      next = spawnCascadeChildren(next, deploy, g);
    }
  }

  // 4. Blast-freeze countdown (Tech Lead perk).
  if (deploy.blastFreezeTicks > 0) deploy.blastFreezeTicks -= 1;

  next = {
    ...next,
    deploy,
    stats:
      expiredNow > 0
        ? { ...next.stats, glitchesExpired: next.stats.glitchesExpired + expiredNow }
        : next.stats,
  };

  // 5. Meltdown.
  if (deploy.corruption >= 100) {
    return finishDeploy(next, content, now, true);
  }

  // 6. Settle: everything revealed, nothing live.
  const hasActive = deploy.glitches.some(g => g.state === 'active');
  if (deploy.revealed === deploy.lines.length && !hasActive) {
    return finishDeploy(next, content, now, false);
  }

  next = withStress(next, stressDelta);
  if (next.stress >= 100) next = { ...next, phase: 'game-over' };
  return next;
}

/**
 * An expired glitch spawns two children on clean lines. Preference:
 * unrevealed lines (they erupt on reveal — the dread of the incoming);
 * fallback: revealed lines that never glitched (instant eruption).
 */
function spawnCascadeChildren(
  state: GameState,
  deploy: DeployState,
  parent: Glitch,
): GameState {
  const depth = parent.cascadeDepth + 1;
  const glitchedLine = new Set(deploy.glitches.map(g => g.lineIndex));

  const poolA = deploy.lines
    .map((_, i) => i)
    .filter(i => i >= deploy.revealed && !deploy.lines[i].glitched);
  const poolB = deploy.lines
    .map((_, i) => i)
    .filter(i => i < deploy.revealed && !glitchedLine.has(i));
  const pool = [...(poolA.length > 0 ? poolA : poolB)];

  let next = state;
  let spawned = 0;
  for (let k = 0; k < 2 && pool.length > 0; k++) {
    const idx = pool.splice(Math.floor(RngEngine.random() * pool.length), 1)[0];
    if (idx === undefined) continue;
    if (idx >= deploy.revealed) {
      deploy.lines[idx] = { ...deploy.lines[idx], glitched: true };
    } else {
      deploy.glitches.push({
        id: next.nextId,
        lineIndex: idx,
        tapsNeeded: 1,
        boss: false,
        fuse: TUNING.fuseTicks,
        cascadeDepth: depth,
        state: 'active',
      });
      next = { ...next, nextId: next.nextId + 1 };
    }
    spawned += 1;
  }
  if (spawned > 0) deploy.maxCascade = Math.max(deploy.maxCascade, depth);
  return next;
}

// --- Player actions ---

/** Tap a live glitch. Bosses need three taps. Clears pay out (hype scales it). */
export function tapGlitch(state: GameState, glitchId: number): GameState {
  if (state.phase !== 'deploying' || !state.deploy || state.deploy.done) return state;
  const deploy: DeployState = {
    ...state.deploy,
    glitches: state.deploy.glitches.map(g => ({ ...g })),
  };
  const glitch = deploy.glitches.find(g => g.id === glitchId);
  if (!glitch || glitch.state !== 'active') return state;

  glitch.tapsNeeded -= 1;
  if (glitch.tapsNeeded > 0) return { ...state, deploy };

  glitch.state = 'cleared';
  deploy.cleared += 1;
  const payout = Math.floor(TUNING.glitchPayout * (1 + TUNING.glitchHypeMult * deploy.hypeLevel));
  deploy.extraCash += payout;
  const stats = { ...state.stats, glitchesCleared: state.stats.glitchesCleared + 1 };
  return withStress({ ...state, deploy, stats }, -TUNING.stressPerClear);
}

/**
 * The PANIC button: every active glitch is cleared, no payout, one coffee.
 * Tech Lead and above: also freezes cascades for a few ticks (once per run).
 */
export function coffeeBlast(state: GameState): GameState {
  if (state.phase !== 'deploying' || !state.deploy || state.deploy.done) return state;
  if (state.coffee <= 0) return state;

  const deploy: DeployState = {
    ...state.deploy,
    glitches: state.deploy.glitches.map(g =>
      g.state === 'active' ? { ...g, state: 'cleared' as const } : { ...g },
    ),
  };
  const clearedNow = state.deploy.glitches.filter(g => g.state === 'active').length;
  deploy.cleared += clearedNow;

  const stats = {
    ...state.stats,
    glitchesCleared: state.stats.glitchesCleared + clearedNow,
    coffeeUsed: state.stats.coffeeUsed + 1,
  };
  const hasPerk = tierRank(state.tier) >= tierRank('tech-lead');
  if (hasPerk && !state.stats.blastFreezeUsed && clearedNow > 0) {
    deploy.blastFreezeTicks = TUNING.blastFreezeTicks;
    stats.blastFreezeUsed = true;
  }

  return { ...state, deploy, stats, coffee: state.coffee - 1 };
}

// --- Finish ---

function finishDeploy(
  state: GameState,
  content: GameContentProfile,
  now: () => string,
  meltdown: boolean,
): GameState {
  const deploy = state.deploy!;
  const ticket = state.ticket!;
  const lttcMs = state.runClockMs - state.ticketStartClock;

  let outcome: Outcome;
  if (meltdown) {
    outcome = 'fail';
  } else if (deploy.expired === 0 && deploy.corruption === 0) {
    outcome = 'clean';
  } else if (
    deploy.expired <= TUNING.roughMaxExpired &&
    deploy.corruption < TUNING.roughMaxCorruption
  ) {
    outcome = 'rough';
  } else {
    outcome = 'shaky';
  }

  const mult =
    outcome === 'clean'
      ? TUNING.multClean
      : outcome === 'rough'
        ? TUNING.multRough
        : outcome === 'shaky'
          ? TUNING.multShaky
          : 0;
  const shipped = mult > 0;

  const locGain = Math.floor(ticket.storyPoints * TUNING.locPerStoryPoint * mult);
  const cashEarned = shipped ? Math.floor(ticket.reward.cash * mult) + deploy.extraCash : 0;
  const hypeEarned = shipped ? Math.floor(ticket.reward.hype * mult) : 0;

  const stressDelta =
    outcome === 'clean'
      ? TUNING.stressClean
      : outcome === 'rough'
        ? TUNING.stressRough
        : outcome === 'shaky'
          ? TUNING.stressShaky
          : TUNING.stressMeltdown;

  // Run stats — feed the DORA dashboard and achievements.
  const stats = { ...state.stats };
  stats.deliveries += 1;
  stats.deploys += 1;
  stats.maxCascade = Math.max(stats.maxCascade, deploy.maxCascade);
  if (shipped) {
    if (outcome === 'clean') stats.cleanDeploys += 1;
    stats.bestLttcMs = stats.bestLttcMs === 0 ? lttcMs : Math.min(stats.bestLttcMs, lttcMs);
    stats.lttcSumMs += lttcMs;
    stats.lttcCount += 1;
    stats.locShipped += locGain;
    if (stats.lastMeltdownClock > 0) {
      const recovery = state.runClockMs - stats.lastMeltdownClock;
      stats.recoveryBestMs =
        stats.recoveryBestMs === 0 ? recovery : Math.min(stats.recoveryBestMs, recovery);
      stats.lastMeltdownClock = 0;
    }
  } else {
    stats.failedDeliveries += 1;
    stats.lastMeltdownClock = state.runClockMs;
  }

  let next: GameState = {
    ...state,
    phase: 'result',
    deploy: { ...deploy, done: true },
    lastResult: {
      outcome,
      cashEarned,
      hypeEarned,
      lttcMs,
      glitchesCleared: deploy.cleared,
      glitchesExpired: deploy.expired,
      maxCascade: deploy.maxCascade,
    },
    loc: state.loc + locGain,
    ticketsResolved: state.ticketsResolved + (shipped ? 1 : 0),
    ticketsFailed: state.ticketsFailed + (shipped ? 0 : 1),
    cash: state.cash + cashEarned,
    hype: state.hype + hypeEarned,
    stats,
  };
  next = withStress(next, stressDelta);

  if (outcome === 'clean') {
    next = appendLog(next, '✅ CLEAN DEPLOY: Zero pages. The AI is suspiciously competent.');
    next = appendLog(next, `> ${locGain} lines generated`);
    next = appendLog(next, `🚀 +$${cashEarned.toLocaleString()}  ⭐${hypeEarned}`);
    next = appendChat(next, content.chatReactions.deployClean, now());
  } else if (outcome === 'rough') {
    next = appendLog(next, '⚠️ ROUGH DEPLOY: Shipped with caveats. The TODOs will haunt you.');
    next = appendLog(next, `🚀 +$${cashEarned.toLocaleString()}  ⭐${hypeEarned}`);
  } else if (outcome === 'shaky') {
    next = appendLog(next, '🩹 SHAKY DEPLOY: It is up. It is also a crime scene.');
    next = appendLog(next, `🚀 +$${cashEarned.toLocaleString()}  ⭐${hypeEarned}`);
  } else {
    const errorLog =
      content.errorLogs[Math.floor(RngEngine.random() * content.errorLogs.length)] ?? null;
    if (errorLog) next = appendLog(next, errorLog);
    next = appendLog(
      next,
      '❌ PRODUCTION MELTDOWN. The deploy bot has filed for a restraining order.',
    );
    next = appendChat(next, content.chatReactions.deployFailed, now());
  }

  if (next.stress >= 100) next = { ...next, phase: 'game-over' };
  return next;
}
