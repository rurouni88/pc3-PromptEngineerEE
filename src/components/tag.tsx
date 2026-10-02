// src/components/tag.tsx
// Shared tag chip styling (ticket needs + token tags).

import type { Tag } from '../types/content';

export const TAG_STYLES: Record<Tag, string> = {
  memory: 'bg-purple-600/30 text-purple-300',
  legacy: 'bg-amber-600/30 text-amber-300',
  perf: 'bg-blue-600/30 text-blue-300',
  ui: 'bg-pink-600/30 text-pink-300',
  security: 'bg-emerald-600/30 text-emerald-300',
  tests: 'bg-cyan-600/30 text-cyan-300',
  web3: 'bg-indigo-600/30 text-indigo-300',
  speed: 'bg-lime-600/30 text-lime-300',
  hack: 'bg-red-600/30 text-red-300',
};

interface TagChipProps {
  tag: Tag;
  /** Highlighted when a staged token covers this need. */
  matched?: boolean;
}

export function TagChip({ tag, matched = false }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
        matched ? 'ring-1 ring-emerald-400 bg-emerald-600/40 text-emerald-200' : TAG_STYLES[tag]
      }`}
    >
      {tag}
    </span>
  );
}
