import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * 设计令牌：颜色 / 间距 / 圆角 / 阴影 / 文本样式。
 * 所有页面只引用这里的常量，避免散落的魔法值。
 */

export const colors = {
  primary: '#2F6FED',
  primaryDark: '#1D4ED8',
  primarySoft: '#EAF1FE',
  primaryBorder: '#C7D9FB',

  bg: '#F4F6FB',
  card: '#FFFFFF',
  cardMuted: '#F8FAFC',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textFaint: '#94A3B8',

  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  success: '#0E9F6E',
  successSoft: '#E6F7F0',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0EA5E9',
  infoSoft: '#E0F2FE',

  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
  default: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
});

export const sheetShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -4 },
  },
  android: { elevation: 12 },
  default: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -4 },
  },
});

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 26, lineHeight: 34, fontWeight: '700', color: colors.text },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.text },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  bodyMuted: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  caption: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  tiny: { fontSize: 11, lineHeight: 15, color: colors.textFaint },
};

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
