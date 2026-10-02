// src/components/TokenDrawer.tsx
// Token picker as a swipeable carousel: one page per category
// (Role → Action → Modifier). Horizontal swipe changes category,
// vertical scroll works inside the token grid. Dots are tappable.

import { useRef, useState } from 'react';
import type { GameContentProfile, TokenCategory, Tier } from '../types/content';
import { tokenUnlocked } from '../engine/game';
import { TagChip } from './tag';

interface TokenDrawerProps {
  content: GameContentProfile;
  tier: Tier;
  onTokenSelect: (text: string, category: TokenCategory) => void;
}

const PAGES: { key: TokenCategory; label: string }[] = [
  { key: 'role', label: 'ROLE' },
  { key: 'action', label: 'ACTION' },
  { key: 'modifier', label: 'MODIFIER' },
];

export function TokenDrawer({ content, tier, onTokenSelect }: TokenDrawerProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const page = Math.round(el.scrollLeft / el.clientWidth);
    if (page !== active) setActive(page);
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="shrink-0 bg-primary border-t border-theme">
      {/* Category dots — tappable, full-width 44px targets */}
      <div className="flex gap-1 px-3 pt-2">
        {PAGES.map((page, i) => (
          <button
            key={page.key}
            onClick={() => goTo(i)}
            aria-label={`Show ${page.label} tokens`}
            aria-current={active === i}
            className={`h-11 flex-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
              active === i
                ? 'bg-tertiary text-primary'
                : 'bg-secondary/50 text-muted active:text-secondary'
            }`}
          >
            {page.label}
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                active === i ? 'bg-primary text-emerald-400' : 'bg-primary/60'
              }`}
            >
              {content.tokens[page.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Carousel — snap pages, one per category */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        <div className="flex">
          {PAGES.map(page => (
            <div key={page.key} className="w-full shrink-0 snap-center px-3 pb-3">
              <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto pr-1">
                {content.tokens[page.key].map(token => {
                  const unlocked = tokenUnlocked(token, tier);
                  if (!unlocked) {
                    return (
                      <button
                        key={token.text}
                        disabled
                        className="min-h-11 px-2.5 py-1.5 bg-secondary/50 border border-theme rounded-lg text-left flex flex-col justify-center opacity-60"
                      >
                        <div className="text-[11px] text-muted leading-tight">
                          <span aria-hidden>🔒</span> {token.text}
                        </div>
                        <div className="text-[9px] uppercase font-bold text-muted mt-1">
                          {token.minTier}
                        </div>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={token.text}
                      onClick={() => onTokenSelect(token.text, page.key)}
                      className="min-h-11 px-2.5 py-1.5 bg-secondary active:bg-tertiary border border-theme rounded-lg text-left transition-colors"
                    >
                      <div className="text-[11px] text-primary leading-tight">
                        {token.text}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {token.tags.map(tag => (
                          <TagChip key={tag} tag={tag} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
