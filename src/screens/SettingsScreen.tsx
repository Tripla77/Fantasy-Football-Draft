import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDraftStore } from '../store/draftStore';
import { Settings } from '../types';
import { colors } from '../theme';

const SCORING: { key: Settings['scoring']; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'half', label: 'Half PPR' },
  { key: 'ppr', label: 'Full PPR' },
];

type StarterKey = keyof Settings['starters'];
const STARTER_ROWS: { key: StarterKey; label: string }[] = [
  { key: 'QB', label: 'QB' },
  { key: 'RB', label: 'RB' },
  { key: 'WR', label: 'WR' },
  { key: 'TE', label: 'TE' },
  { key: 'FLEX', label: 'FLEX (RB/WR/TE)' },
  { key: 'K', label: 'K' },
  { key: 'DST', label: 'D/ST' },
];

export function SettingsScreen() {
  const settings = useDraftStore((s) => s.settings);
  const updateSettings = useDraftStore((s) => s.updateSettings);
  const resetDraft = useDraftStore((s) => s.resetDraft);

  const setStarter = (key: StarterKey, delta: number) => {
    const next = Math.max(0, settings.starters[key] + delta);
    updateSettings({ starters: { ...settings.starters, [key]: next } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Scoring</Text>
      <View style={styles.segment}>
        {SCORING.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => updateSettings({ scoring: s.key })}
            style={[styles.segItem, settings.scoring === s.key && styles.segItemActive]}
          >
            <Text
              style={[styles.segText, settings.scoring === s.key && styles.segTextActive]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>League size</Text>
      <Stepper
        label={`${settings.teams} teams`}
        onDec={() => updateSettings({ teams: Math.max(4, settings.teams - 1) })}
        onInc={() => updateSettings({ teams: Math.min(16, settings.teams + 1) })}
      />

      <Text style={styles.section}>Starting lineup</Text>
      {STARTER_ROWS.map((r) => (
        <Stepper
          key={r.key}
          label={r.label}
          value={settings.starters[r.key]}
          onDec={() => setStarter(r.key, -1)}
          onInc={() => setStarter(r.key, 1)}
        />
      ))}
      <Stepper
        label="Bench"
        value={settings.bench}
        onDec={() => updateSettings({ bench: Math.max(0, settings.bench - 1) })}
        onInc={() => updateSettings({ bench: settings.bench + 1 })}
      />

      <Text style={styles.note}>
        Changing scoring or league size recomputes replacement levels and VOR everywhere.
      </Text>

      <Pressable onPress={resetDraft} style={styles.reset}>
        <Text style={styles.resetText}>Reset draft (keep settings)</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value?: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepControls}>
        <Pressable onPress={onDec} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        {value !== undefined && <Text style={styles.stepValue}>{value}</Text>}
        <Pressable onPress={onInc} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 8 },
  section: {
    color: colors.textDim,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segItemActive: { backgroundColor: colors.accent },
  segText: { color: colors.textDim, fontWeight: '600' },
  segTextActive: { color: '#0b1220', fontWeight: '800' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  stepControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtnText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  stepValue: { color: colors.text, fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  note: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 8 },
  reset: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: { color: colors.danger, fontWeight: '700' },
});
