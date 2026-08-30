import { Position } from './types';

/**
 * Bottom padding for scrollable screen content: just enough to lift the last
 * item clear of the floating tab bar (~70px tall, ~10px off the bottom) with a
 * small gap — no more, so the list runs down close to the bottom edge rather
 * than leaving a dead gap above the bar.
 */
export const tabBarInset = 88;

export const colors = {
  bg: '#0b1220',
  surface: '#141d30',
  surfaceAlt: '#1c2841',
  border: '#28344f',
  text: '#e8edf7',
  textDim: '#93a1bd',
  accent: '#37d67a',
  accentDim: '#1f6d43',
  danger: '#ef5b6b',
  warning: '#f0a94c',
};

/** Position accent colors (colorblind-friendly, distinct hues). */
export const positionColors: Record<Position, string> = {
  QB: '#e06c9f',
  RB: '#4cc9a4',
  WR: '#4c9ff0',
  TE: '#f0a94c',
  K: '#9d8df0',
  DST: '#8a97ad',
};
