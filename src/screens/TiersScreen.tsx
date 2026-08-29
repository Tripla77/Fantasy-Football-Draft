import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PositionFilter, PositionFilterValue } from '../components/PositionFilter';
import { StatPill } from '../components/StatPill';
import { useDraftStore } from '../store/draftStore';
import { Position, RankedPlayer } from '../types';
import { colors, positionColors } from '../theme';

const FLEX_POS: Position[] = ['RB', 'WR', 'TE'];

export function TiersScreen() {
  const availableRanked = useDraftStore((s) => s.availableRanked);
  const settings = useDraftStore((s) => s.settings);
  const rawPlayers = useDraftStore((s) => s.players);
  const draftedIds = useDraftStore((s) => s.draftedIds);
  const draftToMyTeam = useDraftStore((s) => s.draftToMyTeam);

  const [pos, setPos] = useState<PositionFilterValue>('RB');

  const available = useMemo(
    () => availableRanked(),
    [settings, rawPlayers, draftedIds, availableRanked]
  );

  const positions: Position[] =
    pos === 'ALL'
      ? ['QB', 'RB', 'WR', 'TE', 'K', 'DST']
      : pos === 'FLEX'
      ? FLEX_POS
      : [pos as Position];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Tiers group similar players. When a tier is nearly empty, the drop-off to the next
        tier is steep — that's when to prioritize the position.
      </Text>
      <PositionFilter value={pos} onChange={setPos} />

      {positions.map((p) => (
        <PositionTiers
          key={p}
          pos={p}
          players={available.filter((pl) => pl.pos === p)}
          onDraftMine={draftToMyTeam}
        />
      ))}
    </ScrollView>
  );
}

function PositionTiers({
  pos,
  players,
  onDraftMine,
}: {
  pos: Position;
  players: RankedPlayer[];
  onDraftMine: (id: string) => void;
}) {
  const byTier = useMemo(() => {
    const map = new Map<number, RankedPlayer[]>();
    for (const p of players) {
      const arr = map.get(p.tier) ?? [];
      arr.push(p);
      map.set(p.tier, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [players]);

  return (
    <View style={styles.posBlock}>
      <View style={styles.posHeader}>
        <View style={[styles.posDot, { backgroundColor: positionColors[pos] }]} />
        <Text style={styles.posTitle}>{pos}</Text>
        <Text style={styles.posCount}>{players.length} available</Text>
      </View>

      {byTier.length === 0 && <Text style={styles.none}>None left.</Text>}

      {byTier.map(([tier, group]) => {
        const scarce = group.length <= 2;
        return (
          <View key={tier} style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierLabel}>Tier {tier}</Text>
              <StatPill
                label="left"
                value={group.length}
                tone={scarce ? 'negative' : 'default'}
              />
            </View>
            {group.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => onDraftMine(p.id)}
                style={styles.tierPlayer}
              >
                <Text style={styles.tierPlayerName}>{p.name}</Text>
                <Text style={styles.tierPlayerMeta}>
                  {p.team} · {p.vor >= 0 ? '+' : ''}
                  {p.vor} VOR
                </Text>
              </Pressable>
            ))}
            {scarce && (
              <Text style={styles.scarceNote}>
                ⚠ Scarce — grabbing one now beats reaching next tier.
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12 },
  intro: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  posBlock: { gap: 8 },
  posHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  posDot: { width: 12, height: 12, borderRadius: 6 },
  posTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  posCount: { color: colors.textDim, fontSize: 12, marginLeft: 'auto' },
  none: { color: colors.textDim, fontStyle: 'italic' },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
  tierPlayer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tierPlayerName: { color: colors.text, fontSize: 14 },
  tierPlayerMeta: { color: colors.textDim, fontSize: 12 },
  scarceNote: { color: colors.warning, fontSize: 12, marginTop: 2 },
});
