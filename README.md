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

Every push to `main` builds the web app and publishes it to the `gh-pages`
branch via `.github/workflows/deploy-pages.yml`. It's live at:

**https://tripla77.github.io/Fantasy-Football-Draft/**

First-time setup (one switch): repo **Settings → Pages → Build and deployment →
Source: Deploy from a branch → Branch: `gh-pages` / `(root)`**. The build sets
`EXPO_BASE_URL` so assets resolve under the `/Fantasy-Football-Draft/` subpath.

### Per-PR previews

Every pull request is deployed to its own subfolder by
`.github/workflows/pr-preview.yml`, so you can view (and install as a PWA) the
exact change — separate from production — before merging:

**https://tripla77.github.io/Fantasy-Football-Draft/pr-preview/pr-&lt;N&gt;/**

The workflow comments the link on the PR, updates it on every push, and removes
the subfolder when the PR closes. Production deploys keep the `pr-preview/`
folder intact, so open previews survive a merge to `main`.

### Install as an app (PWA)

The preview ships a web manifest and home-screen icons, so you can install it:

- **iOS Safari** — Share → *Add to Home Screen*.
- **Android/Chrome/desktop** — *Install app* from the address bar / menu.

It opens standalone (no browser chrome), and the header and tab bar are padded by
the device safe-area insets so the nav clears the notch and home indicator.

The icons live in `web/` (`icon.svg` is the source). To regenerate the PNGs after
editing the SVG:

```bash
npx sharp-cli -i web/icon.svg -o web/icon-192.png resize 192 192
# ...or any SVG→PNG tool, exporting 192, 512 and a 180px apple-touch-icon.
```

## Cloud sync (optional, free)

Local storage (drafted players, your team, settings) is wiped when you clear your
browser's cache/site data. Cloud sync backs the team up to a free
[Supabase](https://supabase.com) project so it survives a clear and syncs across
devices, identified by a **sync code** (no login). Without the keys below the app
just runs local-only.

**1. Create a Supabase project** (free tier) and open the **SQL editor**, then run:

```sql
create table if not exists draft_saves (
  code       text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
-- Keep RLS on with no policies: the table is only reachable through the two
-- SECURITY DEFINER functions below, so there's no direct/enumerable access.
alter table draft_saves enable row level security;

create or replace function put_draft_save(p_code text, p_data jsonb)
returns void language sql security definer set search_path = public as $$
  insert into draft_saves (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
$$;

create or replace function get_draft_save(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select data from draft_saves where code = p_code;
$$;

grant execute on function put_draft_save(text, jsonb) to anon;
grant execute on function get_draft_save(text) to anon;
```

**2. Add the keys.** From Supabase **Project Settings → API**, copy the **Project URL**
and the **anon public** key. The anon key is safe to expose in a client, so add them
as GitHub repo **Actions Variables** (Settings → Secrets and variables → Actions →
Variables): `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The deploy and preview workflows
pass them to the build as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
For local dev, put the same two `EXPO_PUBLIC_*` vars in a `.env` file.

**3. Use it.** In the app: **Settings → Cloud sync → Enable cloud sync**. Copy the
code it gives you and keep it somewhere safe. After a cache clear (or on another
device), **Settings → Cloud sync → Restore from a code** brings your team back.

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
