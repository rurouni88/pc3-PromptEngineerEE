// src/components/SettingsModal.tsx
// Settings — font size, resets, credits. No sound/haptics/theme yet:
// those engines don't exist in this game (deferred by design).

import { useState } from 'react';
import {
  loadFontScale,
  saveFontScale,
  applyFontScale,
  FONT_MIN,
  FONT_MAX,
} from '../engine/font-scale';
import { loadAchievements, saveAchievements, resetMetaStore } from '../engine/meta';

interface SettingsModalProps {
  onClose: () => void;
  /** Called after any reset so the app reloads its in-memory meta. */
  onMetaReset: () => void;
}

export function SettingsModal({ onClose, onMetaReset }: SettingsModalProps) {
  const [fontScale, setFontScale] = useState(loadFontScale);
  const achievementCount = loadAchievements().length;

  const handleFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseInt(e.target.value, 10);
    const clamped = saveFontScale(pct);
    setFontScale(clamped);
    applyFontScale(clamped);
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs max-h-full overflow-y-auto bg-secondary rounded-2xl border border-theme p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -m-3 text-muted active:text-primary transition-colors active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Font size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">🔤 Font Size</p>
              <p className="text-xs font-mono text-muted">{fontScale}%</p>
            </div>
            <input
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={5}
              value={fontScale}
              onChange={handleFontChange}
              aria-label="Font size percentage"
              className="w-full h-2 bg-tertiary rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[10px] text-muted italic">
              For when the incident report is too small to read.
            </p>
          </div>

          <div className="border-t border-theme" />

          <ResetSection
            label="Reset Achievements"
            detail={
              achievementCount > 0
                ? `${achievementCount} unlocked. Start fresh?`
                : 'Nothing to reset.'
            }
            disabled={achievementCount === 0}
            confirmText="Reset all achievements? This cannot be undone."
            onConfirm={() => {
              saveAchievements([]);
              onMetaReset();
            }}
          />

          <div className="border-t border-theme" />

          <ResetSection
            label="Reset Career"
            detail="Wipe the ladder, the cash, the DORA history."
            confirmText="Reset your whole career? The PIP survives."
            onConfirm={() => {
              resetMetaStore();
              saveAchievements([]);
              onMetaReset();
            }}
          />

          <div className="border-t border-theme" />

          {/* Credits */}
          <div className="text-center">
            <p className="text-xs text-muted">Copyright 2026 PC3 Enterprises</p>
            <p className="text-[0.65rem] text-muted mt-1">v0.3.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetSection({
  label,
  detail,
  confirmText,
  onConfirm,
  disabled = false,
}: {
  label: string;
  detail: string;
  confirmText: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-red-400 font-medium">{confirmText}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onConfirm();
              setConfirming(false);
            }}
            className="flex-1 h-11 bg-red-600/80 active:bg-red-500 text-primary text-xs font-bold rounded-lg transition-transform active:scale-95"
          >
            Yes, reset
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 h-11 bg-tertiary text-primary text-xs font-medium rounded-lg transition-transform active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      <button
        onClick={() => setConfirming(true)}
        disabled={disabled}
        className="h-11 px-3 text-xs font-medium text-red-400 border border-red-400/40 rounded-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Reset
      </button>
    </div>
  );
}
