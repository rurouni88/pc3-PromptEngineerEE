// src/components/TicketCard.tsx
import type { SatiricalTicket } from '../types/content';
import { ticketTimeFor } from '../engine/game';
import { formatMs } from '../engine/dora';
import { TagChip } from './tag';

interface TicketCardProps {
  ticket: SatiricalTicket | null;
  timeRemaining: number;
  /** Logical ms elapsed since this ticket started (live LTTC). */
  lttcMs: number;
  /** Tags covered by the currently staged prompt. */
  matchedTags: string[];
}

export function TicketCard({ ticket, timeRemaining, lttcMs, matchedTags }: TicketCardProps) {
  if (!ticket) return null;

  const total = ticketTimeFor(ticket.storyPoints);
  const deadlinePct = Math.max(0, Math.min(100, (timeRemaining / total) * 100));
  const urgent = timeRemaining <= 30;

  const riskColor =
    ticket.storyPoints <= 3
      ? 'text-emerald-400'
      : ticket.storyPoints <= 8
        ? 'text-amber-400'
        : 'text-red-400 animate-neon-flash';

  return (
    <section className="shrink-0 bg-secondary border-x border-theme p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-muted font-mono">{ticket.id}</span>
            <span className={`text-[10px] font-bold ${riskColor}`}>SP: {ticket.storyPoints}</span>
            <span className="text-[10px] text-emerald-400 font-bold">
              ${ticket.reward.cash.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-400 font-bold">⭐{ticket.reward.hype}</span>
          </div>
          <h3 className="text-sm font-semibold text-primary leading-tight">{ticket.title}</h3>
          <p className="text-xs text-secondary mt-1 leading-relaxed">{ticket.description}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ticket.needs.map(tag => (
              <TagChip key={tag} tag={tag} matched={matchedTags.includes(tag)} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className={`font-mono text-base font-bold ${urgent ? 'text-red-400 animate-neon-flash' : 'text-emerald-400'}`}>
            {formatMs(lttcMs)}
          </div>
          <div className="text-[10px] text-muted">LTTC live</div>
          {/* Deadline bar */}
          <div className="w-16 h-1 bg-tertiary rounded mt-1 overflow-hidden">
            <div
              className={`h-full ${urgent ? 'bg-red-500' : 'bg-emerald-600'}`}
              style={{ width: `${deadlinePct}%`, transition: 'width 1s linear' }}
            />
          </div>
          <div className="text-[9px] text-muted mt-0.5">
            {Math.ceil(timeRemaining)}s left
          </div>
        </div>
      </div>
    </section>
  );
}
