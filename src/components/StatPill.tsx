import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  value: string | number;
  tone?: 'default' | 'positive' | 'negative';
}

/** Compact label/value stat pill used across screens. */
export function StatPill({ label, value, tone = 'default' }: Props) {
  const valueColor =
    tone === 'positive' ? colors.accent : tone === 'negative' ? colors.danger : colors.text;
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  label: {
    color: colors.textDim,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
});
