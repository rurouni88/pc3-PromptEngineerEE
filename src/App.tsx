// src/App.tsx
// Thin renderer over the engine. No game logic lives here.
// Owns the meta layer (career/achievements) and hands run-end to it.

import { useCallback, useRef, useState } from 'react';
import { EngineeringContent } from './data/engineeringContent';
import { useGameEngine } from './hooks/useGameEngine';
import { useIsDesktop } from './hooks/useIsDesktop';
import { PhoneFrame } from './components/PhoneFrame';
import {
  loadMetaStore,
  saveMetaStore,
  recordRunComplete,
  loadAchievements,
  saveAchievements,
  type MetaStore,
} from './engine/meta';
import { newlyUnlockedAchievements } from './engine/achievements';
import { promptQuality, tierRank } from './engine/game';
import type { GameState } from './types/game';
import { MetricsHeader } from './components/MetricsHeader';
import { Terminal } from './components/Terminal';
import { TicketCard } from './components/TicketCard';
import { TokenDrawer } from './components/TokenDrawer';
import { PromptStaging } from './components/PromptStaging';
import { DeployPanicBar } from './components/DeployPanicBar';
import { TeamsChat } from './components/TeamsChat';
import { PauseOverlay } from './components/PauseOverlay';
import { ResultOverlay } from './components/ResultOverlay';
import { StartScreen } from './components/StartScreen';

export default function App() {
  const content = EngineeringContent;

  // --- Meta layer (persisted; owned here, recorded on run end) ---
  const [meta, setMeta] = useState<MetaStore>(loadMetaStore);
  const [unlockedAch, setUnlockedAch] = useState<string[]>(loadAchievements);
  const [newAch, setNewAch] = useState<string[]>([]);
  const metaRef = useRef({ meta, unlockedAch });
  metaRef.current = { meta, unlockedAch };

  const handleRunEnd = useCallback((run: GameState) => {
    let store = recordRunComplete(metaRef.current.meta, run);
    const fresh = newlyUnlockedAchievements({
      lifetime: store.lifetime,
      topRuns: store.topRuns,
      tier: store.tier,
      unlocked: metaRef.current.unlockedAch,
    });
    if (fresh.length > 0) {
      if (fresh.includes('cto_of_one')) store = { ...store, tier: 'cto' };
      const updated = [...metaRef.current.unlockedAch, ...fresh];
      saveAchievements(updated);
      setUnlockedAch(updated);
    }
    setNewAch(fresh);
    saveMetaStore(store);
    setMeta(store);
  }, []);

  const {
    state,
    isPaused,
    pause,
    resume,
    restart,
    startRun,
    nextTicket,
    selectToken,
    removeToken,
    chugCoffee,
    pushToProd,
    tapGlitch,
    endRun,
    toLobby,
  } = useGameEngine(content, { tier: meta.tier, onRunEnd: handleRunEnd });

  const [isTeamsOpen, setIsTeamsOpen] = useState(false);

  // Settings can wipe persisted meta; reload the in-memory copy.
  const handleMetaReset = useCallback(() => {
    setMeta(loadMetaStore());
    setUnlockedAch(loadAchievements());
    setNewAch([]);
  }, []);

  const lttcMs = state.runClockMs - state.ticketStartClock;
  const quality =
    state.phase === 'ticket' && state.ticket ? promptQuality(state, content) : null;
  const deploying = state.phase === 'deploying' && state.deploy !== null;
  const hasBlastPerk = tierRank(state.tier) >= tierRank('tech-lead');

  const pushLabel =
    state.stagedTokens.length === 0
      ? 'SELECT TOKENS FIRST'
      : state.stress > 80
        ? 'PUSH TO PROD (PLEASE)'
        : 'PUSH TO PROD';

  const isDesktop = useIsDesktop();

  // The game shell fills whatever container it is in: the dvh wrapper on
  // mobile, the PhoneFrame's screen on desktop. Overlays are absolute so
  // they stay inside the frame.
  const game = (
    <div className="h-full w-full overflow-hidden flex flex-col bg-primary relative">
      <MetricsHeader
        stress={state.stress}
        coffee={state.coffee}
        loc={state.loc}
        cash={state.cash}
        hype={state.hype}
        tier={state.tier}
        lttcMs={state.phase === 'idle' ? 0 : lttcMs}
        corruption={deploying ? state.deploy?.corruption ?? null : null}
        content={content}
        onChug={chugCoffee}
        onPause={pause}
        onOpenTeams={() => setIsTeamsOpen(true)}
      />

      <main className="flex-1 min-h-0 flex flex-col">
        <Terminal
          logs={state.logs}
          isCompiling={state.phase === 'compiling'}
          deploy={deploying ? state.deploy : null}
          onTapGlitch={tapGlitch}
          content={content}
        />

        {deploying ? (
          <DeployPanicBar
            coffee={state.coffee}
            corruption={state.deploy?.corruption ?? 0}
            blastFreezeTicks={state.deploy?.blastFreezeTicks ?? 0}
            hasBlastPerk={hasBlastPerk}
            blastFreezeUsed={state.stats.blastFreezeUsed}
            onPanic={chugCoffee}
          />
        ) : (
          <>
            <TicketCard
              ticket={state.ticket}
              timeRemaining={state.timeRemaining}
              lttcMs={lttcMs}
              matchedTags={quality?.matchedTags ?? []}
            />
            <TokenDrawer content={content} tier={state.tier} onTokenSelect={selectToken} />
            <PromptStaging
              tokens={state.stagedTokens}
              quality={quality}
              onRemoveToken={removeToken}
              onPush={pushToProd}
              isCompiling={state.phase === 'compiling'}
              pushLabel={pushLabel}
            />
          </>
        )}
      </main>

      {/* Overlays (z-indexed, main view stays mounted underneath) */}
      {state.phase === 'result' && state.lastResult && (
        <ResultOverlay
          result={state.lastResult}
          stats={state.stats}
          seed={state.seed}
          onContinue={nextTicket}
        />
      )}

      {state.phase === 'game-over' && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/85 p-4">
          <div className="bg-secondary border border-theme rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-3" aria-hidden>
              💀
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2">RAGE QUIT</h2>
            <p className="text-xs text-secondary leading-relaxed mb-4">
              Your stress hit 100%. HR has been notified. Your resignation is already drafted —
              by the AI.
            </p>
            <div className="flex justify-center gap-4 mb-5 text-sm">
              <div>
                <div className="text-emerald-400 font-bold">{state.ticketsResolved}</div>
                <div className="text-[10px] text-muted">SHIPPED</div>
              </div>
              <div>
                <div className="text-red-400 font-bold">{state.ticketsFailed}</div>
                <div className="text-[10px] text-muted">BROKEN</div>
              </div>
              <div>
                <div className="text-emerald-400 font-bold">${state.cash.toLocaleString()}</div>
                <div className="text-[10px] text-muted">CASH</div>
              </div>
              <div>
                <div className="text-amber-400 font-bold">⭐{state.hype}</div>
                <div className="text-[10px] text-muted">HYPE</div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={toLobby}
                className="w-full h-12 bg-emerald-600 active:bg-emerald-500 rounded-xl font-bold text-white transition-colors"
              >
                CLOCK OUT
              </button>
              <button
                onClick={restart}
                className="w-full h-12 bg-primary active:bg-tertiary rounded-xl font-bold text-secondary transition-colors"
              >
                RESTART DAY
              </button>
            </div>
            <p className="mt-4 text-[9px] text-muted/70">
              Copyright 2026 PC3 Enterprises. This document is not a strategy.
            </p>
          </div>
        </div>
      )}

      {state.phase === 'idle' && (
        <StartScreen
          meta={meta}
          unlockedAchievements={unlockedAch}
          newAchievements={newAch}
          onStart={startRun}
          onMetaReset={handleMetaReset}
        />
      )}

      <TeamsChat
        isOpen={isTeamsOpen}
        onClose={() => setIsTeamsOpen(false)}
        messages={state.chatMessages}
      />

      {isPaused && (
        <PauseOverlay onResume={resume} onEndRun={endRun} onRestart={restart} />
      )}
    </div>
  );

  if (isDesktop) {
    return <PhoneFrame>{game}</PhoneFrame>;
  }

  return <div className="h-dvh w-screen overflow-hidden">{game}</div>;
}
