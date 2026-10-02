// src/components/PromptStaging.tsx
import type { StagedToken } from '../types/game';

interface PromptQuality {
  tagMatch: number;
  matched: number;
  total: number;
  safety: number;
  hype: number;
  quality: number;
}

interface PromptStagingProps {
  tokens: StagedToken[];
  quality: PromptQuality | null;
  onRemoveToken: (index: number) => void;
  onPush: () => void;
  isCompiling: boolean;
  pushLabel: string;
}

const categoryBadge: Record<string, string> = {
  role: 'bg-blue-600/30 text-blue-300',
  action: 'bg-purple-600/30 text-purple-300',
  modifier: 'bg-gray-500/30 text-gray-300',
};

function riskLabel(quality: PromptQuality | null): { label: string; cls: string } {
  if (!quality || quality.quality === 0) return { label: '??', cls: 'text-muted' };
  if (quality.quality >= 0.75) return { label: 'LOW', cls: 'text-emerald-400' };
  if (quality.quality >= 0.45) return { label: 'MED', cls: 'text-amber-400' };
  return { label: 'HIGH', cls: 'text-red-400 animate-neon-flash' };
}

export function PromptStaging({
  tokens,
  quality,
  onRemoveToken,
  onPush,
  isCompiling,
  pushLabel,
}: PromptStagingProps) {
  const hasTokens = tokens.length > 0;
  const risk = riskLabel(quality);

  const buttonClass = isCompiling
    ? 'bg-secondary text-muted'
    : hasTokens
      ? 'bg-emerald-600 text-white animate-push-glow active:scale-95'
      : 'bg-secondary text-muted';

  return (
    <section className="shrink-0 bg-primary border-t border-theme">
      {/* Staged token chips (tap × to remove) */}
      <div className="px-3 py-2 border-b border-theme">
        <div className="text-[10px] text-muted mb-1.5">YOUR PROMPT</div>
        {hasTokens ? (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {tokens.map((token, i) => (
              <span
                key={`${token.category}-${i}-${token.text}`}
                className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md text-[11px] ${categoryBadge[token.category]}`}
              >
                <span>{token.text}</span>
                <button
                  onClick={() => onRemoveToken(i)}
                  aria-label={`Remove ${token.text}`}
                  // 44px hit area, negative margin keeps the visual × compact
                  className="w-11 h-11 -m-2 flex items-center justify-center rounded hover:bg-white/10 active:bg-white/20"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted italic">No tokens staged...</div>
        )}

        {/* Prompt quality readout */}
        {quality && (
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
            <span className={quality.matched === quality.total ? 'text-emerald-400' : 'text-secondary'}>
              MATCH {quality.matched}/{quality.total}
            </span>
            <span className="text-secondary">
              SAFETY {Math.round(quality.safety * 100)}%
            </span>
            <span className={quality.hype > 0.5 ? 'text-red-400' : 'text-secondary'}>
              HYPE {Math.round(quality.hype * 100)}%
            </span>
            <span className={risk.cls}>RISK {risk.label}</span>
          </div>
        )}
      </div>

      {/* Push button */}
      <div className="p-3">
        <button
          onClick={onPush}
          disabled={isCompiling || !hasTokens}
          className={`w-full h-14 rounded-xl font-bold text-lg transition-all ${buttonClass}`}
        >
          {isCompiling ? 'COMPILING...' : pushLabel}
        </button>
      </div>
    </section>
  );
}
