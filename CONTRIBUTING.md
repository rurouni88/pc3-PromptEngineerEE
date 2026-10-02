# 🧑‍💻 Contributing

## 📁 File Structure

```
pc3-PromptEngineerEE/
├── src/
│   ├── data/
│   │   └── engineeringContent.ts   # Engineering Mode content profile
│   ├── types/
│   │   ├── content.ts              # GameContentProfile + TokenDefinition (modular)
│   │   └── game.ts                 # GameState, phases, outcomes
│   ├── engine/                     # Pure logic — ZERO React imports
│   │   ├── game.ts                 # Game state transitions + outcome engine + TUNING
│   │   ├── seeded-rng.ts           # Mulberry32 PRNG (deterministic runs)
│   │   └── __tests__/
│   │       ├── game.test.ts        # Engine tests (36)
│   │       └── seeded-rng.test.ts  # RNG tests (reused from pc3-PTSD)
│   ├── hooks/
│   │   └── useGameEngine.ts        # Thin bridge: state + single game interval
│   ├── components/
│   │   ├── MetricsHeader.tsx       # Telemetry header (stress, coffee, LOC, debt)
│   │   ├── Terminal.tsx            # Live sandbox with auto-scroll, color-coded logs
│   │   ├── TicketCard.tsx          # Active Jira ticket with countdown
│   │   ├── TokenDrawer.tsx         # Horizontal swipe category tabs
│   │   ├── PromptStaging.tsx       # Token chips (removable) + push button
│   │   ├── TeamsChat.tsx           # Slide-in MS Teams chat panel
│   │   ├── ResultOverlay.tsx       # Deploy outcome card + seed display
│   │   └── PauseOverlay.tsx        # Pause/resume/restart overlay
│   ├── App.tsx                     # Thin renderer over the engine (no game logic)
│   ├── main.tsx                    # Vite entry
│   └── index.css                   # Tailwind v4 + CSS custom properties
├── public/
│   └── favicon.svg
├── .github/workflows/
│   ├── pr-checks.yml               # CI: typecheck + test + build (parallel)
│   └── deploy-pages.yml            # Deploy: build + upload dist/ to GitHub Pages
├── index.html                      # Vite entry
├── package.json                    # Scripts: dev, build, test, typecheck
├── tsconfig.json                   # TypeScript config (strict)
├── vite.config.ts                  # Vite + Tailwind v4 plugin
├── GAMEPLAY.md                     # Rules, mechanics, token system, phases
├── CONTRIBUTING.md                 # This file
├── PC3_AGENT.md                    # Agent context (gitignored)
├── PC3_ARCHIECTURE_GUARDRAILS.md   # Architecture principles (gitignored)
└── CODING_STANDARDS.md             # Coding standards
```

## 🚀 Deployment

### GitHub Pages

The site deploys to GitHub Pages via CI on every push to `main`:

1. `npm ci` → 2. `tsc -b` → 3. `vite build` → 4. Upload `dist/`

Live at: `https://rurouni88.github.io/pc3-PromptEngineerEE`

### Local Development

```bash
npm install      # install dependencies
npm run dev      # start Vite dev server (http://localhost:5173)
```

## 🛠️ Tech Stack

- **React 19 + Vite 8** — Fast HMR
- **TypeScript 7** — Full `strict` type checking
- **Tailwind CSS v4** — Utility classes + CSS custom properties
- **Vitest 5** — Engine tests (pure logic, no DOM)
- **LocalStorage** — Saves, meta progression, seeded runs
- **Seeded RNG (Mulberry32)** — Deterministic runs
- **Mobile-First** — Touch targets ≥ 44px, h-dvh viewport, touch-pan-y

## 🧪 Building & Verifying

```bash
npm run dev          # dev server
npm run build        # typecheck + build
npm run typecheck    # type-check only
npm test             # Vitest engine tests
```

- Engine modules (`src/engine/`) have **zero React imports**
- Engine functions are pure: `state in → state out`, testable without a DOM
- Tests in `src/engine/__tests__/` — 36 tests, deterministic (seeded RNG)
- CI: `typecheck` + `test` + `build` (parallel jobs, all must pass)

## 📋 Modular Content

The game uses a `GameContentProfile` interface for content modularity. This allows swapping between game modes (Engineering Mode, Architect DLC) without code changes.

### Content Profile Interface

```typescript
interface GameContentProfile {
  modeName: string;
  currencyUnit: string;
  stressFactors: { lowName: string; highName: string };
  tokens: { role: string[]; action: string[]; modifier: string[] };
  tickets: SatiricalTicket[];
  errorLogs: string[];
}
```

### Adding a New Content Profile

1. Create a new file in `src/data/` (e.g., `architectContent.ts`)
2. Implement `GameContentProfile` with your content
3. Register it in the content selector (main menu)
4. No component changes needed — the UI reads from the profile

## 📋 Roadmap

- [ ] Fire drill mini-game (error-tapping mitigation phase)
- [ ] Meta progression system (unlocks, achievements, leaderboard)
- [ ] Architect DLC content (diagram components, Miro board, ADRs)
- [ ] Random interrupts (stand-up meetings, Zoom calls, CEO visions)
- [ ] Shareable run summaries (seed + transcript)
- [ ] Sound engine (Web Audio API SFX for compile, deploy, errors)
- [ ] Haptics engine (navigator.vibrate at meaningful interaction points)
- [ ] Error boundaries + graceful fallback UI

### Considered and Deferred

| Idea | Why Deferred |
|------|-------------|
| State management library (Redux, Zustand) | useState + custom hook sufficient at this scale |
| Routing library | 4 screens, conditional renders are fine |
| CSS-in-JS | Tailwind utility classes + CSS custom properties |
| i18n | Game is in English. Satirical tone doesn't require it. |
| Server-side simulation | Local browser game. No server. |
| Multiplayer | Single-player focus. Leaderboards are local-only for now. |

## ✅ Current State

- Pure engine layer (`src/engine/`) — zero React imports, 36 tests ✓
- Seeded runs (Mulberry32, 8-char seed, displayed on result card) ✓
- Deterministic outcome engine (token metadata: safety/hype, TUNING knobs) ✓
- Hybrid IDE/Social layout (terminal + Teams chat) ✓
- Telemetry header (stress, coffee, LOC, debt — single source of truth) ✓
- Live terminal with auto-scroll, color-coded logs ✓
- Ticket system with countdown timer + timeout penalty ✓
- Token drawer (3 categories) + removable token chips ✓
- Compile simulation with streaming logs ✓
- Success/partial/fail/timeout outcomes + result overlay ✓
- Game over at 100% stress (rage-quit screen) ✓
- MS Teams chat panel (content-profile-driven, event reactions) ✓
- Pause overlay (freezes all timers via single interval) ✓
- Modular content profile (GameContentProfile interface) ✓
- Mobile-first (h-dvh, overflow-hidden, 44px targets, theme utilities) ✓
- TypeScript (zero errors) + Tailwind v4 CSS custom properties ✓
- CI: typecheck + test + build (parallel) ✓
- GitHub Pages deployment workflow ✓
- **v0.2.0**
