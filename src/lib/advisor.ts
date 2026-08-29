import { Player, Position, RankedPlayer, Settings } from '../types';
import { positionNeeds } from './roster';

export interface Suggestion {
  player: RankedPlayer;
  score: number;
  /** Human-readable explanation of why this pick is suggested. */
  reason: string;
  /** Players left in this player's position + tier (scarcity signal). */
  tierRemaining: number;
}

const NEED_WEIGHT = 16; // points added per unfilled starter at the position
const SCARCITY_BONUS = 12; // added when few players remain in the tier

/**
 * Recommend the best available picks by blending value (VOR), roster need, and
 * positional scarcity (how thin the player's tier is running).
 */
export function suggestPicks(
  available: RankedPlayer[],
  myRoster: Player[],
  settings: Settings,
  limit = 5
): Suggestion[] {
  const needs = positionNeeds(myRoster, settings);

  const suggestions: Suggestion[] = available.map((player) => {
    // How many available players share this player's position AND tier.
    const tierRemaining = available.filter(
      (p) => p.pos === player.pos && p.tier === player.tier
    ).length;

    const need = needs[player.pos] ?? 0;
    const needBonus = need * NEED_WEIGHT;
    const scarce = tierRemaining <= 3;
    const scarcityBonus = scarce ? SCARCITY_BONUS : 0;

    const score = player.vor + needBonus + scarcityBonus;

    const reason = buildReason(player, need, tierRemaining, scarce);

    return { player, score, reason, tierRemaining };
  });

  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

function buildReason(
  player: RankedPlayer,
  need: number,
  tierRemaining: number,
  scarce: boolean
): string {
  const parts: string[] = [];
  parts.push(`${player.vor >= 0 ? '+' : ''}${player.vor} VOR`);

  if (need >= 1) parts.push(`fills a ${player.pos} starter need`);
  else if (need > 0) parts.push(`${player.pos} flex depth`);

  if (scarce) {
    parts.push(
      tierRemaining <= 1
        ? `last ${player.pos} in tier ${player.tier}`
        : `only ${tierRemaining} ${player.pos}s left in tier ${player.tier}`
    );
  }

  return parts.join(' · ');
}
