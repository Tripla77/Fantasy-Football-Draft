import { Player, Position, RosterSlot, Settings, SlotType } from '../types';

/** Default league configuration: Standard scoring, 10-team. */
export const DEFAULT_SETTINGS: Settings = {
  scoring: 'standard',
  teams: 10,
  starters: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1 },
  bench: 6,
};

const FLEX_ACCEPTS: Position[] = ['RB', 'WR', 'TE'];

/** Build the ordered list of roster slots from settings. */
export function buildRosterSlots(settings: Settings): RosterSlot[] {
  const slots: RosterSlot[] = [];
  const push = (type: SlotType, count: number, accepts: Position[]) => {
    for (let i = 0; i < count; i++) slots.push({ type, accepts });
  };
  push('QB', settings.starters.QB, ['QB']);
  push('RB', settings.starters.RB, ['RB']);
  push('WR', settings.starters.WR, ['WR']);
  push('TE', settings.starters.TE, ['TE']);
  push('FLEX', settings.starters.FLEX, FLEX_ACCEPTS);
  push('K', settings.starters.K, ['K']);
  push('DST', settings.starters.DST, ['DST']);
  push('BENCH', settings.bench, ['QB', 'RB', 'WR', 'TE', 'K', 'DST']);
  return slots;
}

/** A slot paired with the player assigned to it (if any). */
export interface FilledSlot extends RosterSlot {
  index: number;
  player: Player | null;
}

/**
 * Assign drafted players to roster slots greedily: fill dedicated starter slots
 * first (best player by rank), then FLEX, then bench. Returns every slot in order.
 */
export function fillRoster(players: Player[], settings: Settings): FilledSlot[] {
  const slots = buildRosterSlots(settings).map((s, index) => ({
    ...s,
    index,
    player: null as Player | null,
  }));

  // Best players first so premium slots get premium players.
  const pool = [...players].sort((a, b) => a.rank - b.rank);
  const assigned = new Set<string>();

  // Two passes over slot priority: dedicated position slots, then FLEX/BENCH.
  const priority: SlotType[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'BENCH'];
  for (const slotType of priority) {
    for (const slot of slots) {
      if (slot.type !== slotType || slot.player) continue;
      const pick = pool.find(
        (p) => !assigned.has(p.id) && slot.accepts.includes(p.pos)
      );
      if (pick) {
        slot.player = pick;
        assigned.add(pick.id);
      }
    }
  }
  return slots;
}

/** Count how many of each position are still needed to fill required starters. */
export function positionNeeds(
  players: Player[],
  settings: Settings
): Record<Position, number> {
  const filled = fillRoster(players, settings);
  const needs: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };

  for (const slot of filled) {
    if (slot.type === 'BENCH' || slot.player) continue;
    // Unfilled starter slot — attribute the need to its eligible positions.
    if (slot.type === 'FLEX') {
      // FLEX need is spread; count it toward RB/WR (most common flex fills).
      needs.RB += 0.5;
      needs.WR += 0.5;
    } else {
      needs[slot.type as Position] += 1;
    }
  }
  return needs;
}
