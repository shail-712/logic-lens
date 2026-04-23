import { Platform } from 'react-native';

export const Colors = {
  bgPrimary: '#0D0D0D',
  bgSecondary: '#141414',
  bgTertiary: '#1A1A1A',
  accent: '#CCFF00',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#444444',
  border: '#222222',
  success: '#CCFF00',
  warning: '#FF6B35',
  error: '#FF4444',
  cardBorder: '#2A2A2A',
} as const;

export const Typography = {
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  labelSize: 11,
  labelSpacing: 2,
  ctaSize: 12,
  ctaSpacing: 3,
} as const;
