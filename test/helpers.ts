import { Player, Position } from '../src/types';

/** Build a Player fixture; only the fields a test cares about need overriding. */
export function makePlayer(over: Partial<Player> & { id: string; pos: Position }): Player {
  return {
    name: over.id,
    team: 'FA',
    rank: 1,
    adp: 1,
    projection: 0,
    tier: 1,
    injury: null,
    ...over,
  };
}
