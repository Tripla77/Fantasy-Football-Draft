import React, { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DraftBoardScreen } from './src/screens/DraftBoardScreen';
import { TiersScreen } from './src/screens/TiersScreen';
import { MyTeamScreen } from './src/screens/MyTeamScreen';
import { AdvisorScreen } from './src/screens/AdvisorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useDraftStore } from './src/store/draftStore';
import { colors } from './src/theme';

type TabKey = 'board' | 'tiers' | 'team' | 'advisor' | 'settings';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'board', label: 'Board', icon: '📋' },
  { key: 'tiers', label: 'Tiers', icon: '📊' },
  { key: 'advisor', label: 'Advisor', icon: '🎯' },
  { key: 'team', label: 'My Team', icon: '🏈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const TITLES: Record<TabKey, string> = {
  board: 'Draft Board',
  tiers: 'Tiers & Scarcity',
  advisor: 'Pick Advisor',
  team: 'My Team',
  settings: 'Settings',
};

export default function App() {
  const [tab, setTab] = useState<TabKey>('board');
  const hydrate = useDraftStore((s) => s.hydrate);
  const hydrated = useDraftStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // On web, pad the header and tab bar by the device safe-area insets so the
  // nav clears the status bar and home indicator when installed as a PWA.
  // (Relies on viewport-fit=cover, set on the web build's viewport meta.)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent =
      '#app-header{padding-top:calc(14px + env(safe-area-inset-top,0px))}' +
      '#app-tabbar{padding-bottom:calc(6px + env(safe-area-inset-bottom,0px))}';
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View nativeID="app-header" style={styles.header}>
        <Text style={styles.brand}>🏈 Draft HQ</Text>
        <Text style={styles.title}>{TITLES[tab]}</Text>
      </View>

      <View style={styles.body}>
        {!hydrated ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading your draft…</Text>
          </View>
        ) : (
          <>
            {tab === 'board' && <DraftBoardScreen />}
            {tab === 'tiers' && <TiersScreen />}
            {tab === 'advisor' && <AdvisorScreen />}
            {tab === 'team' && <MyTeamScreen />}
            {tab === 'settings' && <SettingsScreen />}
          </>
        )}
      </View>

      <View nativeID="app-tabbar" style={styles.tabbar}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
            <Text style={[styles.tabIcon, tab === t.key && styles.tabActive]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brand: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  title: { color: colors.text, fontWeight: '700', fontSize: 20 },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textDim },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  tabActive: { color: colors.accent, opacity: 1 },
});
