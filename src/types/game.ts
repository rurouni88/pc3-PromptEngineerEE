// src/types/game.ts
import type { TokenCategory, SatiricalTicket, ChatMessage, Tier } from './content';

export type GamePhase = 'idle' | 'ticket' | 'compiling' | 'deploying' | 'result' | 'game-over';

export type DebtLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type Outcome = 'clean' | 'rough' | 'shaky' | 'fail' | 'timeout';

export interface StagedToken {
  text: string;
  category: TokenCategory;
}

export interface TerminalLog {
  id: number;
  text: string;
}

/** One line of the deploy stream. `glitched` lines erupt when revealed. */
export interface DeployLine {
  id: number;
  text: string;
  glitched: boolean;
  boss: boolean;
}

/** A live glitch on a deploy line. Tap it before the fuse runs out. */
export interface Glitch {
  id: number;
  lineIndex: number;
  tapsNeeded: number;
  boss: boolean;
  /** Ticks left on the fuse. 0 = it melted. */
  fuse: number;
  /** 0 = native glitch, >0 = cascade child. */
  cascadeDepth: number;
  state: 'active' | 'cleared' | 'expired';
}

export interface DeployState {
  lines: DeployLine[];
  /** How many lines have streamed in so far. */
  revealed: number;
  glitches: Glitch[];
  /** 0-100. 100 = production meltdown. */
  corruption: number;
  cleared: number;
  expired: number;
  maxCascade: number;
  /** Glitch-hotfix payouts accumulated this deploy. */
  extraCash: number;
  /** Hype level at deploy start — scales glitch payouts (risk pays). */
  hypeLevel: number;
  /** Ticks of cascade freeze left (Tech Lead perk). */
  blastFreezeTicks: number;
  done: boolean;
}

/** Per-run action counters — feed achievements and the DORA dashboard. */
export interface RunStats {
  /** Completed deploy phases (any outcome). */
  deploys: number;
  /** Ticket deliveries that produced nothing: meltdown + timeout. */
  failedDeliveries: number;
  /** All ticket deliveries: deploys + timeouts. */
  deliveries: number;
  cleanDeploys: number;
  glitchesCleared: number;
  glitchesExpired: number;
  maxCascade: number;
  coffeeUsed: number;
  aiApologized: boolean;
  /** Fastest change shipped (ms). 0 = none yet. */
  bestLttcMs: number;
  lttcSumMs: number;
  /** Shipped changes only (clean/rough/shaky). */
  lttcCount: number;
  /** Fastest meltdown → next successful deploy (ms). 0 = none yet. */
  recoveryBestMs: number;
  /** Clock of the last meltdown. 0 = none pending. */
  lastMeltdownClock: number;
  /** LOC shipped this run (not the starting base). */
  locShipped: number;
  /** Tech Lead perk: blast freeze already spent this run? */
  blastFreezeUsed: boolean;
}

export interface RunResult {
  outcome: Outcome;
  cashEarned: number;
  hypeEarned: number;
  /** Lead Time to Change: ticket start → deploy end (ms). */
  lttcMs: number;
  glitchesCleared: number;
  glitchesExpired: number;
  maxCascade: number;
}

export interface GameState {
  seed: string;
  phase: GamePhase;
  /** Career tier for this run — gates tokens and tickets. */
  tier: Tier;
  stress: number;
  coffee: number;
  loc: number;
  ticket: SatiricalTicket | null;
  timeRemaining: number;
  stagedTokens: StagedToken[];
  /** Compile log lines not yet revealed in the terminal. */
  compileQueue: string[];
  logs: TerminalLog[];
  chatMessages: ChatMessage[];
  lastResult: RunResult | null;
  ticketsResolved: number;
  ticketsFailed: number;
  /** Cash earned this run (feed the career ladder). */
  cash: number;
  /** Hype earned this run (vanity currency). */
  hype: number;
  /** Live deploy state (null outside the deploying phase). */
  deploy: DeployState | null;
  /**
   * Deterministic logical clock (ms). Advanced by tick duration on every
   * engine tick — never wall-clock time — so LTTC is reproducible for a
   * given seed + input sequence.
   */
  runClockMs: number;
  /** runClockMs when the current ticket started. LTTC baseline. */
  ticketStartClock: number;
  stats: RunStats;
  /** Monotonic counter for generated ids (logs, chat, glitches). */
  nextId: number;
}
