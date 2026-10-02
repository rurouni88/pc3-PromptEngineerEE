// src/engine/game.ts
// Pure game logic. Zero React imports. Every function takes state and
// returns new state — testable in isolation, deterministic under a seeded RngEngine.
//
// The outcome is no longer a hidden roll: compile always passes, and the
// deploy phase (deploy.ts) decides clean/rough/shaky/fail emergently from
// what the player actually does.

import { RngEngine } from './seeded-rng';
import { startDeploy, coffeeBlast } from './deploy';
import type { GameContentProfile, TokenCategory, TokenDefinition, Tier, Tag, ChatMessage } from '../types/content';
import type {
  GameState,
  DebtLevel,
  RunResult,
  RunStats,
  StagedToken,
} from '../types/game';

// --- Tuning knobs (balance lives here, not in components) ---

export const TUNING = {
  baseStress: 20,
  baseCoffee: 3,
  baseLoc: 8400,
  coffeeStressRelief: 15,
  timeoutStress: 25,
  ticketTimeBase: 60,
  ticketTimePerStoryPoint: 10,
  locPerStoryPoint: 100,

  // Tick cadence (ms) per phase — also the logical clock step.
  ticketTickMs: 1000,
  compileTickMs: 600,
  deployTickMs: 500,

  // Prompt quality
  qualityTagWeight: 0.6,
  qualitySafetyWeight: 0.4,
  safetyDivisor: 4,
  hypeDivisor: 6,

  // Glitch spawning: chance = base - reduce*quality + increase*hype
  baseGlitchChance: 0.5,
  glitchQualityReduce: 0.4,
  glitchHypeIncrease: 0.25,
  glitchChanceMin: 0.08,
  glitchChanceMax: 0.7,
  bossChance: 0.1,
  bossTaps: 3,

  // Deploy phase
  linesBase: 10,
  fuseTicks: 4,
  maxCascadeDepth: 4,
  blastFreezeTicks: 6,

  // Corruption / stress
  corruptionPerExpired: 12,
  corruptionPerBossExpired: 20,
  stressPerExpired: 4,
  stressPerBossExpired: 8,
  stressMeltdown: 25,
  stressPerClear: 1,
  stressClean: -10,
  stressRough: -5,
  stressShaky: 5,

  // Payouts
  glitchPayout: 25,
  glitchHypeMult: 0.5,

  // Outcome multipliers (reward + LOC)
  multClean: 1.0,
  multRough: 0.6,
  multShaky: 0.3,

  // Outcome thresholds
  roughMaxExpired: 3,
  roughMaxCorruption: 40,

  // Rare compile event (achievement bait)
  aiApologyChance: 0.02,
} as const;

// --- Career tiers ---

export const TIER_ORDER: Tier[] = [
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'tech-lead',
  'architect',
  'cto',
];

export function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

export function tokenUnlocked(token: TokenDefinition, tier: Tier): boolean {
  return !token.minTier || tierRank(tier) >= tierRank(token.minTier);
}

export function ticketUnlocked(ticket: { minTier?: Tier }, tier: Tier): boolean {
  return !ticket.minTier || tierRank(tier) >= tierRank(ticket.minTier);
}

/** Senior and above start with an extra coffee. */
export function coffeeForTier(tier: Tier): number {
  return TUNING.baseCoffee + (tierRank(tier) >= tierRank('senior') ? 1 : 0);
}

// --- Derived state ---

export function debtLevel(stress: number): DebtLevel {
  if (stress > 80) return 'CRITICAL';
  if (stress > 60) return 'HIGH';
  if (stress > 40) return 'MODERATE';
  return 'LOW';
}

export function ticketTimeFor(storyPoints: number): number {
  return TUNING.ticketTimeBase + storyPoints * TUNING.ticketTimePerStoryPoint;
}

// --- Prompt quality (the matching puzzle) ---

export interface PromptQuality {
  /** 0..1 — fraction of ticket needs covered by staged tags. */
  tagMatch: number;
  matched: number;
  /** Which ticket needs are covered (for UI highlighting). */
  matchedTags: Tag[];
  total: number;
  /** 0..1 — normalized safety. */
  safety: number;
  /** 0..1 — normalized hype. */
  hype: number;
  /** 0..1 — tag match + safety blend. Higher = fewer glitches. */
  quality: number;
}

export function promptQuality(state: GameState, content: GameContentProfile): PromptQuality {
  const allTokens = (Object.values(content.tokens)).flat();
  const stagedDefs = state.stagedTokens
    .map(st => allTokens.find(t => t.text === st.text))
    .filter((t): t is TokenDefinition => t !== undefined);

  const stagedTags = new Set(stagedDefs.flatMap(d => d.tags));
  const needs = state.ticket?.needs ?? [];
  const matchedTags = needs.filter(n => stagedTags.has(n));
  const tagMatch = needs.length === 0 ? 0 : matchedTags.length / needs.length;

  const totalSafety = stagedDefs.reduce((sum, d) => sum + d.safety, 0);
  const totalHype = stagedDefs.reduce((sum, d) => sum + d.hype, 0);
  const safety = Math.min(1, totalSafety / TUNING.safetyDivisor);
  const hype = Math.min(1, totalHype / TUNING.hypeDivisor);

  const quality = TUNING.qualityTagWeight * tagMatch + TUNING.qualitySafetyWeight * safety;
  return { tagMatch, matched: matchedTags.length, matchedTags, total: needs.length, safety, hype, quality };
}

/** Glitch spawn chance per deploy line. Quality lowers it, hype raises it. */
export function glitchChance(quality: number, hype: number): number {
  const chance =
    TUNING.baseGlitchChance -
    TUNING.glitchQualityReduce * quality +
    TUNING.glitchHypeIncrease * hype;
  return Math.min(TUNING.glitchChanceMax, Math.max(TUNING.glitchChanceMin, chance));
}

// --- Small state helpers (exported for deploy.ts) ---

export function zeroStats(): RunStats {
  return {
    deploys: 0,
    failedDeliveries: 0,
    deliveries: 0,
    cleanDeploys: 0,
    glitchesCleared: 0,
    glitchesExpired: 0,
    maxCascade: 0,
    coffeeUsed: 0,
    aiApologized: false,
    bestLttcMs: 0,
    lttcSumMs: 0,
    lttcCount: 0,
    recoveryBestMs: 0,
    lastMeltdownClock: 0,
    locShipped: 0,
    blastFreezeUsed: false,
  };
}

export function appendLog(state: GameState, text: string): GameState {
  return {
    ...state,
    logs: [...state.logs, { id: state.nextId, text }],
    nextId: state.nextId + 1,
  };
}

export function appendChat(
  state: GameState,
  template: Omit<ChatMessage, 'id' | 'timestamp'>,
  now: string,
): GameState {
  const message: ChatMessage = { ...template, id: `chat-${state.nextId}`, timestamp: now };
  return {
    ...state,
    chatMessages: [...state.chatMessages, message],
    nextId: state.nextId + 1,
  };
}

export function withStress(state: GameState, delta: number): GameState {
  return { ...state, stress: Math.min(100, Math.max(0, state.stress + delta)) };
}

// --- Run lifecycle ---

export interface RunOptions {
  /** Career tier for this run (gates tokens/tickets, coffee bonus). */
  tier?: Tier;
}

export function createRun(content: GameContentProfile, seed?: string, options: RunOptions = {}): GameState {
  const runSeed = seed ?? RngEngine.generateSeed();
  RngEngine.seedWith(runSeed);
  const tier = options.tier ?? 'junior';
  return {
    seed: runSeed,
    tier,
    phase: 'idle',
    stress: TUNING.baseStress,
    coffee: coffeeForTier(tier),
    loc: TUNING.baseLoc,
    ticket: null,
    timeRemaining: 0,
    stagedTokens: [],
    compileQueue: [],
    logs: [],
    chatMessages: content.teamsMessages,
    lastResult: null,
    ticketsResolved: 0,
    ticketsFailed: 0,
    cash: 0,
    hype: 0,
    deploy: null,
    runClockMs: 0,
    ticketStartClock: 0,
    stats: zeroStats(),
    nextId: 1,
  };
}

export function startTicket(state: GameState, content: GameContentProfile): GameState {
  if (state.phase !== 'idle' && state.phase !== 'result') return state;

  const pool = content.tickets.filter(t => ticketUnlocked(t, state.tier));
  const ticket = pool[Math.floor(RngEngine.random() * pool.length)];
  let next: GameState = {
    ...state,
    phase: 'ticket',
    ticket,
    timeRemaining: ticketTimeFor(ticket.storyPoints),
    stagedTokens: [],
    compileQueue: [],
    logs: [],
    lastResult: null,
    deploy: null,
    ticketStartClock: state.runClockMs,
  };
  next = appendLog(next, `TICKET INBOUND: ${ticket.id} — ${ticket.title}`);
  return next;
}

export function nextTicket(state: GameState, content: GameContentProfile): GameState {
  if (state.phase !== 'result') return state;
  return startTicket({ ...state, phase: 'idle' }, content);
}

/** Voluntary end of the run (pause → "END DAY"). Stats are kept. */
export function endRun(state: GameState): GameState {
  if (state.phase === 'game-over' || state.phase === 'idle') return state;
  return { ...state, phase: 'game-over' };
}

// --- Player actions ---

export function selectToken(
  state: GameState,
  text: string,
  category: TokenCategory,
  content: GameContentProfile,
): GameState {
  if (state.phase !== 'ticket') return state;
  const allTokens = (Object.values(content.tokens)).flat();
  const def = allTokens.find(t => t.text === text);
  if (def && !tokenUnlocked(def, state.tier)) return state;
  const staged: StagedToken = { text, category };
  let next: GameState = { ...state, stagedTokens: [...state.stagedTokens, staged] };
  next = appendLog(next, `Token staged [${category}]: ${text}`);
  return next;
}

export function removeToken(state: GameState, index: number): GameState {
  if (state.phase !== 'ticket') return state;
  return {
    ...state,
    stagedTokens: state.stagedTokens.filter((_, i) => i !== index),
  };
}

/**
 * One button, two jobs: during the ticket phase it's a coffee break
 * (stress relief); during deploy it's the PANIC button (clears every
 * active glitch, no payout).
 */
export function chugCoffee(state: GameState): GameState {
  if (state.coffee <= 0) return state;
  if (state.phase === 'deploying') return coffeeBlast(state);
  if (state.phase !== 'ticket') return state;
  let next = withStress(
    { ...state, coffee: state.coffee - 1 },
    -TUNING.coffeeStressRelief,
  );
  next = { ...next, stats: { ...next.stats, coffeeUsed: next.stats.coffeeUsed + 1 } };
  return next;
}

// --- Compile pipeline ---

function buildCompileQueue(state: GameState, content: GameContentProfile): string[] {
  const { matched, total } = promptQuality(state, content);
  const queue = [
    '> SYSTEM: AI is spinning up local environment...',
    '> npm WARN: 412 vulnerabilities detected',
    `> Loading context from ${state.stagedTokens.length} tokens...`,
    `> Matching prompt to ticket… ${matched}/${total} requirements found`,
    '> Generating code...',
    '> Compiling...',
  ];
  if (RngEngine.random() < TUNING.aiApologyChance) {
    queue.push('> AI: I apologize for the inconvenience.');
  }
  return queue;
}

export function startCompile(state: GameState, content: GameContentProfile): GameState {
  if (state.phase !== 'ticket' || state.stagedTokens.length === 0) return state;
  const queue = buildCompileQueue(state, content);
  const aiApologized = queue.some(line => line.includes('I apologize'));
  return {
    ...state,
    phase: 'compiling',
    compileQueue: queue,
    stats: aiApologized ? { ...state.stats, aiApologized: true } : state.stats,
  };
}

/** Reveals the next queued compile line. When the queue empties, the deploy begins. */
export function advanceCompile(
  state: GameState,
  content: GameContentProfile,
  now: () => string,
): GameState {
  if (state.phase !== 'compiling') return state;

  if (state.compileQueue.length > 0) {
    const [line, ...rest] = state.compileQueue;
    let next = appendLog(state, line);
    next = { ...next, compileQueue: rest, runClockMs: next.runClockMs + TUNING.compileTickMs };
    return next;
  }

  return startDeploy(state, content);
}

// --- Tick (ticket countdown) ---

export function tick(state: GameState, content: GameContentProfile, now: () => string): GameState {
  if (state.phase !== 'ticket') return state;

  const clocked: GameState = { ...state, runClockMs: state.runClockMs + TUNING.ticketTickMs };
  const remaining = state.timeRemaining - 1;
  if (remaining > 0) {
    return { ...clocked, timeRemaining: remaining };
  }

  // Deadline exceeded — the change never shipped, so no LTTC is recorded.
  const deadlineMs = ticketTimeFor(state.ticket?.storyPoints ?? 0) * TUNING.ticketTickMs;
  let next: GameState = {
    ...clocked,
    timeRemaining: 0,
    phase: 'result',
    lastResult: {
      outcome: 'timeout',
      cashEarned: 0,
      hypeEarned: 0,
      lttcMs: deadlineMs,
      glitchesCleared: 0,
      glitchesExpired: 0,
      maxCascade: 0,
    },
    ticketsFailed: state.ticketsFailed + 1,
    stats: {
      ...state.stats,
      deliveries: state.stats.deliveries + 1,
      failedDeliveries: state.stats.failedDeliveries + 1,
    },
  };
  next = withStress(next, TUNING.timeoutStress);
  next = appendLog(next, 'CRITICAL: Ticket deadline exceeded. Management is displeased.');
  next = appendLog(next, "PAGERDUTY: Escalation triggered. You've been paged.");
  next = appendChat(next, content.chatReactions.ticketOverdue, now());
  if (next.stress >= 100) {
    next = { ...next, phase: 'game-over' };
  }
  return next;
}
