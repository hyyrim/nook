import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: Record<string, TextStyle> = {
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 6,
    marginLeft: 8,
    marginBottom: 4,
  },
} as const;
