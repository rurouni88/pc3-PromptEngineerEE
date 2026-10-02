// src/components/PauseOverlay.tsx
interface PauseOverlayProps {
  onResume: () => void;
  onEndRun: () => void;
  onRestart: () => void;
}

export function PauseOverlay({ onResume, onEndRun, onRestart }: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="bg-secondary border border-theme rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-4xl mb-4" aria-hidden>
          ⏸️
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">PAUSED</h2>
        <p className="text-sm text-secondary mb-6">The work never stops... but you can.</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full h-12 bg-emerald-600 active:bg-emerald-500 rounded-xl font-bold text-white transition-colors"
          >
            RESUME WORK
          </button>
          <button
            onClick={onEndRun}
            className="w-full h-12 bg-primary active:bg-tertiary rounded-xl font-bold text-secondary transition-colors"
          >
            END DAY (CASH OUT)
          </button>
          <button
            onClick={onRestart}
            className="w-full h-12 bg-primary active:bg-tertiary rounded-xl font-bold text-muted transition-colors"
          >
            RESTART DAY
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-theme">
          <p className="text-[10px] text-muted">
            Copyright 2026 PC3 Enterprises. This document is not a strategy.
          </p>
        </div>
      </div>
    </div>
  );
}
