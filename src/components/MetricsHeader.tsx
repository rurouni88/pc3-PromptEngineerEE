// src/components/MetricsHeader.tsx
import type { GameContentProfile } from '../types/content';
import type { Tier } from '../types/content';
import type { DebtLevel } from '../types/game';
import { debtLevel } from '../engine/game';
import { formatMs } from '../engine/dora';

interface MetricsHeaderProps {
  stress: number;
  coffee: number;
  loc: number;
  cash: number;
  hype: number;
  tier: Tier;
  /** Logical ms elapsed on the current ticket (LTTC ticker). */
  lttcMs: number;
  /** Corruption 0-100 during deploy, null outside. */
  corruption: number | null;
  content: GameContentProfile;
  onChug: () => void;
  onPause: () => void;
  onOpenTeams: () => void;
}

const stressBarClass = (stress: number) =>
  stress < 50 ? 'bg-emerald-500' : stress < 80 ? 'bg-amber-500' : 'bg-red-500 animate-neon-flash';

const stressLabel = (stress: number) =>
  stress < 50 ? 'CALM' : stress < 80 ? 'STRESSED' : 'CRITICAL';

const debtColorClass = (debt: DebtLevel) =>
  debt === 'LOW'
    ? 'text-emerald-400'
    : debt === 'MODERATE'
      ? 'text-amber-400'
      : debt === 'HIGH'
        ? 'text-orange-400'
        : 'text-red-400 animate-neon-flash';

const TIER_BADGE: Record<Tier, string> = {
  junior: 'bg-gray-600/40 text-gray-300',
  mid: 'bg-blue-600/40 text-blue-300',
  senior: 'bg-purple-600/40 text-purple-300',
  staff: 'bg-pink-600/40 text-pink-300',
  principal: 'bg-amber-600/40 text-amber-300',
  'tech-lead': 'bg-emerald-600/40 text-emerald-300',
  architect: 'bg-cyan-600/40 text-cyan-300',
  cto: 'bg-red-600/40 text-red-300',
};

export function MetricsHeader({
  stress,
  coffee,
  loc,
  cash,
  hype,
  tier,
  lttcMs,
  corruption,
  content,
  onChug,
  onPause,
  onOpenTeams,
}: MetricsHeaderProps) {
  const debt = debtLevel(stress);
  const critical = stress >= 80;
  const deploying = corruption !== null;

  return (
    <header className="shrink-0 bg-primary border-b border-theme">
      {/* Stress bar (corruption bar during deploy) */}
      <div className="h-1 w-full bg-secondary">
        {deploying ? (
          <div
            className={`h-full transition-all duration-300 ${
              (corruption ?? 0) >= 70 ? 'bg-red-500 animate-neon-flash' : 'bg-red-600'
            }`}
            style={{ width: `${Math.min(corruption ?? 0, 100)}%` }}
          />
        ) : (
          <div
            className={`h-full transition-all duration-300 ${stressBarClass(stress)}`}
            style={{ width: `${Math.min(stress, 100)}%` }}
          />
        )}
      </div>

      {/* Metrics row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
        {/* Left: stress (or corruption) + LTTC ticker */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {deploying ? (
              <>
                <span aria-hidden>☣️</span>
                <span className={`font-bold ${(corruption ?? 0) >= 70 ? 'animate-neon-flash' : ''}`}>
                  CORRUPTION {(corruption ?? 0)}%
                </span>
              </>
            ) : (
              <>
                <span aria-hidden>⚡</span>
                <span className={`font-bold ${critical ? 'animate-neon-flash' : ''}`}>{stress}%</span>
                <span className={`text-muted ${critical ? 'animate-neon-flash' : ''}`}>
                  {stressLabel(stress)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 font-mono">
            <span aria-hidden>⏱</span>
            <span className={deploying ? 'text-red-300' : 'text-muted'}>
              LTTC {formatMs(lttcMs)}
            </span>
            <span className="text-muted truncate">
              · {content.currencyUnit} {loc.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center: debt + cash + hype + tier */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span aria-hidden>🔥</span>
            <span className={`font-semibold ${debtColorClass(debt)}`}>{debt}</span>
          </div>
          <div className="flex flex-col items-end leading-tight">
            <span className="text-emerald-400 font-bold">${cash.toLocaleString()}</span>
            <span className="text-amber-400 text-[10px] font-bold">⭐{hype}</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${TIER_BADGE[tier]}`}
          >
            {tier}
          </span>
        </div>

        {/* Right: Coffee + Actions (44px touch targets) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <span aria-hidden>☕</span>
            <span className="text-muted">{coffee}</span>
            <button
              onClick={onChug}
              disabled={coffee === 0}
              className="h-11 px-2.5 bg-emerald-600 active:bg-emerald-500 disabled:bg-secondary disabled:text-muted rounded-lg text-xs font-bold transition-colors"
            >
              CHUG
            </button>
          </div>
          <button
            onClick={onPause}
            aria-label="Pause"
            className="h-11 w-11 flex items-center justify-center bg-secondary active:bg-tertiary rounded-lg text-sm transition-colors"
          >
            ⏸
          </button>
          <button
            onClick={onOpenTeams}
            className="h-11 px-2.5 bg-teams active:opacity-80 rounded-lg text-xs font-bold text-white transition-opacity"
          >
            TEAMS
          </button>
        </div>
      </div>
    </header>
  );
}
