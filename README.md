# 🏈 Fantasy Football Draft HQ

A React Native (web-first) analytics dashboard to plan and run your fantasy
football draft. Built with **Expo + TypeScript**, it runs in the browser and can
target iOS/Android from the same code.

Tuned by default for a **Standard scoring, 10-team** league — fully configurable in
Settings.

## Features

- **Draft Board** — sortable (Rank / VOR / ADP), position-filterable, searchable cheat
  sheet. Mark a player "Gone" (drafted by anyone) or "Mine" (drafted to your team).
- **Tiers & Scarcity** — players grouped into tiers per position, with live "players
  left in tier" counts and scarcity warnings so you can see positional drop-offs.
- **Pick Advisor** — a best-available recommendation blending **value over replacement
  (VOR)**, your **roster needs**, and **positional scarcity**, each with a one-line "why".
- **My Team** — a roster builder that auto-fills starter slots (QB/RB/WR/TE/FLEX/K/DST +
  bench), tracks projected points, and shows what you still need.
- **Settings** — scoring format, league size, and starting-lineup slots. Changing them
  recomputes replacement levels and VOR everywhere. Draft state persists across refreshes.

## Getting started

```bash
npm install
npm run web          # opens the app in your browser (Expo)
```

Other targets (require Expo Go / simulators):

```bash
npm start            # Expo dev server (choose a platform)
npm run ios
npm run android
npm run typecheck    # tsc --noEmit
```

## How the analytics work

- **VOR (Value Over Replacement)** — for each position, a *replacement baseline* is the
  projected points of the last "startable" player across the league (e.g. Standard
  10-team ≈ QB10, RB25, WR34, TE11, accounting for FLEX). `VOR = projection − baseline`.
  This is what makes an RB and a WR comparable on one board. See `src/lib/scoring.ts`.
- **Roster needs & slot fill** — drafted players are greedily assigned to starter slots
  (dedicated positions first, then FLEX, then bench). Unfilled starters become "needs"
  that weight the advisor. See `src/lib/roster.ts`.
- **Advisor** — ranks available players by `VOR + needBonus + scarcityBonus`. See
  `src/lib/advisor.ts`.

## The player data

`src/data/players.json` is a **bundled seed dataset** (~220 players: rank, ADP,
projection, tier, position, team) — no API keys, works offline. Projections are
**standard scoring**; Half/Full PPR apply an approximate per-position bump.

**It's meant to be edited.** Refresh the numbers each season, or replace it with your
own export (e.g. FantasyPros). Keep the shape:

```json
{ "id": "p001", "name": "Player Name", "pos": "RB", "team": "SF",
  "rank": 1, "adp": 1.2, "projection": 312, "tier": 1 }
```

`pos` must be one of `QB | RB | WR | TE | K | DST`. A live-API or CSV-import path can be
added as a follow-up.

## Project structure

```
App.tsx                  # entry + bottom tab navigation
src/
  data/players.json      # editable seed dataset
  types.ts               # shared types
  theme.ts               # colors / position palette
  store/draftStore.ts    # zustand store + AsyncStorage persistence
  lib/                   # scoring (VOR), roster fill, advisor
  screens/               # Board, Tiers, Advisor, My Team, Settings
  components/            # PlayerRow, TierBadge, PositionFilter, StatPill
```
