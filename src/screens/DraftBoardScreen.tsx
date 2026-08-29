import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlayerRow } from '../components/PlayerRow';
import { PositionFilter, PositionFilterValue } from '../components/PositionFilter';
import { useDraftStore } from '../store/draftStore';
import { RankedPlayer } from '../types';
import { colors } from '../theme';

type SortKey = 'rank' | 'vor' | 'adp';
const FLEX_POS = ['RB', 'WR', 'TE'];

export function DraftBoardScreen() {
  const allRanked = useDraftStore((s) => s.allRanked);
  const settings = useDraftStore((s) => s.settings);
  const rawPlayers = useDraftStore((s) => s.players);
  const draftedIds = useDraftStore((s) => s.draftedIds);
  const draftPlayer = useDraftStore((s) => s.draftPlayer);
  const draftToMyTeam = useDraftStore((s) => s.draftToMyTeam);
  const undraftPlayer = useDraftStore((s) => s.undraftPlayer);
  const dataSource = useDraftStore((s) => s.dataSource);
  const dataLoading = useDraftStore((s) => s.dataLoading);

  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<PositionFilterValue>('ALL');
  const [sort, setSort] = useState<SortKey>('rank');
  const [hideDrafted, setHideDrafted] = useState(false);

  const drafted = useMemo(() => new Set(draftedIds), [draftedIds]);

  // Recompute ranked list when settings or the underlying dataset change.
  const players = useMemo(() => allRanked(), [settings, rawPlayers, allRanked]);

  const rows = useMemo(() => {
    let list: RankedPlayer[] = players;
    if (pos === 'FLEX') list = list.filter((p) => FLEX_POS.includes(p.pos));
    else if (pos !== 'ALL') list = list.filter((p) => p.pos === pos);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }
    if (hideDrafted) list = list.filter((p) => !drafted.has(p.id));

    const sorted = [...list].sort((a, b) => {
      if (sort === 'vor') return b.vor - a.vor;
      if (sort === 'adp') return a.adp - b.adp;
      return a.rank - b.rank;
    });
    return sorted;
  }, [players, pos, query, sort, hideDrafted, drafted]);

  const remaining = players.length - drafted.size;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search player or team…"
          placeholderTextColor={colors.textDim}
          style={styles.search}
        />
        <PositionFilter value={pos} onChange={setPos} />
        <View style={styles.controls}>
          <SortTabs sort={sort} onChange={setSort} />
          <Pressable
            onPress={() => setHideDrafted((v) => !v)}
            style={[styles.toggle, hideDrafted && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, hideDrafted && styles.toggleTextActive]}>
              {hideDrafted ? 'Hiding drafted' : 'Showing all'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.count}>
          {remaining} available · {drafted.size} off the board ·{' '}
          {dataLoading ? 'syncing live…' : dataSource === 'live' ? 'live data' : 'offline data'}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PlayerRow
            player={item}
            drafted={drafted.has(item.id)}
            onDraft={() => draftPlayer(item.id)}
            onDraftMine={() => draftToMyTeam(item.id)}
            onUndraft={() => undraftPlayer(item.id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No players match your filters.</Text>}
      />
    </View>
  );
}

function SortTabs({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  const opts: { key: SortKey; label: string }[] = [
    { key: 'rank', label: 'Rank' },
    { key: 'vor', label: 'VOR' },
    { key: 'adp', label: 'ADP' },
  ];
  return (
    <View style={styles.sortRow}>
      {opts.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.sortTab, sort === o.key && styles.sortTabActive]}
        >
          <Text style={[styles.sortText, sort === o.key && styles.sortTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  sortText: { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  sortTextActive: { color: '#0b1220' },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: { borderColor: colors.accent },
  toggleText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: colors.accent },
  count: { color: colors.textDim, fontSize: 12 },
  list: { padding: 14, gap: 8 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
