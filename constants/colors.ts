export const COLORS = {
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
} as const;

export type ColorName = keyof typeof COLORS;

