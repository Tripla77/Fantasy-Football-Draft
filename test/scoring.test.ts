import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustedProjection,
  replacementDepth,
  replacementPoints,
  rankPlayers,
} from '../src/lib/scoring';
import { DEFAULT_SETTINGS } from '../src/lib/roster';
import { Settings } from '../src/types';
import { makePlayer } from './helpers';

const standard: Settings = { ...DEFAULT_SETTINGS, scoring: 'standard' };
const half: Settings = { ...DEFAULT_SETTINGS, scoring: 'half' };
const ppr: Settings = { ...DEFAULT_SETTINGS, scoring: 'ppr' };

test('adjustedProjection leaves standard scoring untouched', () => {
  const wr = makePlayer({ id: 'wr', pos: 'WR', projection: 100 });
  assert.equal(adjustedProjection(wr, standard), 100);
});

test('adjustedProjection applies full and half PPR bumps to pass catchers', () => {
  const wr = makePlayer({ id: 'wr', pos: 'WR', projection: 100 });
  assert.equal(adjustedProjection(wr, ppr), 155); // +55
  assert.equal(adjustedProjection(wr, half), 127.5); // +27.5
});

test('adjustedProjection does not bump QB/K/DST', () => {
  const qb = makePlayer({ id: 'qb', pos: 'QB', projection: 300 });
  assert.equal(adjustedProjection(qb, ppr), 300);
});

test('replacementDepth spreads FLEX across RB/WR/TE for the default league', () => {
  // 10 teams, starters RB2/WR3/TE1/QB1/K1/DST1, FLEX1 -> flex pool = 10.
  const depth = replacementDepth(DEFAULT_SETTINGS);
  assert.deepEqual(depth, { QB: 10, RB: 25, WR: 34, TE: 11, K: 10, DST: 10 });
});

test('replacementPoints picks the projection at the replacement rank', () => {
  // 3 QBs, QB replacement depth = 10 -> falls back to the worst available.
  const players = [
    makePlayer({ id: 'q1', pos: 'QB', projection: 300 }),
    makePlayer({ id: 'q2', pos: 'QB', projection: 250 }),
    makePlayer({ id: 'q3', pos: 'QB', projection: 200 }),
  ];
  const rep = replacementPoints(players, standard);
  assert.equal(rep.QB, 200);
});

test('rankPlayers computes VOR over positional replacement and ranks by it', () => {
  const players = [
    makePlayer({ id: 'rb1', pos: 'RB', projection: 300 }),
    makePlayer({ id: 'rb2', pos: 'RB', projection: 200 }),
    makePlayer({ id: 'wr1', pos: 'WR', projection: 260 }),
  ];
  const ranked = rankPlayers(players, standard);
  const rb1 = ranked.find((p) => p.id === 'rb1')!;
  // Only one player per position here, so replacement == that player -> VOR 0
  // for the lone WR, and RB replacement is the worst RB (200).
  assert.equal(ranked.find((p) => p.id === 'wr1')!.vor, 0);
  assert.equal(rb1.vor, 100); // 300 - 200
  assert.equal(rb1.vorRank, 1); // highest VOR overall
});
