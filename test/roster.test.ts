import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRosterSlots, fillRoster, DEFAULT_SETTINGS } from '../src/lib/roster';
import { makePlayer } from './helpers';

test('buildRosterSlots emits starters in order then bench', () => {
  const slots = buildRosterSlots(DEFAULT_SETTINGS);
  // 1 QB + 2 RB + 3 WR + 1 TE + 1 FLEX + 1 K + 1 DST + 6 bench = 16
  assert.equal(slots.length, 16);
  assert.deepEqual(
    slots.map((s) => s.type),
    ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST',
     'BENCH', 'BENCH', 'BENCH', 'BENCH', 'BENCH', 'BENCH']
  );
  const flex = slots.find((s) => s.type === 'FLEX')!;
  assert.deepEqual(flex.accepts, ['RB', 'WR', 'TE']);
});

test('fillRoster fills dedicated starter slots by rank before FLEX and bench', () => {
  const players = [
    makePlayer({ id: 'rb1', pos: 'RB', rank: 1 }),
    makePlayer({ id: 'rb2', pos: 'RB', rank: 2 }),
    makePlayer({ id: 'rb3', pos: 'RB', rank: 3 }), // overflow -> FLEX (best leftover RB/WR/TE)
    makePlayer({ id: 'qb1', pos: 'QB', rank: 5 }),
  ];
  const filled = fillRoster(players, DEFAULT_SETTINGS);
  const byType = (t: string) =>
    filled.filter((s) => s.type === t).map((s) => s.player?.id ?? null);

  assert.deepEqual(byType('RB'), ['rb1', 'rb2']); // two best RBs in RB slots
  assert.deepEqual(byType('QB'), ['qb1']);
  assert.equal(filled.find((s) => s.type === 'FLEX')!.player?.id, 'rb3'); // leftover to FLEX
});

test('fillRoster leaves slots empty when no eligible player exists', () => {
  const filled = fillRoster([makePlayer({ id: 'k1', pos: 'K', rank: 1 })], DEFAULT_SETTINGS);
  assert.equal(filled.find((s) => s.type === 'K')!.player?.id, 'k1');
  assert.equal(filled.find((s) => s.type === 'QB')!.player, null);
});
