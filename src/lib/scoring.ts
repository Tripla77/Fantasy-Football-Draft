import { Player, Position, RankedPlayer, Settings } from '../types';

/**
 * Approximate scoring adjustment. Seed projections are STANDARD (no PPR). For
 * half/full PPR we bump pass-catching positions by a rough per-position factor,
 * since the seed data doesn't carry reception counts. Editable seed data can
 * later include true PPR projections to make this exact.
 */
const PPR_BUMP: Record<Position, number> = { QB: 0, RB: 28, WR: 55, TE: 42, K: 0, DST: 0 };

export function adjustedProjection(player: Player, settings: Settings): number {
  const factor = settings.scoring === 'ppr' ? 1 : settings.scoring === 'half' ? 0.5 : 0;
  return player.projection + PPR_BUMP[player.pos] * factor;
}

/**
 * How many players at each position are "startable" across the whole league —
 * i.e. the replacement rank. Includes an approximate FLEX distribution.
 */
export function replacementDepth(settings: Settings): Record<Position, number> {
  const t = settings.teams;
  const flex = settings.starters.FLEX * t;
  return {
    QB: settings.starters.QB * t,
    // FLEX historically fills ~50% RB, ~40% WR, ~10% TE.
    RB: settings.starters.RB * t + Math.round(flex * 0.5),
    WR: settings.starters.WR * t + Math.round(flex * 0.4),
    TE: settings.starters.TE * t + Math.round(flex * 0.1),
    K: settings.starters.K * t,
    DST: settings.starters.DST * t,
  };
}

/** Projection of the replacement-level player at each position. */
export function replacementPoints(
  players: Player[],
  settings: Settings
): Record<Position, number> {
  const depth = replacementDepth(settings);
  const result = {} as Record<Position, number>;
  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

  for (const pos of positions) {
    const ranked = players
      .filter((p) => p.pos === pos)
      .map((p) => adjustedProjection(p, settings))
      .sort((a, b) => b - a);
    const idx = Math.min(depth[pos], ranked.length) - 1;
    result[pos] = idx >= 0 && ranked.length > 0 ? ranked[Math.max(0, idx)] : 0;
  }
  return result;
}

/**
 * Enrich every player with VOR (value over replacement) and an overall VOR rank.
 * VOR = adjusted projection − positional replacement baseline.
 */
export function rankPlayers(players: Player[], settings: Settings): RankedPlayer[] {
  const replacement = replacementPoints(players, settings);
  const ranked: RankedPlayer[] = players.map((p) => ({
    ...p,
    vor: Math.round(adjustedProjection(p, settings) - replacement[p.pos]),
    vorRank: 0,
  }));

  ranked
    .slice()
    .sort((a, b) => b.vor - a.vor)
    .forEach((p, i) => {
      p.vorRank = i + 1;
    });

  return ranked;
}
