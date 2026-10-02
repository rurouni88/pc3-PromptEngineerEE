// src/hooks/useGameEngine.ts
// Thin bridge between the pure engine and React. Owns the state and the
// game interval. Every engine step runs OUTSIDE setState updaters (via
// stateRef) so seeded RNG advances exactly once per tick — StrictMode-safe.
// Run-end recording happens here (interval callback / action), never in a
// useEffect, so it fires exactly once.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameContentProfile, Tier, TokenCategory } from '../types/content';
import type { GameState } from '../types/game';
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
  endRun,
} from '../engine/game';
import { tickDeploy, tapGlitch, coffeeBlast } from '../engine/deploy';
import { RngEngine } from '../engine/seeded-rng';

const TICK_MS = 1000;
const COMPILE_MS = 600;
const DEPLOY_MS = 500;

function nowStamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface GameEngineOptions {
  /** Starting career tier (from the meta store's highest unlocked tier). */
  tier?: Tier;
  /** Called once when a run ends (stress-out or voluntary END DAY). */
  onRunEnd?: (run: GameState) => void;
}

export function useGameEngine(content: GameContentProfile, options: GameEngineOptions = {}) {
  const tier = options.tier ?? 'junior';
  const onRunEnd = options.onRunEnd;
  const onRunEndRef = useRef(onRunEnd);
  onRunEndRef.current = onRunEnd;

  const [state, setState] = useState<GameState>(() => createRun(content, undefined, { tier }));
  const [isPaused, setIsPaused] = useState(false);

  // Latest state for interval steps (avoids stale closures, keeps engine
  // calls out of setState updaters).
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Apply an engine step; reports run-end transitions exactly once.
   * stateRef is updated immediately so rapid successive taps (boss 3-tap)
   * chain correctly even before React commits the render.
   */
  const step = useCallback((nextFn: (s: GameState) => GameState) => {
    const current = stateRef.current;
    const next = nextFn(current);
    stateRef.current = next;
    if (next.phase === 'game-over' && current.phase !== 'game-over') {
      onRunEndRef.current?.(next);
    }
    setState(next);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (
      state.phase !== 'ticket' &&
      state.phase !== 'compiling' &&
      state.phase !== 'deploying'
    ) {
      return;
    }

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.phase === 'ticket') step(t => tick(t, content, nowStamp));
      else if (s.phase === 'compiling') step(t => advanceCompile(t, content, nowStamp));
      else if (s.phase === 'deploying') step(t => tickDeploy(t, content, nowStamp));
    }, state.phase === 'ticket' ? TICK_MS : state.phase === 'compiling' ? COMPILE_MS : DEPLOY_MS);

    return () => clearInterval(interval);
  }, [state.phase, isPaused, content, step]);

  const actions = useMemo(
    () => ({
      startRun: (runTier: Tier = tier) => {
        const seed = RngEngine.generateSeed();
        setState(startTicket(createRun(content, seed, { tier: runTier }), content));
      },
      nextTicket: () => step(s => nextTicket(s, content)),
      selectToken: (text: string, category: TokenCategory) =>
        step(s => selectToken(s, text, category, content)),
      removeToken: (index: number) => step(s => removeToken(s, index)),
      chugCoffee: () => step(s => chugCoffee(s)),
      pushToProd: () => step(s => startCompile(s, content)),
      tapGlitch: (id: number) => step(s => tapGlitch(s, id)),
      coffeeBlast: () => step(s => coffeeBlast(s)),
      endRun: () => step(s => endRun(s)),
      toLobby: () => {
        setIsPaused(false);
        setState(createRun(content, undefined, { tier }));
      },
    }),
    [content, step, tier],
  );

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const restart = useCallback(() => {
    setIsPaused(false);
    actions.startRun();
  }, [actions]);

  return { state, isPaused, pause, resume, restart, ...actions };
}
