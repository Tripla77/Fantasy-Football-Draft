import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RankedPlayer } from '../types';
import { colors } from '../theme';
import { TierBadge } from './TierBadge';

interface Props {
  player: RankedPlayer;
  drafted?: boolean;
  onDraft?: () => void;
  onDraftMine?: () => void;
  onUndraft?: () => void;
}

/** A single player line for the draft board: identity, value, and actions. */
export function PlayerRow({ player, drafted, onDraft, onDraftMine, onUndraft }: Props) {
  return (
    <View style={[styles.row, drafted && styles.rowDrafted]}>
      <View style={styles.rankCol}>
        <Text style={styles.rank}>{player.rank}</Text>
        <Text style={styles.vorRank}>#{player.vorRank}</Text>
      </View>

      <View style={styles.main}>
        <Text style={[styles.name, drafted && styles.dim]} numberOfLines={1}>
          {player.name}
        </Text>
        <View style={styles.metaRow}>
          <TierBadge pos={player.pos} tier={player.tier} />
          <Text style={styles.meta}>{player.team}</Text>
          <Text style={styles.meta}>ADP {player.adp.toFixed(1)}</Text>
        </View>
        {player.injury ? (
          <View style={styles.injuryRow}>
            <Text style={styles.injuryBadge} numberOfLines={1}>
              {player.injury}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.valueCol}>
        <Text style={[styles.vor, player.vor >= 0 ? styles.pos : styles.neg]}>
          {player.vor >= 0 ? '+' : ''}
          {player.vor}
        </Text>
        <Text style={styles.proj}>{player.projection} pts</Text>
      </View>

      <View style={styles.actions}>
        {drafted ? (
          <Pressable onPress={onUndraft} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>Undo</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={onDraftMine} style={[styles.btn, styles.btnMine]}>
              <Text style={styles.btnMineText}>Mine</Text>
            </Pressable>
            <Pressable onPress={onDraft} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Gone</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDrafted: {
    opacity: 0.5,
  },
  rankCol: {
    width: 38,
    alignItems: 'center',
  },
  rank: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  vorRank: {
    color: colors.textDim,
    fontSize: 10,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  dim: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
  },
  // Injury status on its own line under the meta, as a compact chip, so a long
  // label like "Questionable" can't overflow the name column into the values.
  injuryRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  injuryBadge: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    backgroundColor: 'rgba(240,169,76,0.14)',
    borderColor: 'rgba(240,169,76,0.35)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  valueCol: {
    alignItems: 'flex-end',
    width: 62,
  },
  vor: {
    fontWeight: '800',
    fontSize: 15,
  },
  pos: { color: colors.accent },
  neg: { color: colors.danger },
  proj: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  btnMine: {
    backgroundColor: colors.accent,
  },
  btnMineText: {
    color: '#0b1220',
    fontWeight: '700',
    fontSize: 12,
  },
  btnGhost: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: {
    color: colors.textDim,
    fontWeight: '600',
    fontSize: 12,
  },
});
