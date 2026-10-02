// src/engine/__tests__/font-scale.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clampFontScale,
  loadFontScale,
  saveFontScale,
  FONT_MIN,
  FONT_MAX,
  FONT_DEFAULT,
} from '../font-scale';

const KEY = 'pm_font_scale';

describe('clampFontScale', () => {
  it('returns the default for non-finite input', () => {
    expect(clampFontScale(NaN)).toBe(FONT_DEFAULT);
    expect(clampFontScale(Infinity)).toBe(FONT_DEFAULT);
  });

  it('clamps below the minimum', () => {
    expect(clampFontScale(50)).toBe(FONT_MIN);
  });

  it('clamps above the maximum', () => {
    expect(clampFontScale(200)).toBe(FONT_MAX);
  });

  it('rounds and keeps in-range values', () => {
    expect(clampFontScale(110)).toBe(110);
    expect(clampFontScale(112.6)).toBe(113);
  });
});

describe('loadFontScale', () => {
  beforeEach(() => localStorage.clear());

  it('returns the default when nothing is stored', () => {
    expect(loadFontScale()).toBe(FONT_DEFAULT);
  });

  it('parses a stored percentage', () => {
    localStorage.setItem(KEY, '115');
    expect(loadFontScale()).toBe(115);
  });

  it('clamps a stored out-of-range value', () => {
    localStorage.setItem(KEY, '999');
    expect(loadFontScale()).toBe(FONT_MAX);
  });

  it('falls back to the default for garbage', () => {
    localStorage.setItem(KEY, 'not-a-number');
    expect(loadFontScale()).toBe(FONT_DEFAULT);
  });
});

describe('saveFontScale', () => {
  beforeEach(() => localStorage.clear());

  it('persists the clamped value and returns it', () => {
    expect(saveFontScale(110)).toBe(110);
    expect(localStorage.getItem(KEY)).toBe('110');
    expect(saveFontScale(500)).toBe(FONT_MAX);
    expect(localStorage.getItem(KEY)).toBe(String(FONT_MAX));
  });
});
