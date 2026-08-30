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

  // On web, give the nav an iOS-26-style "liquid glass" tab bar: a floating,
  // translucent, blurred capsule that the content scrolls underneath. Also pad
  // the header and tab bar by the device safe-area insets so they clear the
  // status bar and home indicator when installed as a PWA. (Relies on
  // viewport-fit=cover, set on the web build's viewport meta.)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent =
      '#app-header{padding-top:calc(14px + env(safe-area-inset-top,0px))}' +
      '#app-tabbar{' +
      // Float just above the home indicator. The safe-area inset (~34px in an
      // installed PWA) overshoots the indicator's actual height, so trim a
      // fixed amount off it to hug close to the bottom. A browser reports ~0,
      // so max() keeps a small 6px float there.
      'bottom:max(6px,calc(env(safe-area-inset-bottom) - 24px));' +
      'padding-bottom:8px;' +
      'background:linear-gradient(180deg,rgba(31,43,68,0.78),rgba(15,22,38,0.70));' +
      'backdrop-filter:blur(22px) saturate(160%);' +
      '-webkit-backdrop-filter:blur(22px) saturate(160%);' +
      'border:1px solid rgba(255,255,255,0.12);' +
      'box-shadow:0 12px 34px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.14);' +
      '}';
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
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative', // containing block for the absolute tab bar
    // On web, SafeAreaView already applies env(safe-area-inset-*) padding on
    // every side; zero it here so the header/tab-bar insets we add in CSS are
    // the single source (otherwise the top inset is applied twice). Native
    // keeps SafeAreaView's insets.
    ...Platform.select({
      web: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
      default: {},
    }),
  },
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
  // iOS-26-style "liquid glass": a floating, rounded, translucent capsule the
  // content scrolls under. The web build layers on a real backdrop blur (see
  // the injected #app-tabbar CSS); native keeps the translucent fill + shadow.
  tabbar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,29,48,0.82)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  tabActive: { color: colors.accent, opacity: 1 },
});
