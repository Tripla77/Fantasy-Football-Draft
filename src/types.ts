export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export interface Player {
  id: string;
  name: string;
  pos: Position;
  team: string;
  /** Overall preseason rank (1 = best). */
  rank: number;
  /** Average draft position. */
  adp: number;
  /** Projected season fantasy points (standard scoring). */
  projection: number;
  /** Tier within the player's position (1 = elite). */
  tier: number;
}

/** A player enriched with computed value metrics. */
export interface RankedPlayer extends Player {
  /** Value over replacement: projection minus the positional replacement baseline. */
  vor: number;
  /** Overall rank by VOR across all positions (1 = most valuable). */
  vorRank: number;
}

/** Roster slot definitions. FLEX accepts RB/WR/TE. */
export type SlotType = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'DST' | 'BENCH';

export interface RosterSlot {
  type: SlotType;
  /** Positions eligible for this slot. */
  accepts: Position[];
}

export interface Settings {
  /** Scoring format. Standard = no PPR. */
  scoring: 'standard' | 'half' | 'ppr';
  /** Number of teams in the league. */
  teams: number;
  /** Starting-lineup slot counts (excludes bench). */
  starters: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DST: number;
  };
  /** Bench spots. */
  bench: number;
}
