import { describe, it, expect } from 'vitest';
import {
  createRun,
  startTicket,
  nextTicket,
  selectToken,
  startCompile,
  advanceCompile,
  TUNING,
} from '../game';
import { startDeploy, tickDeploy, tapGlitch, coffeeBlast } from '../deploy';
import { EngineeringContent } from '../../data/engineeringContent';
import type { GameState } from '../../types/game';
import type { Tier } from '../../types/content';

const NOW = () => '10:00 AM';
const C = EngineeringContent;

const SAFE = [
  { text: 'Act as a Paranoid Code Reviewer', category: 'role' as const },
  { text: 'and write tests for every branch.', category: 'modifier' as const },
];
const HYPE = [
  { text: 'Act as a Cybernetic Script Kiddie', category: 'role' as const },
  { text: 'make it fast, don\'t worry about security certificates.', category: 'modifier' as const },
  { text: 'and ignore all edge cases.', category: 'modifier' as const },
];

function ticketRun(seed: string, tokens: typeof SAFE, tier?: Tier) {
  let run = createRun(C, seed, tier ? { tier } : {});
  run = startTicket(run, C);
  for (const t of tokens) run = selectToken(run, t.text, t.category, C);
  return run;
}

function toDeploying(run: GameState): GameState {
  run = startCompile(run, C);
  while (run.phase === 'compiling') run = advanceCompile(run, C, NOW);
  return run;
}

type Strategy = 'none' | 'clear-all' | 'blast';

/** Plays the deploy to completion under a fixed strategy. */
function playDeploy(run: GameState, strategy: Strategy = 'none'): GameState {
  let guard = 0;
  while (run.phase === 'deploying' && guard++ < 5000) {
    if (strategy === 'clear-all' && run.deploy) {
      for (const g of [...run.deploy.glitches]) {
        if (g.state !== 'active') continue;
        while (
          run.phase === 'deploying' &&
          run.deploy?.glitches.find(x => x.id === g.id)?.state === 'active'
        ) {
          run = tapGlitch(run, g.id);
        }
      }
    } else if (strategy === 'blast' && run.deploy?.glitches.some(g => g.state === 'active')) {
      run = coffeeBlast(run);
    }
    run = tickDeploy(run, C, NOW);
  }
  return run;
}

/** Forces a settled deploy (everything revealed, given glitch/corruption state). */
function forceSettled(
  run: GameState,
  mutate: (d: NonNullable<GameState['deploy']>) => void,
): GameState {
  const deploy = {
    ...run.deploy!,
    lines: run.deploy!.lines.map(l => ({ ...l })),
    glitches: run.deploy!.glitches.map(g => ({ ...g })),
  };
  mutate(deploy);
  deploy.revealed = deploy.lines.length;
  return { ...run, deploy };
}

describe('startDeploy', () => {
  it('sizes the stream by story points', () => {
    const run = toDeploying(ticketRun('LINESIZE', SAFE));
    expect(run.deploy?.lines.length).toBe(TUNING.linesBase + run.ticket!.storyPoints);
  });

  it('is a no-op outside the compile phase', () => {
    const run = ticketRun('NOOPSD', SAFE);
    expect(startDeploy(run, C)).toBe(run);
  });

  it('is deterministic: same seed = same glitch layout', () => {
    const a = toDeploying(ticketRun('LAYOUT', HYPE));
    const b = toDeploying(ticketRun('LAYOUT', HYPE));
    expect(a.deploy?.lines).toEqual(b.deploy?.lines);
  });

  it('spawns more (never fewer) glitches for hype prompts than safe ones', () => {
    const count = (run: GameState) => run.deploy?.lines.filter(l => l.glitched).length ?? 0;
    const safe = count(toDeploying(ticketRun('CMPSEED', SAFE)));
    const hype = count(toDeploying(ticketRun('CMPSEED', HYPE)));
    expect(hype).toBeGreaterThanOrEqual(safe);
    // This seed separates the two prompts.
    expect(hype).toBeGreaterThan(safe);
  });

  it('marks some glitches as bosses', () => {
    const run = toDeploying(ticketRun('BOSSSEED', HYPE));
    const bosses = run.deploy?.lines.filter(l => l.boss).length ?? 0;
    expect(bosses).toBeGreaterThanOrEqual(0);
    // With ~0.51 chance on 23 lines, at least one glitch is expected.
    expect(run.deploy?.lines.some(l => l.glitched)).toBe(true);
  });
});

describe('streaming', () => {
  it('reveals exactly one line per tick', () => {
    const run = toDeploying(ticketRun('STREAM', SAFE));
    expect(run.deploy?.revealed).toBe(0);
    const after = tickDeploy(run, C, NOW);
    expect(after.deploy?.revealed).toBe(1);
    const after2 = tickDeploy(after, C, NOW);
    expect(after2.deploy?.revealed).toBe(2);
  });

  it('erupts a glitch when a glitched line is revealed', () => {
    const run = toDeploying(ticketRun('ERUPT', HYPE));
    const deploy = run.deploy!;
    // Find the first glitched line and force-reveal up to it.
    const firstGlitched = deploy.lines.findIndex(l => l.glitched);
    expect(firstGlitched).toBeGreaterThanOrEqual(0);
    const forced = {
      ...run,
      deploy: { ...deploy, lines: deploy.lines.map(l => ({ ...l })), revealed: firstGlitched },
    };
    const after = tickDeploy(forced, C, NOW);
    const glitch = after.deploy?.glitches.find(g => g.lineIndex === firstGlitched);
    expect(glitch).toBeDefined();
    expect(glitch?.state).toBe('active');
    expect(glitch?.fuse).toBeLessThanOrEqual(TUNING.fuseTicks);
  });
});

describe('tapGlitch', () => {
  function withLiveGlitch(run: GameState) {
    const deploy = run.deploy!;
    const forced = {
      ...run,
      deploy: {
        ...deploy,
        lines: deploy.lines.map(l => ({ ...l })),
        glitches: [
          { id: 9001, lineIndex: 0, tapsNeeded: 1, boss: false, fuse: 3, cascadeDepth: 0, state: 'active' as const },
          ...deploy.glitches.map(g => ({ ...g })),
        ],
      },
    };
    return forced;
  }

  it('clears a normal glitch in one tap and pays out', () => {
    const run = withLiveGlitch(toDeploying(ticketRun('TAP1', SAFE)));
    const after = tapGlitch(run, 9001);
    const g = after.deploy?.glitches.find(x => x.id === 9001);
    expect(g?.state).toBe('cleared');
    expect(after.deploy?.cleared).toBe(1);
    expect(after.deploy?.extraCash).toBe(TUNING.glitchPayout);
    expect(after.stats.glitchesCleared).toBe(1);
  });

  it('needs three taps for a boss', () => {
    const run = withLiveGlitch(toDeploying(ticketRun('TAP2', SAFE)));
    const boss = { ...run, deploy: { ...run.deploy!, glitches: run.deploy!.glitches.map(g => g.id === 9001 ? { ...g, tapsNeeded: 3, boss: true } : g) } };
    const one = tapGlitch(boss, 9001);
    expect(one.deploy?.glitches.find(x => x.id === 9001)?.state).toBe('active');
    const two = tapGlitch(one, 9001);
    expect(two.deploy?.glitches.find(x => x.id === 9001)?.state).toBe('active');
    const three = tapGlitch(two, 9001);
    expect(three.deploy?.glitches.find(x => x.id === 9001)?.state).toBe('cleared');
  });

  it('is a no-op for unknown or inactive ids', () => {
    const run = withLiveGlitch(toDeploying(ticketRun('TAP3', SAFE)));
    expect(tapGlitch(run, 424242)).toBe(run);
    const cleared = tapGlitch(run, 9001);
    expect(tapGlitch(cleared, 9001)).toBe(cleared);
  });

  it('scales payout with hype', () => {
    const run = withLiveGlitch(toDeploying(ticketRun('TAPHYPE', HYPE)));
    const after = tapGlitch(run, 9001);
    const expected = Math.floor(
      TUNING.glitchPayout * (1 + TUNING.glitchHypeMult * (run.deploy?.hypeLevel ?? 0)),
    );
    expect(after.deploy?.extraCash).toBe(expected);
    expect(expected).toBeGreaterThan(TUNING.glitchPayout);
  });
});

describe('fuse expiry and cascades', () => {
  function expiringRun(depth = 0) {
    const run = toDeploying(ticketRun('EXPIRE', SAFE));
    const deploy = run.deploy!;
    return {
      ...run,
      deploy: {
        ...deploy,
        lines: deploy.lines.map(l => ({ ...l })),
        revealed: deploy.lines.length,
        glitches: [
          { id: 9002, lineIndex: 0, tapsNeeded: 1, boss: false, fuse: 1, cascadeDepth: depth, state: 'active' as const },
        ],
      },
    };
  }

  it('adds corruption and stress when a glitch melts', () => {
    const run = expiringRun();
    const after = tickDeploy(run, C, NOW);
    expect(after.deploy?.corruption).toBe(TUNING.corruptionPerExpired);
    expect(after.stress).toBe(run.stress + TUNING.stressPerExpired);
    expect(after.stats.glitchesExpired).toBe(1);
  });

  it('adds more for a boss', () => {
    const run = expiringRun();
    const boss = {
      ...run,
      deploy: {
        ...run.deploy!,
        glitches: run.deploy!.glitches.map(g => ({ ...g, boss: true, tapsNeeded: TUNING.bossTaps })),
      },
    };
    const after = tickDeploy(boss, C, NOW);
    expect(after.deploy?.corruption).toBe(TUNING.corruptionPerBossExpired);
    expect(after.stress).toBe(boss.stress + TUNING.stressPerBossExpired);
  });

  it('spawns two cascade children at depth+1 on previously clean lines', () => {
    const run = expiringRun(0);
    const preGlitched = new Set(
      run.deploy!.lines.map((l, i) => (l.glitched ? i : -1)).filter(i => i >= 0),
    );
    const after = tickDeploy(run, C, NOW);
    const children = after.deploy?.glitches.filter(g => g.id !== 9002 && g.cascadeDepth === 1) ?? [];
    expect(children).toHaveLength(2);
    expect(after.deploy?.maxCascade).toBe(1);
    for (const c of children) {
      expect(preGlitched.has(c.lineIndex)).toBe(false);
      expect(after.deploy?.glitches.filter(g => g.lineIndex === c.lineIndex)).toHaveLength(1);
    }
  });

  it('does not cascade beyond the depth cap', () => {
    const run = expiringRun(TUNING.maxCascadeDepth);
    const after = tickDeploy(run, C, NOW);
    const children = after.deploy?.glitches.filter(g => g.id !== 9002) ?? [];
    expect(children).toHaveLength(0);
  });

  it('never double-glitches a line', () => {
    const run = expiringRun(0);
    const after = tickDeploy(run, C, NOW);
    const lineHits = after.deploy?.glitches.map(g => g.lineIndex) ?? [];
    const unique = new Set(lineHits);
    expect(unique.size).toBe(lineHits.length);
  });
});

describe('outcomes', () => {
  function settled(run: GameState, expired: number, corruption: number): GameState {
    return forceSettled(run, d => {
      d.glitches = [];
      d.expired = expired;
      d.corruption = corruption;
    });
  }

  it('CLEAN: nothing expired, zero corruption', () => {
    const run = settled(toDeploying(ticketRun('OC1', SAFE)), 0, 0);
    const after = tickDeploy(run, C, NOW);
    expect(after.phase).toBe('result');
    expect(after.lastResult?.outcome).toBe('clean');
    expect(after.lastResult?.cashEarned).toBe(run.ticket!.reward.cash);
    expect(after.ticketsResolved).toBe(1);
    expect(after.chatMessages[after.chatMessages.length - 1]?.sender).toBe('SRE');
    expect(after.stress).toBe(run.stress + TUNING.stressClean);
  });

  it('ROUGH: a few expired, low corruption', () => {
    const run = settled(toDeploying(ticketRun('OC2', SAFE)), 3, 36);
    const after = tickDeploy(run, C, NOW);
    expect(after.lastResult?.outcome).toBe('rough');
    expect(after.lastResult?.cashEarned).toBe(Math.floor(run.ticket!.reward.cash * TUNING.multRough));
  });

  it('SHAKY: many expired or high corruption', () => {
    const many = settled(toDeploying(ticketRun('OC3', SAFE)), 4, 48);
    expect(tickDeploy(many, C, NOW).lastResult?.outcome).toBe('shaky');
    const highCorruption = settled(toDeploying(ticketRun('OC3', SAFE)), 1, 40);
    expect(tickDeploy(highCorruption, C, NOW).lastResult?.outcome).toBe('shaky');
  });

  it('FAIL: meltdown at 100 corruption', () => {
    const run = settled(toDeploying(ticketRun('OC4', HYPE)), 8, 100);
    const after = tickDeploy(run, C, NOW);
    expect(after.lastResult?.outcome).toBe('fail');
    expect(after.lastResult?.cashEarned).toBe(0);
    expect(after.ticketsFailed).toBe(1);
    expect(after.stress).toBe(run.stress + TUNING.stressMeltdown);
    expect(after.chatMessages[after.chatMessages.length - 1]?.sender).toBe('SRE');
  });

  it('glitch payouts ride along on shipped outcomes, vanish on meltdown', () => {
    const run = forceSettled(toDeploying(ticketRun('OC5', HYPE)), d => {
      d.glitches = [];
      d.expired = 0;
      d.corruption = 0;
      d.extraCash = 74;
    });
    const clean = tickDeploy(run, C, NOW);
    expect(clean.lastResult?.cashEarned).toBe(run.ticket!.reward.cash + 74);

    const melty = forceSettled(toDeploying(ticketRun('OC5', HYPE)), d => {
      d.glitches = [];
      d.expired = 8;
      d.corruption = 100;
      d.extraCash = 74;
    });
    expect(tickDeploy(melty, C, NOW).lastResult?.cashEarned).toBe(0);
  });
});

describe('coffeeBlast', () => {
  function withGlitches(run: GameState, count: number) {
    const deploy = run.deploy!;
    return {
      ...run,
      deploy: {
        ...deploy,
        lines: deploy.lines.map(l => ({ ...l })),
        revealed: deploy.lines.length,
        glitches: Array.from({ length: count }, (_, i) => ({
          id: 9100 + i,
          lineIndex: i,
          tapsNeeded: 1,
          boss: false,
          fuse: 2,
          cascadeDepth: 0,
          state: 'active' as const,
        })),
      },
    };
  }

  it('clears every active glitch, no payout, one coffee', () => {
    const run = withGlitches(toDeploying(ticketRun('BLAST1', HYPE)), 3);
    const after = coffeeBlast(run);
    expect(after.deploy?.glitches.every(g => g.state === 'cleared')).toBe(true);
    expect(after.deploy?.extraCash).toBe(0);
    expect(after.coffee).toBe(run.coffee - 1);
    expect(after.stats.glitchesCleared).toBe(3);
    expect(after.stats.coffeeUsed).toBe(1);
  });

  it('is a no-op without coffee', () => {
    const run = withGlitches(toDeploying(ticketRun('BLAST2', HYPE)), 2);
    const empty = { ...run, coffee: 0 };
    expect(coffeeBlast(empty)).toBe(empty);
  });

  it('Tech Lead: blast freezes cascades once per run', () => {
    const deploying = toDeploying(ticketRun('BLAST3', HYPE, 'tech-lead'));
    const frozen = withGlitches(deploying, 2);
    const after = coffeeBlast(frozen);
    expect(after.deploy?.blastFreezeTicks).toBe(TUNING.blastFreezeTicks);
    expect(after.stats.blastFreezeUsed).toBe(true);
    // Second blast: no re-freeze (simulate the freeze having partially elapsed).
    const again = withGlitches(after, 1);
    const elapsed = { ...again, deploy: { ...again.deploy!, blastFreezeTicks: 3 } };
    const second = coffeeBlast(elapsed);
    expect(second.deploy?.blastFreezeTicks).toBe(3); // not reset to 6
  });

  it('Junior: blast does not freeze cascades', () => {
    const run = withGlitches(toDeploying(ticketRun('BLAST4', HYPE)), 2);
    const after = coffeeBlast(run);
    expect(after.deploy?.blastFreezeTicks).toBe(0);
    expect(after.stats.blastFreezeUsed).toBe(false);
  });

  it('freeze suppresses cascades while it lasts', () => {
    const run = toDeploying(ticketRun('BLAST5', HYPE));
    const frozen = {
      ...run,
      deploy: {
        ...run.deploy!,
        lines: run.deploy!.lines.map(l => ({ ...l })),
        revealed: run.deploy!.lines.length,
        blastFreezeTicks: 6,
        glitches: [
          { id: 9200, lineIndex: 0, tapsNeeded: 1, boss: false, fuse: 1, cascadeDepth: 0, state: 'active' as const },
        ],
      },
    };
    const after = tickDeploy(frozen, C, NOW);
    const children = after.deploy?.glitches.filter(g => g.id !== 9200) ?? [];
    expect(children).toHaveLength(0);
    expect(after.deploy?.blastFreezeTicks).toBe(5);
  });
});

describe('LTTC and run stats', () => {
  it('records lead time to change for shipped deploys', () => {
    const run = toDeploying(ticketRun('LTTSEED', SAFE));
    const forced = forceSettled(run, d => {
      d.glitches = [];
      d.expired = 0;
      d.corruption = 0;
    });
    const after = tickDeploy(forced, C, NOW);
    expect(after.lastResult?.lttcMs).toBeGreaterThan(0);
    expect(after.stats.bestLttcMs).toBe(after.lastResult?.lttcMs);
    expect(after.stats.lttcCount).toBe(1);
    expect(after.stats.locShipped).toBeGreaterThan(0);
  });

  it('tracks recovery time from meltdown to next ship', () => {
    let run = toDeploying(ticketRun('RECOVSEED', HYPE));
    run = { ...run, deploy: { ...run.deploy!, corruption: 100 } };
    run = tickDeploy(run, C, NOW);
    expect(run.lastResult?.outcome).toBe('fail');
    expect(run.stats.lastMeltdownClock).toBeGreaterThan(0);

    run = nextTicket(run, C);
    run = selectToken(run, 'Act as a Paranoid Code Reviewer', 'role', C);
    run = toDeploying(run);
    run = tickDeploy(forceSettled(run, d => {
      d.glitches = [];
      d.expired = 0;
      d.corruption = 0;
    }), C, NOW);
    expect(run.lastResult?.outcome).toBe('clean');
    expect(run.stats.recoveryBestMs).toBeGreaterThan(0);
    expect(run.stats.lastMeltdownClock).toBe(0);
  });
});

describe('full-run determinism and failure modes', () => {
  it('same seed + same strategy = identical run', () => {
    const a = playDeploy(toDeploying(ticketRun('FULLDET', HYPE)), 'clear-all');
    const b = playDeploy(toDeploying(ticketRun('FULLDET', HYPE)), 'clear-all');
    expect(a.lastResult).toEqual(b.lastResult);
    expect(a.logs.map(l => l.text)).toEqual(b.logs.map(l => l.text));
    expect(a.stress).toBe(b.stress);
    expect(a.deploy?.lines).toEqual(b.deploy?.lines);
  });

  it('skill decides: clear-all beats doing nothing on the same seed', () => {
    const hero = playDeploy(toDeploying(ticketRun('SKILLSEED', HYPE)), 'clear-all');
    const idle = playDeploy(toDeploying(ticketRun('SKILLSEED', HYPE)), 'none');
    expect(hero.deploy!.expired).toBeLessThan(idle.deploy!.expired);
    expect(hero.lastResult!.cashEarned).toBeGreaterThanOrEqual(idle.lastResult!.cashEarned);
  });

  it('a meltdown ends the deploy immediately', () => {
    const run = toDeploying(ticketRun('MELTFAST', HYPE));
    let guard = 0;
    let after = run;
    while (after.phase === 'deploying' && after.deploy && after.deploy.corruption < 100 && guard++ < 5000) {
      after = tickDeploy(after, C, NOW);
    }
    expect(after.deploy?.corruption).toBeGreaterThanOrEqual(100);
    expect(after.phase).not.toBe('deploying');
  });

  it('game over if stress hits 100 mid-deploy', () => {
    const run = toDeploying(ticketRun('STRESSDEAD', HYPE));
    const stressed = { ...run, stress: 90 };
    let after = stressed;
    let guard = 0;
    while (after.phase === 'deploying' && guard++ < 5000) {
      after = tickDeploy(after, C, NOW);
    }
    expect(after.stress).toBe(100);
    expect(after.phase).toBe('game-over');
  });

  it('tickDeploy is a no-op outside the deploy phase', () => {
    const run = ticketRun('NOOPDEPLOY', SAFE);
    expect(tickDeploy(run, C, NOW)).toBe(run);
  });
});
