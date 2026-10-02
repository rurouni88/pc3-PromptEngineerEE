# 🎮 Gameplay Guide

## Quick Start

1. **Clock in** — Tap "START WORK DAY" (your career tier gates what you can do)
2. **Read the ticket** — A Jira ticket arrives with needs (tags), a reward, and a deadline
3. **Build the prompt** — Stack tokens whose tags match the ticket's needs. Watch the quality readout: match, safety, hype, risk
4. **Push to prod** — The AI compiles, then the deploy stream starts
5. **Hotfix the deploy** — Glitches erupt in the stream. Tap them before their fuses burn out. Bosses take three taps. Misses cascade
6. **Cash out** — Ship clean (or don't). Your Lead Time to Change gets banded on the DORA dashboard. Repeat until your stress hits 100%

## The Core Loop

```
[ 1. TICKET ]    --> Absurd requirement + needs (tags) + deadline (the LTTC clock starts)
       │
       ▼
[ 2. PROMPT ]    --> Stack tokens. Tags match needs → quality up → fewer glitches.
                     Hype tokens → more glitches, but bigger hotfix payouts.
       │
       ▼
[ 3. COMPILE ]   --> The AI streams its work. Occasionally it apologises.
       │
       ▼
[ 4. DEPLOY ]    --> THE SKILL PHASE. Lines stream in. Glitches erupt.
                     Tap fast. Cascades spread. Corruption climbs. 100 = meltdown.
                     ☕ PANIC clears everything (no payout).
       │
       ▼
[ 5. RESULT ]    --> clean / rough / shaky / fail / timeout.
                     LTTC banded Elite/Good/Poor. DORA dashboard updates.
```

The hook: **illusion of control vs. exponential chaos**. Your prompt quality decides how
many glitches spawn — but the *where*, the *bosses*, and the *cascades* are where your
fingers earn the reward. Hype prompts are a risk/reward trade, not a gamble: more glitches,
bigger payouts per hotfix.

## 🧩 The Token System

Tokens carry **tags**, **safety**, and **hype**. The engine reads the numbers, not the prose.

### The 9-Tag Vocabulary

`memory · legacy · perf · ui · security · tests · web3 · speed · hack`

Each ticket needs 2–3 tags. Tokens carry 1–2 tags.

### Prompt Quality

```
quality    = 0.6 × tagMatch + 0.4 × safety
tagMatch   = (ticket needs covered by staged tags) / (total needs)
safety     = min(1, total safety points / 4)
hype       = min(1, total hype points / 6)

glitchChance = clamp(0.5 − 0.4 × quality + 0.25 × hype, 0.08, 0.70)
```

- **Match all needs + stack safety** → ~10% glitch chance per line. Boring. Safe.
- **Hype everything** → ~70% glitch chance per line. Every payout is 1.5× bigger.

### Tier-Gated Tokens

Some tokens are locked behind career tiers (e.g. *Act as a DevOps Warlock* is Mid+).
Locked tokens show a 🔒 in the drawer.

### Picking Tokens (Carousel)

The token drawer is a swipeable carousel: one page per category
(**Role → Action → Modifier**). Swipe horizontally to change category, scroll
vertically inside a page to browse tokens (Role has 20). The category dots
on top are tappable and show how many tokens each page holds.

## 📋 Tickets

```
JIRA-404: Patch the Memory Leak in the User Dashboard
SP: 8 · $1,200 · ⭐40 · needs: [memory] [perf]
LTTC live: 0:12 · 138s left
```

- **Needs** — tag chips; they light up green as your staged prompt covers them
- **Deadline** — the ticket timer. Miss it and the change never ships (timeout, +25 stress)
- **LTTC ticker** — Lead Time to Change, live. This is the DORA vanity metric. Chase Elite and the dashboard will applaud you for shipping garbage faster.

Hard tickets (JIRA-777, JIRA-999) are Staff+.

## ⚙️ The Deploy Phase (Where the Game Lives)

When the compile finishes, the deploy stream starts:

- **Lines stream in** at 500ms each. Count = 10 + story points.
- **Glitches erupt** on pre-chosen lines at the moment they're revealed.
- **Fuse** — each glitch has ~2 seconds (4 ticks) before it melts.
- **Tap to hotfix** — normal glitches clear in one tap (+$25 × hype bonus, −2 stress). Bosses (👹) need **three taps**.
- **Cascades** — a melted glitch spawns two children on clean lines, up to depth 4. The dread is watching a cascade mark an *unrevealed* line: it's coming.
- **Corruption** — +12 per melted glitch, +20 per boss. **100 = production meltdown** (fail, +25 stress).
- **☕ PANIC** — spend a coffee, clear every live glitch, no payout. Your last card when the cascade goes nuclear.
  - **Tech Lead perk**: your first PANIC also *freezes cascades* for 3 seconds (once per run).

### Outcomes

| Result | Condition | Reward mult | Stress |
|--------|-----------|-------------|--------|
| **clean** ✅ | 0 expired, 0 corruption | ×1.0 | −10 |
| **rough** ⚠️ | ≤3 expired, <40 corruption | ×0.6 | −5 |
| **shaky** 🩹 | otherwise | ×0.3 | +5 |
| **fail** 🔥 | corruption 100 (meltdown) | ×0 | +25 |
| **timeout** ⏰ | deadline hit | ×0 | +25 |

## ☕ Coffee

- Starts at 3 (Senior+ start with 4).
- During a ticket: CHUG = −15 stress.
- During a deploy: the same button is **PANIC** — it clears the board, not your stress.

## 📊 DORA (The Dashboard That Lies)

Every result shows your run's **Lead Time to Change** banded Elite / Good / Poor, and the
start screen has the full fake DORA dashboard:

| Metric | Elite | Good | Poor |
|--------|-------|------|------|
| Deployment Frequency | ≥8/day | 4–7 | ≤3 |
| Lead Time to Change | <45s avg | 45–90s | >90s |
| Change Failure Rate | <15% | 15–40% | >40% |
| Mean Time to Recover | <20s | 20–45s | >45s / never |

The **Cobra Effect is a feature**: the fastest way to Elite LTTC is to hype every prompt,
which means more meltdowns. The dashboard will be half-green, half-forensic, and the
executive summary will notice:

> *"You ship faster than your code can die. Impressive, in a forensic sense."*

## 🏆 Career Ladder

Promotion is measured in things you can game, not things you fixed:

| Tier | Requirement | Perk |
|------|-------------|------|
| Junior | — | base game |
| Mid | $5K lifetime cash | Warlock token |
| Senior | $15K | +1 starting coffee |
| Staff | 3 clean deploys | hard tickets (JIRA-777/999) |
| Principal | $50K | AI Council token |
| Tech Lead | 50 glitches cleared | PANIC freezes cascades (1×/run) |
| Architect | $150K + 10 clean | the DLC gate (42 requirements, you meet 38) |
| CTO | all achievements | the company is now a suggestion |

## 🎖 Achievements (16)

Pure lifetime predicates, evaluated at run end. Highlights:

- **Cobra Effect** — Elite LTTC *and* >40% failure rate in one run
- **Quick Draw** — sub-30s lead time
- **Resilience** — recover from a meltdown in under 60s
- **AI Incident** — the AI apologised. HR has been notified.
- **v0.99.9** — `implemented: false`. Aspirational: true.
- **CTO of One** — everything else, unlocked

## 🎲 Seeded Runs

Every run uses a deterministic seeded RNG (Mulberry32). The 8-character seed is shown on
every result screen. Same seed + same taps = same deploy, same cascades, same LTTC.
Share the seed; the skill is yours to prove.

## 💬 MS Teams Chat

Satirical commentary arrives in the Teams panel (⏸ header button): PMs, SREs, the AI
itself. Clean deploys and meltdowns both get reactions.

## ⏸ Pause

Freezes everything. You can **END DAY** (cash out — the run is recorded, stats kept) or
restart. A **❓ HOW TO PLAY** button is also available here for mid-run refreshers.

## ❓ How To Play

A satirical explainer covering the loop, tokens & tags, the deploy phase, coffee,
and DORA. Reach it from the **❓** button on the start screen (top-right) or from
the pause overlay.

## ⚙️ Settings

Reach it from the **⚙️** button on the start screen (top-right):

- **Font size** — 100–120% (rem-based, scales the whole UI; persisted in `pm_font_scale`)
- **Reset achievements** — with confirmation
- **Reset career** — wipes the ladder, cash, and DORA history; with confirmation

No sound/haptics/theme toggles yet — those engines are deferred by design.

---

*Built with ☕, 💻, and questionable prompt engineering.*
