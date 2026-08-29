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

## Live preview (GitHub Pages)

Every push builds the web app and deploys it to GitHub Pages via
`.github/workflows/deploy-pages.yml`. Once enabled it's live at:

**https://aallisonvow.github.io/Fantasy-Football-Draft/**

First-time setup (one switch): repo **Settings → Pages → Build and deployment →
Source: GitHub Actions**. Then re-run the "Deploy web preview to GitHub Pages" workflow
(Actions tab) if the first run was before you flipped it. The CI build sets
`EXPO_BASE_URL` so assets resolve under the `/Fantasy-Football-Draft/` subpath.

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

The app pulls **live data from the free, no-auth [Sleeper API](https://docs.sleeper.com/)**
(`GET https://api.sleeper.app/v1/players/nfl`) and falls back to a bundled dataset when
offline. See `src/lib/dataSource.ts`.

**What's live vs. modeled:**

| Field | Source |
| --- | --- |
| Player, team, position, injury status | **Live** — Sleeper |
| Overall rank / draft order | **Live** — Sleeper `search_rank` (consensus relevance) |
| ADP | Estimated from the live rank (Sleeper has no public ADP) |
| Season projection | **Modeled** — a per-position value curve anchored to rank |

Sleeper doesn't expose projections or ADP for free, so those are modeled so that VOR,
tiers, and the advisor stay meaningful. They're transparent estimates — swap in a paid
projections feed (e.g. FantasyPros) later for exact numbers by editing `dataSource.ts`.

**How refresh works:**

- On launch the app shows cached/bundled data instantly, then refreshes from Sleeper in
  the background (if the cache is older than 12h). The live pull is cached to
  `AsyncStorage`, so it works offline afterward.
- **Settings → Player data** shows the current source (Live / Cached / Bundled), the
  player count, and a **Refresh** button to pull the latest on demand.
- If Sleeper is unreachable, the app keeps working on cached/bundled data and says so.

### Offline fallback dataset

`src/data/players.json` is the bundled seed (~220 players) used when there's no live
data. It's editable — keep the shape:

```json
{ "id": "p001", "name": "Player Name", "pos": "RB", "team": "SF",
  "rank": 1, "adp": 1.2, "projection": 312, "tier": 1 }
```

`pos` must be one of `QB | RB | WR | TE | K | DST`.

## Project structure

```
App.tsx                  # entry + bottom tab navigation
src/
  data/players.json      # offline fallback dataset
  types.ts               # shared types
  theme.ts               # colors / position palette
  store/draftStore.ts    # zustand store + live-data + AsyncStorage persistence
  lib/                   # dataSource (Sleeper), scoring (VOR), roster fill, advisor
  screens/               # Board, Tiers, Advisor, My Team, Settings
  components/            # PlayerRow, TierBadge, PositionFilter, StatPill
```
