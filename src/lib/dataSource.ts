import { Player, Position } from '../types';
import bundled from '../data/players.json';

/**
 * Live data source: the free, no-auth, CORS-open Sleeper API.
 *   GET https://api.sleeper.app/v1/players/nfl
 *
 * Sleeper provides the live player universe — names, teams, positions, injury
 * status, and a global `search_rank` (consensus relevance ordering). It does NOT
 * provide projections or ADP, so we MODEL season projections from a per-position
 * value curve anchored to each player's positional rank. That keeps VOR, tiers,
 * and the advisor meaningful. Projections are estimates and remain editable; swap
 * in a paid projections feed (e.g. FantasyPros) later for exact numbers.
 */
export const SLEEPER_URL = 'https://api.sleeper.app/v1/players/nfl';

export type DataSourceKind = 'live' | 'cache' | 'bundled';

export interface DataResult {
  players: Player[];
  source: DataSourceKind;
  fetchedAt: number | null;
}

/** Shape of the fields we read from a Sleeper player record. */
interface SleeperPlayer {
  player_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
  fantasy_positions?: string[];
  team?: string | null;
  active?: boolean;
  injury_status?: string | null;
  search_rank?: number | null;
}

const VALID: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

/** Max players kept per position (keeps the board draft-relevant and fast). */
const CAPS: Record<Position, number> = { QB: 32, RB: 80, WR: 90, TE: 40, K: 32, DST: 32 };

/** Modeled projection curve per position: linear decay from `base`, clamped at `floor`. */
const CURVE: Record<Position, { base: number; step: number; floor: number }> = {
  QB: { base: 402, step: 5.0, floor: 245 },
  RB: { base: 312, step: 3.3, floor: 92 },
  WR: { base: 270, step: 2.15, floor: 66 },
  TE: { base: 208, step: 3.7, floor: 92 },
  K: { base: 150, step: 2.2, floor: 112 },
  DST: { base: 142, step: 2.3, floor: 100 },
};

function modeledProjection(pos: Position, posRank: number): number {
  const c = CURVE[pos];
  return Math.max(c.floor, Math.round(c.base - c.step * (posRank - 1)));
}

/** Bucket a position's players (already sorted best-first) into tiers. */
function assignTiers(count: number): number[] {
  // Tier sizes grow from small (elite tiers) toward wider ones.
  const sizes = [3, 3, 4, 4, 5, 6];
  const tiers: number[] = [];
  let tier = 1;
  let filled = 0;
  let sizeIdx = 0;
  for (let i = 0; i < count; i++) {
    tiers.push(tier);
    filled++;
    const cap = sizes[Math.min(sizeIdx, sizes.length - 1)];
    if (filled >= cap) {
      tier++;
      filled = 0;
      sizeIdx++;
    }
  }
  return tiers;
}

function normalizePos(p: SleeperPlayer): Position | null {
  if (p.position === 'DEF') return 'DST';
  const fromFantasy = (p.fantasy_positions ?? []).find((fp) =>
    VALID.includes(fp as Position)
  );
  if (fromFantasy) return fromFantasy as Position;
  if (p.position && VALID.includes(p.position as Position)) return p.position as Position;
  return null;
}

/** Transform the raw Sleeper player map into our ranked `Player[]`. */
export function transformSleeper(raw: Record<string, SleeperPlayer>): Player[] {
  const candidates: { sp: SleeperPlayer; pos: Position; rank: number }[] = [];

  for (const sp of Object.values(raw)) {
    if (!sp || sp.active === false) continue;
    const pos = normalizePos(sp);
    if (!pos) continue;
    // Defenses have no team-vs-team; keep them. Skip skill players with no team.
    if (pos !== 'DST' && !sp.team) continue;
    const rank = typeof sp.search_rank === 'number' ? sp.search_rank : Number.MAX_SAFE_INTEGER;
    candidates.push({ sp, pos, rank });
  }

  candidates.sort((a, b) => a.rank - b.rank);

  // Apply per-position caps and build positional ranks.
  const posCount: Record<string, number> = {};
  const kept = candidates.filter((c) => {
    const n = (posCount[c.pos] ?? 0) + 1;
    if (n > CAPS[c.pos]) return false;
    posCount[c.pos] = n;
    return true;
  });

  // Positional rank per player (order within kept, which is search_rank order).
  const posRankCounter: Record<string, number> = {};
  const byPosTiers: Record<string, number[]> = {};
  for (const pos of VALID) {
    byPosTiers[pos] = assignTiers(posCount[pos] ?? 0);
  }

  const players: Player[] = kept.map((c, overallIdx) => {
    const posRank = (posRankCounter[c.pos] = (posRankCounter[c.pos] ?? 0) + 1);
    const name =
      c.sp.full_name ||
      [c.sp.first_name, c.sp.last_name].filter(Boolean).join(' ') ||
      c.sp.player_id;
    return {
      id: `sleeper-${c.sp.player_id}`,
      name,
      pos: c.pos,
      team: c.sp.team ?? c.sp.player_id,
      rank: overallIdx + 1,
      adp: overallIdx + 1, // Sleeper has no ADP; overall rank is our estimate.
      projection: modeledProjection(c.pos, posRank),
      tier: byPosTiers[c.pos][posRank - 1] ?? 1,
      injury: c.sp.injury_status ?? null,
    };
  });

  return players;
}

/** Fetch and transform the live Sleeper dataset. Throws on network/parse error. */
export async function fetchLivePlayers(signal?: AbortSignal): Promise<Player[]> {
  const res = await fetch(SLEEPER_URL, { signal });
  if (!res.ok) throw new Error(`Sleeper responded ${res.status}`);
  const raw = (await res.json()) as Record<string, SleeperPlayer>;
  const players = transformSleeper(raw);
  if (players.length < 50) throw new Error('Sleeper returned too few players');
  return players;
}

/** The offline fallback dataset shipped with the app. */
export const BUNDLED_PLAYERS = bundled as Player[];
