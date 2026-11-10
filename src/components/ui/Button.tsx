import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { IconName } from '@/constants/options';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<
  ButtonVariant,
  { background: string; border: string; text: string; spinner: string }
> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.white,
    spinner: colors.white,
  },
  secondary: {
    background: colors.card,
    border: colors.borderStrong,
    text: colors.text,
    spinner: colors.primary,
  },
  soft: {
    background: colors.primarySoft,
    border: colors.primaryBorder,
    text: colors.primaryDark,
    spinner: colors.primaryDark,
  },
  danger: {
    background: colors.danger,
    border: colors.danger,
    text: colors.white,
    spinner: colors.white,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    text: colors.textSecondary,
    spinner: colors.textSecondary,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const isDisabled = disabled || loading;
  const compact = size === 'sm';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          paddingVertical: compact ? spacing.sm : spacing.md,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.spinner} />
      ) : icon ? (
        <Ionicons name={icon} size={compact ? 15 : 17} color={palette.text} />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: palette.text, fontSize: compact ? 13 : 15 },
          icon && !loading ? styles.labelWithIcon : null,
        ]}
        numberOfLines={1}
        // 窄屏 / 大字号时自动缩小而不是被裁掉
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
  },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  labelWithIcon: { marginLeft: spacing.xs + 2 },
});
