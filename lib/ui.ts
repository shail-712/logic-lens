import { Platform } from 'react-native';

export const FONT_MONO = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const LABEL_STYLE = {
  letterSpacing: 2,
  fontSize: 11,
  textTransform: 'uppercase' as const,
  fontFamily: FONT_MONO,
} as const;

export const CTA_STYLE = {
  letterSpacing: 3,
  fontSize: 12,
  textTransform: 'uppercase' as const,
  fontFamily: FONT_MONO,
} as const;

