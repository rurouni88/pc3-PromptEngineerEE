// src/types/content.ts
// Content profile: all game data injected here. Swapping profiles swaps the game.

/** Requirement vocabulary. Small on purpose — readable at a glance on mobile. */
export type Tag =
  | 'memory'
  | 'legacy'
  | 'perf'
  | 'ui'
  | 'security'
  | 'tests'
  | 'web3'
  | 'speed'
  | 'hack';

/** Career ladder tiers. Content may gate itself behind a tier (minTier). */
export type Tier =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'tech-lead'
  | 'architect'
  | 'cto';

export type TokenCategory = 'role' | 'action' | 'modifier';

export interface TokenDefinition {
  text: string;
  /** Ticket requirement tags this token satisfies. */
  tags: Tag[];
  /** Quality points: safer prompts spawn fewer glitches (capped in the engine). */
  safety: number;
  /** Chaos points: more glitches, but glitch payouts scale with hype. */
  hype: number;
  /** Career tier required to use this token. Absent = available from Junior. */
  minTier?: Tier;
}

export interface SatiricalTicket {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  /** Requirement tags — matching them raises prompt quality. */
  needs: Tag[];
  reward: {
    hype: number;
    cash: number;
  };
  /** Career tier required to receive this ticket. Absent = Junior. */
  minTier?: Tier;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  timestamp: string;
}

export interface GameContentProfile {
  modeName: string;
  currencyUnit: string;
  stressFactors: {
    lowName: string;
    highName: string;
  };
  tokens: Record<TokenCategory, TokenDefinition[]>;
  tickets: SatiricalTicket[];
  errorLogs: string[];
  /** Fake deploy stream lines — the backdrop the glitches erupt from. */
  deployLines: string[];
  /** Base chat history shown in the Teams panel at run start. */
  teamsMessages: ChatMessage[];
  /** Chat messages appended by the engine on specific events. */
  chatReactions: {
    deployClean: Omit<ChatMessage, 'id' | 'timestamp'>;
    deployFailed: Omit<ChatMessage, 'id' | 'timestamp'>;
    ticketOverdue: Omit<ChatMessage, 'id' | 'timestamp'>;
  };
}
