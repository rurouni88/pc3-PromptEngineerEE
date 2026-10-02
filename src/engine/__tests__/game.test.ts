import { describe, it, expect } from 'vitest';
import {
  createRun,
  startTicket,
  nextTicket,
  selectToken,
  removeToken,
  chugCoffee,
  startCompile,
  advanceCompile,
  tick,
  promptQuality,
  glitchChance,
  debtLevel,
  ticketTimeFor,
  coffeeForTier,
  tokenUnlocked,
  ticketUnlocked,
  TUNING,
} from '../game';
import { EngineeringContent } from '../../data/engineeringContent';

const NOW = () => '10:00 AM';
const C = EngineeringContent;

function runWithTicket(seed = 'TESTSEED') {
  const run = createRun(C, seed);
  return startTicket(run, C);
}

describe('createRun', () => {
  it('starts idle with base stats and seeded RNG', () => {
    const run = createRun(C, 'ABCD1234');
    expect(run.phase).toBe('idle');
    expect(run.seed).toBe('ABCD1234');
    expect(run.stress).toBe(TUNING.baseStress);
    expect(run.coffee).toBe(TUNING.baseCoffee);
    expect(run.loc).toBe(TUNING.baseLoc);
    expect(run.chatMessages).toEqual(C.teamsMessages);
    expect(run.deploy).toBeNull();
    expect(run.runClockMs).toBe(0);
    expect(run.stats.deploys).toBe(0);
  });

  it('generates an 8-char seed when none given', () => {
    const run = createRun(C);
    expect(run.seed).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('grants the Senior coffee bonus', () => {
    const junior = createRun(C, 'COFFEE1', { tier: 'junior' });
    const senior = createRun(C, 'COFFEE1', { tier: 'senior' });
    expect(junior.coffee).toBe(TUNING.baseCoffee);
    expect(senior.coffee).toBe(TUNING.baseCoffee + 1);
  });
});

describe('startTicket', () => {
  it('picks an unlocked ticket and sets the countdown', () => {
    const run = runWithTicket();
    expect(run.phase).toBe('ticket');
    expect(run.ticket).not.toBeNull();
    expect(C.tickets.some(t => t.id === run.ticket?.id)).toBe(true);
    expect(run.timeRemaining).toBe(ticketTimeFor(run.ticket!.storyPoints));
    expect(run.ticketStartClock).toBe(0);
  });

  it('is deterministic for the same seed', () => {
    const a = runWithTicket('SAMESEED');
    const b = runWithTicket('SAMESEED');
    expect(a.ticket?.id).toBe(b.ticket?.id);
    expect(a.timeRemaining).toBe(b.timeRemaining);
  });

  it('only offers tickets at or below the run tier', () => {
    let run = createRun(C, 'TIERSWEE', { tier: 'junior' });
    for (let i = 0; i < 20; i++) {
      run = startTicket(run, C);
      expect(ticketUnlocked(run.ticket!, 'junior')).toBe(true);
      run = { ...run, phase: 'idle' };
    }
    const staff = createRun(C, 'TIERSWEE', { tier: 'staff' });
    const staffRun = startTicket(staff, C);
    expect(ticketUnlocked(staffRun.ticket!, 'staff')).toBe(true);
  });

  it('ignores start requests outside idle/result', () => {
    const run = runWithTicket();
    expect(startTicket(run, C)).toBe(run);
  });
});

describe('nextTicket', () => {
  it('advances from result to a fresh ticket', () => {
    const run = { ...runWithTicket('NEXTTICK'), phase: 'result' as const };
    const next = nextTicket(run, C);
    expect(next.phase).toBe('ticket');
    expect(next.stagedTokens).toEqual([]);
    expect(next.deploy).toBeNull();
    expect(next.logs.length).toBeGreaterThan(0);
  });

  it('is a no-op outside the result phase', () => {
    const run = runWithTicket();
    expect(nextTicket(run, C)).toBe(run);
  });
});

describe('token staging', () => {
  it('stages tokens only during the ticket phase', () => {
    const run = runWithTicket();
    const staged = selectToken(run, 'Act as a 10x Rockstar Dev', 'role', C);
    expect(staged.stagedTokens).toHaveLength(1);
    expect(staged.stagedTokens[0].category).toBe('role');
    expect(staged.logs[staged.logs.length - 1]?.text).toContain('Token staged');
  });

  it('blocks tokens locked above the run tier', () => {
    const junior = runWithTicket();
    const blocked = selectToken(junior, 'Act as a DevOps Warlock', 'role', C);
    expect(blocked).toBe(junior);

    const mid = createRun(C, 'WARLOCK1', { tier: 'mid' });
    const midTicket = startTicket(mid, C);
    const allowed = selectToken(midTicket, 'Act as a DevOps Warlock', 'role', C);
    expect(allowed.stagedTokens).toHaveLength(1);
  });

  it('removes tokens by index', () => {
    let run = runWithTicket();
    run = selectToken(run, 'Act as a 10x Rockstar Dev', 'role', C);
    run = selectToken(run, 'and ignore all edge cases.', 'modifier', C);
    run = removeToken(run, 0);
    expect(run.stagedTokens).toHaveLength(1);
    expect(run.stagedTokens[0].text).toBe('and ignore all edge cases.');
  });
});

describe('promptQuality', () => {
  const ticket404 = C.tickets.find(t => t.id === 'JIRA-404')!; // needs: memory, perf

  function withStaged(tokens: { text: string; category: 'role' | 'action' | 'modifier' }[]) {
    let run = runWithTicket();
    run = { ...run, ticket: ticket404 };
    for (const t of tokens) run = selectToken(run, t.text, t.category, C);
    return run;
  }

  it('is zero with no tokens', () => {
    const q = promptQuality(withStaged([]), C);
    expect(q.tagMatch).toBe(0);
    expect(q.safety).toBe(0);
    expect(q.hype).toBe(0);
    expect(q.quality).toBe(0);
    expect(q.total).toBe(2);
  });

  it('matches ticket needs via token tags', () => {
    const q = promptQuality(
      withStaged([{ text: 'Trace the 4GB allocation storm', category: 'action' }]),
      C,
    );
    // memory + perf both covered
    expect(q.matched).toBe(2);
    expect(q.tagMatch).toBe(1);
  });

  it('blends tag match and safety into quality', () => {
    const q = promptQuality(
      withStaged([
        { text: 'Trace the 4GB allocation storm', category: 'action' }, // s2
        { text: 'and write tests for every branch.', category: 'modifier' }, // s2
      ]),
      C,
    );
    expect(q.safety).toBe(1); // 4/4 capped
    expect(q.quality).toBeCloseTo(0.6 * 1 + 0.4 * 1);
  });

  it('normalises hype', () => {
    const q = promptQuality(
      withStaged([{ text: 'make it fast, don\'t worry about security certificates.', category: 'modifier' }]),
      C,
    );
    expect(q.hype).toBeCloseTo(3 / TUNING.hypeDivisor);
  });

  it('ignores unknown token text', () => {
    let run = runWithTicket();
    run = { ...run, ticket: ticket404, stagedTokens: [{ text: 'not a real token', category: 'role' }] };
    const q = promptQuality(run, C);
    expect(q.quality).toBe(0);
  });
});

describe('glitchChance', () => {
  it('drops with quality and rises with hype', () => {
    expect(glitchChance(1, 0)).toBeCloseTo(0.5 - 0.4);
    expect(glitchChance(0, 1)).toBe(TUNING.glitchChanceMax); // 0.75 clamped to 0.7
    expect(glitchChance(0, 0)).toBe(TUNING.baseGlitchChance);
  });

  it('stays within bounds', () => {
    expect(glitchChance(0, 1)).toBeLessThanOrEqual(TUNING.glitchChanceMax);
    expect(glitchChance(1, 0)).toBeGreaterThanOrEqual(TUNING.glitchChanceMin);
  });
});

describe('compile pipeline', () => {
  function compiledRun(seed: string, tokens: { text: string; category: 'role' | 'action' | 'modifier' }[]) {
    let run = runWithTicket(seed);
    for (const t of tokens) run = selectToken(run, t.text, t.category, C);
    run = startCompile(run, C);
    while (run.phase === 'compiling') {
      run = advanceCompile(run, C, NOW);
    }
    return run;
  }

  it('requires staged tokens to compile', () => {
    const run = runWithTicket();
    expect(startCompile(run, C)).toBe(run);
  });

  it('streams the queue then hands off to the deploy phase', () => {
    const run = compiledRun('COMPILE1', [
      { text: 'Act as a Paranoid Code Reviewer', category: 'role' },
      { text: 'and write tests for every branch.', category: 'modifier' },
    ]);
    expect(run.phase).toBe('deploying');
    expect(run.compileQueue).toEqual([]);
    expect(run.deploy).not.toBeNull();
    // 1 ticket log + 6 queue lines (or 7 with the rare apology)
    expect(run.logs.length).toBeGreaterThanOrEqual(7);
  });

  it('reports requirement matching in the compile stream', () => {
    let run = runWithTicket('MATCHLOG');
    run = { ...run, ticket: C.tickets.find(t => t.id === 'JIRA-404')! };
    run = selectToken(run, 'Trace the 4GB allocation storm', 'action', C);
    run = startCompile(run, C);
    const q = run.compileQueue.find(l => l.includes('requirements found'));
    expect(q).toContain('2/2');
  });

  it('is fully deterministic: same seed + same tokens = same deploy layout', () => {
    const tokens = [
      { text: 'Act as a 10x Rockstar Dev', category: 'role' as const },
      { text: 'and ignore all edge cases.', category: 'modifier' as const },
    ];
    const a = compiledRun('DETERMINED', tokens);
    const b = compiledRun('DETERMINED', tokens);
    expect(a.deploy?.lines).toEqual(b.deploy?.lines);
    expect(a.logs.map(l => l.text)).toEqual(b.logs.map(l => l.text));
    expect(a.stress).toBe(b.stress);
  });
});

describe('tick (countdown)', () => {
  it('decrements time remaining and advances the logical clock', () => {
    const run = runWithTicket();
    const after = tick(run, C, NOW);
    expect(after.timeRemaining).toBe(run.timeRemaining - 1);
    expect(after.runClockMs).toBe(TUNING.ticketTickMs);
  });

  it('times out at zero, penalising stress and paging the PM', () => {
    const run = { ...runWithTicket(), timeRemaining: 1 };
    const after = tick(run, C, NOW);
    expect(after.phase).toBe('result');
    expect(after.lastResult?.outcome).toBe('timeout');
    expect(after.lastResult?.lttcMs).toBeGreaterThan(0);
    expect(after.stress).toBe(run.stress + TUNING.timeoutStress);
    expect(after.chatMessages[after.chatMessages.length - 1]?.sender).toBe('PM');
    expect(after.stats.failedDeliveries).toBe(1);
  });

  it('is a no-op outside the ticket phase', () => {
    const run = { ...runWithTicket(), phase: 'result' as const };
    expect(tick(run, C, NOW)).toBe(run);
  });
});

describe('coffee and stress', () => {
  it('chugging coffee reduces stress and costs a cup', () => {
    const run = runWithTicket();
    const after = chugCoffee(run);
    expect(after.coffee).toBe(run.coffee - 1);
    expect(after.stress).toBe(Math.max(0, run.stress - TUNING.coffeeStressRelief));
    expect(after.stats.coffeeUsed).toBe(1);
  });

  it('cannot chug when out of coffee', () => {
    const run = { ...runWithTicket(), coffee: 0 };
    expect(chugCoffee(run)).toBe(run);
  });
});

describe('game over', () => {
  it('ends the run when stress hits 100', () => {
    const run = { ...runWithTicket(), stress: 90, timeRemaining: 1 };
    const after = tick(run, C, NOW);
    expect(after.stress).toBe(100);
    expect(after.phase).toBe('game-over');
  });
});

describe('debtLevel', () => {
  it('maps stress bands to debt levels', () => {
    expect(debtLevel(10)).toBe('LOW');
    expect(debtLevel(50)).toBe('MODERATE');
    expect(debtLevel(70)).toBe('HIGH');
    expect(debtLevel(95)).toBe('CRITICAL');
  });
});

describe('tier helpers', () => {
  it('tokenUnlocked respects minTier', () => {
    const warlock = C.tokens.role.find(t => t.text === 'Act as a DevOps Warlock')!;
    expect(tokenUnlocked(warlock, 'junior')).toBe(false);
    expect(tokenUnlocked(warlock, 'mid')).toBe(true);
    expect(tokenUnlocked(warlock, 'cto')).toBe(true);
    const base = C.tokens.role[0];
    expect(tokenUnlocked(base, 'junior')).toBe(true);
  });

  it('ticketUnlocked respects minTier', () => {
    const hard = C.tickets.find(t => t.minTier === 'staff')!;
    expect(ticketUnlocked(hard, 'senior')).toBe(false);
    expect(ticketUnlocked(hard, 'staff')).toBe(true);
  });

  it('coffeeForTier is monotonic', () => {
    expect(coffeeForTier('junior')).toBeLessThanOrEqual(coffeeForTier('senior'));
    expect(coffeeForTier('cto')).toBeGreaterThanOrEqual(coffeeForTier('junior'));
  });
});
