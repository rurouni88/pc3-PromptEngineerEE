// src/components/DeployPanicBar.tsx
// Bottom thumb-zone bar shown during the deploy phase. One big button:
// spend a coffee to clear every live glitch (no payout). Tech Lead and
// above also freeze cascades for a few ticks — once per run.

interface DeployPanicBarProps {
  coffee: number;
  corruption: number;
  blastFreezeTicks: number;
  hasBlastPerk: boolean;
  blastFreezeUsed: boolean;
  onPanic: () => void;
}

export function DeployPanicBar({
  coffee,
  corruption,
  blastFreezeTicks,
  hasBlastPerk,
  blastFreezeUsed,
  onPanic,
}: DeployPanicBarProps) {
  const danger = corruption >= 70;

  return (
    <section className="shrink-0 bg-primary border-t border-theme p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center shrink-0">
          <span aria-hidden>☕</span>
          <span className="text-sm font-bold text-primary">{coffee}</span>
        </div>
        <button
          onClick={onPanic}
          disabled={coffee === 0}
          className={`flex-1 h-14 rounded-xl font-bold text-lg transition-all ${
            coffee === 0
              ? 'bg-secondary text-muted'
              : danger
                ? 'bg-red-600 text-white animate-panic-pulse active:scale-95'
                : 'bg-red-700/80 text-white active:scale-95'
          }`}
        >
          ☕ PANIC — CLEAR ALL
        </button>
        <div className="w-14 shrink-0 text-center">
          {hasBlastPerk ? (
            blastFreezeTicks > 0 ? (
              <>
                <div className="text-cyan-300 text-xs font-bold">❄️ {blastFreezeTicks}</div>
                <div className="text-[8px] text-muted">FREEZE</div>
              </>
            ) : blastFreezeUsed ? (
              <>
                <div className="text-muted text-xs">❄️—</div>
                <div className="text-[8px] text-muted">SPENT</div>
              </>
            ) : (
              <>
                <div className="text-cyan-400 text-xs font-bold">❄️</div>
                <div className="text-[8px] text-muted">READY</div>
              </>
            )
          ) : (
            <div className="text-[8px] text-muted leading-tight">TECH LEAD<br />PERK</div>
          )}
        </div>
      </div>
    </section>
  );
}
