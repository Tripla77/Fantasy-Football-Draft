import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Position } from '../types';
import { positionColors } from '../theme';

interface Props {
  pos: Position;
  tier?: number;
}

/** Small colored badge showing a player's position (and optional tier). */
export function TierBadge({ pos, tier }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: positionColors[pos] }]}>
      <Text style={styles.text}>{tier ? `${pos} T${tier}` : pos}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#0b1220',
    fontWeight: '700',
    fontSize: 11,
  },
});
