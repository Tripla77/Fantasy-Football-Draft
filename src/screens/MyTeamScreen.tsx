import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatPill } from '../components/StatPill';
import { TierBadge } from '../components/TierBadge';
import { useDraftStore } from '../store/draftStore';
import { fillRoster, positionNeeds } from '../lib/roster';
import { adjustedProjection } from '../lib/scoring';
import { Position } from '../types';
import { colors, tabBarInset } from '../theme';

const SLOT_LABELS: Record<string, string> = {
  QB: 'QB',
  RB: 'RB',
  WR: 'WR',
  TE: 'TE',
  FLEX: 'FLEX',
  K: 'K',
  DST: 'D/ST',
  BENCH: 'BE',
};

export function MyTeamScreen() {
  const myRoster = useDraftStore((s) => s.myRoster);
  const settings = useDraftStore((s) => s.settings);
  const rawPlayers = useDraftStore((s) => s.players);
  const myRosterIds = useDraftStore((s) => s.myRosterIds);
  const undraftPlayer = useDraftStore((s) => s.undraftPlayer);

  const roster = useMemo(() => myRoster(), [myRosterIds, rawPlayers, myRoster]);
  const slots = useMemo(() => fillRoster(roster, settings), [roster, settings]);
  const needs = useMemo(() => positionNeeds(roster, settings), [roster, settings]);

  const totalProj = roster.reduce((sum, p) => sum + adjustedProjection(p, settings), 0);
  const starterSlots = slots.filter((s) => s.type !== 'BENCH');
  const startersFilled = starterSlots.filter((s) => s.player).length;

  const neededPositions = (Object.entries(needs) as [Position, number][])
    .filter(([, n]) => n >= 1)
    .map(([p]) => p);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summary}>
        <StatPill label="Players" value={roster.length} />
        <StatPill label="Starters" value={`${startersFilled}/${starterSlots.length}`} />
        <StatPill label="Proj pts" value={Math.round(totalProj)} tone="positive" />
      </View>

      <View style={styles.needsBox}>
        <Text style={styles.needsTitle}>Still need:</Text>
        {neededPositions.length ? (
          <View style={styles.needsRow}>
            {neededPositions.map((p) => (
              <TierBadge key={p} pos={p} />
            ))}
          </View>
        ) : (
          <Text style={styles.needsDone}>Starting lineup is full ✓</Text>
        )}
      </View>

      {slots.map((slot) => (
        <View key={slot.index} style={styles.slot}>
          <View style={styles.slotTag}>
            <Text style={styles.slotTagText}>{SLOT_LABELS[slot.type]}</Text>
          </View>
          {slot.player ? (
            <View style={styles.slotPlayer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotName}>{slot.player.name}</Text>
                <Text style={styles.slotMeta}>
                  {slot.player.pos} · {slot.player.team} · {slot.player.projection} pts
                </Text>
              </View>
              <Pressable
                onPress={() => undraftPlayer(slot.player!.id)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Drop</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptySlot}>— empty —</Text>
          )}
        </View>
      ))}

      <Text style={styles.hint}>
        Draft players to your team with the “Mine” button on the Board or by tapping a
        player in Tiers. Drop returns them to the pool.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 10, paddingBottom: tabBarInset },
  summary: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  needsBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  needsTitle: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  needsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  needsDone: { color: colors.accent, fontWeight: '700' },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 10,
  },
  slotTag: {
    width: 52,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 8,
  },
  slotTagText: { color: colors.textDim, fontWeight: '800', fontSize: 12 },
  slotPlayer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  slotName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  slotMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  emptySlot: { color: colors.textDim, fontStyle: 'italic' },
  removeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
