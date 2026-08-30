import { Position } from './types';

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
