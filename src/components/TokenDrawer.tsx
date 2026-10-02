// src/components/TokenDrawer.tsx
import { useState } from 'react';
import type { GameContentProfile, TokenCategory, Tier } from '../types/content';
import { tokenUnlocked } from '../engine/game';
import { TagChip } from './tag';

interface TokenDrawerProps {
  content: GameContentProfile;
  tier: Tier;
  onTokenSelect: (text: string, category: TokenCategory) => void;
}

const TABS: { key: TokenCategory; label: string }[] = [
  { key: 'role', label: 'Role' },
  { key: 'action', label: 'Action' },
  { key: 'modifier', label: 'Modifier' },
];

export function TokenDrawer({ content, tier, onTokenSelect }: TokenDrawerProps) {
  const [activeTab, setActiveTab] = useState<TokenCategory>('role');

  return (
    <section className="shrink-0 bg-primary border-t border-theme">
      {/* Category tabs */}
      <div className="flex border-b border-theme">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 h-11 text-xs font-bold transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-emerald-400'
                : 'text-muted active:text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tokens — horizontal swipe, vertical page scroll passes through */}
      <div className="p-3">
        <div className="flex gap-2 overflow-x-auto touch-pan-y pb-1">
          {content.tokens[activeTab].map(token => {
            const unlocked = tokenUnlocked(token, tier);
            if (!unlocked) {
              return (
                <button
                  key={token.text}
                  disabled
                  className="shrink-0 min-h-11 px-3 bg-secondary/50 border border-theme rounded-lg text-xs text-muted flex items-center gap-1.5 opacity-60"
                >
                  <span aria-hidden>🔒</span>
                  <span>{token.text}</span>
                  <span className="text-[9px] uppercase font-bold">{token.minTier}</span>
                </button>
              );
            }
            return (
              <button
                key={token.text}
                onClick={() => onTokenSelect(token.text, activeTab)}
                className="shrink-0 min-h-11 px-3 bg-secondary active:bg-tertiary border border-theme rounded-lg text-left transition-colors"
              >
                <div className="text-xs text-primary leading-tight">{token.text}</div>
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
    </section>
  );
}
