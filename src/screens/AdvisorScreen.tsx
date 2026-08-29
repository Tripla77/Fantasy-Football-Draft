import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TierBadge } from '../components/TierBadge';
import { StatPill } from '../components/StatPill';
import { useDraftStore } from '../store/draftStore';
import { suggestPicks } from '../lib/advisor';
import { colors } from '../theme';

export function AdvisorScreen() {
  const availableRanked = useDraftStore((s) => s.availableRanked);
  const myRoster = useDraftStore((s) => s.myRoster);
  const settings = useDraftStore((s) => s.settings);
  const draftedIds = useDraftStore((s) => s.draftedIds);
  const myRosterIds = useDraftStore((s) => s.myRosterIds);
  const draftToMyTeam = useDraftStore((s) => s.draftToMyTeam);

  const suggestions = useMemo(
    () => suggestPicks(availableRanked(), myRoster(), settings, 8),
    [draftedIds, myRosterIds, settings, availableRanked, myRoster]
  );

  const top = suggestions[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Best value on the board right now — blends value over replacement, your roster
        needs, and how thin each position is running.
      </Text>

      {top && (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>TOP PICK</Text>
          <Text style={styles.heroName}>{top.player.name}</Text>
          <View style={styles.heroMeta}>
            <TierBadge pos={top.player.pos} tier={top.player.tier} />
            <Text style={styles.heroTeam}>{top.player.team}</Text>
          </View>
          <Text style={styles.heroReason}>{top.reason}</Text>
          <View style={styles.heroStats}>
            <StatPill label="VOR" value={`${top.player.vor >= 0 ? '+' : ''}${top.player.vor}`} tone="positive" />
            <StatPill label="Proj" value={top.player.projection} />
            <StatPill label="ADP" value={top.player.adp.toFixed(1)} />
          </View>
          <Pressable onPress={() => draftToMyTeam(top.player.id)} style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Draft to my team</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Next best</Text>
      {suggestions.slice(1).map((s, i) => (
        <View key={s.player.id} style={styles.row}>
          <Text style={styles.rowNum}>{i + 2}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{s.player.name}</Text>
            <Text style={styles.rowReason}>{s.reason}</Text>
          </View>
          <Pressable onPress={() => draftToMyTeam(s.player.id)} style={styles.rowBtn}>
            <Text style={styles.rowBtnText}>Mine</Text>
          </Pressable>
        </View>
      ))}

      {!top && <Text style={styles.empty}>No players available — reset the draft in Settings.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12 },
  intro: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentDim,
    padding: 16,
    gap: 8,
  },
  heroLabel: { color: colors.accent, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  heroName: { color: colors.text, fontWeight: '800', fontSize: 24 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTeam: { color: colors.textDim, fontSize: 13 },
  heroReason: { color: colors.text, fontSize: 14, lineHeight: 20 },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  heroBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  heroBtnText: { color: '#0b1220', fontWeight: '800', fontSize: 15 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 10,
  },
  rowNum: { color: colors.textDim, fontWeight: '800', width: 20, textAlign: 'center' },
  rowName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  rowReason: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  rowBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBtnText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 30 },
});
