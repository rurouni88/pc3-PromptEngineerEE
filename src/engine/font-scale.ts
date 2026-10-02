// src/engine/font-scale.ts
// FontScaleEngine — user-adjustable font size. Owns the 'pm_font_scale' key.
//
// Works by setting the root element's font size as a percentage. All
// Tailwind text sizes and spacing are rem-based, so they scale and reflow
// automatically. Fixed px values (e.g. the phone frame) are untouched.
// Range is 100–120%: the base font is already small, so no downscaling.
//
// loadFontScale / saveFontScale are pure storage (node-testable).
// applyFontScale is the only DOM write — the UI calls it on mount and
// after every save.

const FONT_SCALE_KEY = 'pm_font_scale';

export const FONT_MIN = 100;
export const FONT_MAX = 120;
export const FONT_DEFAULT = 100;

export function clampFontScale(pct: number): number {
  if (!Number.isFinite(pct)) return FONT_DEFAULT;
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(pct)));
}

export function loadFontScale(): number {
  try {
    const raw = localStorage.getItem(FONT_SCALE_KEY);
    if (raw !== null) {
      const pct = Number.parseInt(raw, 10);
      if (Number.isFinite(pct)) return clampFontScale(pct);
    }
  } catch {
    // ignore
  }
  return FONT_DEFAULT;
}

/** Persist (clamped) and return the clamped value. No DOM writes. */
export function saveFontScale(pct: number): number {
  const clamped = clampFontScale(pct);
  try {
    localStorage.setItem(FONT_SCALE_KEY, String(clamped));
  } catch {
    // ignore
  }
  return clamped;
}

/** Apply to the document — call on app mount and after every save. */
export function applyFontScale(pct: number): void {
  document.documentElement.style.fontSize = `${clampFontScale(pct)}%`;
}
