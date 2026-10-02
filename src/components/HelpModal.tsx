// src/components/HelpModal.tsx
// How To Play — satirical explainer. Rendered by whoever needs it
// (StartScreen, PauseOverlay) so it stays inside the phone frame.

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs max-h-full flex flex-col bg-secondary rounded-2xl border border-theme"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-bold text-primary">How To Play</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -m-3 text-muted active:text-primary transition-colors active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-secondary">
          {/* Objective */}
          <div>
            <h3 className="text-primary font-bold mb-1">🎯 Objective</h3>
            <p>
              Ship tickets before the <strong className="text-primary">LTTC deadline</strong>{' '}
              blows up. Collect cash and hype. Do not rage quit. HR is watching.
            </p>
          </div>

          {/* The Loop */}
          <div>
            <h3 className="text-primary font-bold mb-1">📋 The Loop</h3>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>
                <strong className="text-primary">Ticket</strong> — a request lands with a
                deadline and a list of <strong className="text-primary">needs</strong> (tags).
              </li>
              <li>
                <strong className="text-primary">Prompt</strong> — stage tokens from the
                carousel. Cover the needs. Choose your risk.
              </li>
              <li>
                <strong className="text-primary">Compile</strong> — the build "runs".
                Mostly vibes.
              </li>
              <li>
                <strong className="text-primary">Deploy</strong> — the fun part. Tap
                glitches before their fuses burn out.
              </li>
              <li>
                <strong className="text-primary">Result</strong> — clean, rough, shaky,
                fail, or timeout. The dashboard updates.
              </li>
            </ol>
          </div>

          {/* Tokens */}
          <div>
            <h3 className="text-primary font-bold mb-1">🏷️ Tokens &amp; Tags</h3>
            <p>
              Swipe the carousel between <strong className="text-primary">Role</strong>,{' '}
              <strong className="text-primary">Action</strong> and{' '}
              <strong className="text-primary">Modifier</strong>. Each token carries tags.
              Tags that match the ticket's needs raise{' '}
              <strong className="text-emerald-400">SAFETY</strong> — fewer glitches in the
              deploy. Hype tokens raise{' '}
              <strong className="text-amber-400">HYPE</strong> — more glitches, but every
              one you clear pays more. Risk is a feature.
            </p>
          </div>

          {/* Deploy */}
          <div>
            <h3 className="text-primary font-bold mb-1">🚀 Deploy (the actual game)</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                Lines stream by. <strong className="text-primary">Tap a glitch</strong> to
                hotfix it before its fuse bar empties.
              </li>
              <li>
                👹 <strong className="text-primary">Bosses</strong> need 3 taps. They do
                not care about your sprint.
              </li>
              <li>
                A missed glitch <strong className="text-primary">cascades</strong> — new
                glitches spawn. Depth 4. No refunds.
              </li>
              <li>
                Missed glitches raise <strong className="text-red-400">corruption</strong>.
                At 100 the deploy <strong className="text-red-400">melts down</strong>.
              </li>
            </ul>
          </div>

          {/* Coffee */}
          <div>
            <h3 className="text-primary font-bold mb-1">☕ Coffee</h3>
            <p>
              On a ticket, coffee relieves stress. During a deploy it becomes the{' '}
              <strong className="text-primary">PANIC button</strong> — it clears the whole
              board. Tech Leads get one extra trick: the blast freezes cascades.
            </p>
          </div>

          {/* DORA */}
          <div>
            <h3 className="text-primary font-bold mb-1">📊 DORA</h3>
            <p>
              LTTC is a vanity metric and we track it anyway. Shipping faster means
              shipping more garbage — the <strong className="text-primary">Cobra Effect</strong>{' '}
              is a feature, not a bug. Elite bands are for decoration.
            </p>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-primary font-bold mb-1">💡 Tips</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                Match every need when you're unsure. Safety first, hype later.
              </li>
              <li>
                Hype prompts pay more per hotfix — only if your thumbs are warm.
              </li>
              <li>
                Save PANIC for the cascade, not the first glitch.
              </li>
              <li>
                The ⏸ button pauses the world. The world does not forgive.
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-theme text-center">
            <p className="text-xs text-muted">
              Remember: the prompt is not the product. The product is the incident.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
