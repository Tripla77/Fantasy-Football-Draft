import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Position } from '../types';
import { colors, positionColors } from '../theme';

export type PositionFilterValue = Position | 'ALL' | 'FLEX';

const OPTIONS: PositionFilterValue[] = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];

interface Props {
  value: PositionFilterValue;
  onChange: (v: PositionFilterValue) => void;
}

/** Horizontal chip row for filtering by position. */
export function PositionFilter({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt;
        const tint =
          opt === 'ALL' || opt === 'FLEX' ? colors.accent : positionColors[opt as Position];
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.chip,
              active && { backgroundColor: tint, borderColor: tint },
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.textDim,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#0b1220',
  },
});
