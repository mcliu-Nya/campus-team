import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/options';
import { colors, spacing, typography } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.textFaint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="soft" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = '正在加载…' }: LoadingStateProps) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.description}>{label}</Text>
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <Ionicons name="cloud-offline-outline" size={26} color={colors.danger} />
      </View>
      <Text style={styles.title}>加载失败</Text>
      <Text style={styles.description}>{message}</Text>
      {onRetry ? (
        <Button label="重试" onPress={onRetry} variant="secondary" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  errorCircle: { backgroundColor: colors.dangerSoft, borderColor: '#FBC5C5' },
  title: { ...typography.h3, fontSize: 16, textAlign: 'center' },
  description: {
    ...typography.bodyMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
    lineHeight: 20,
  },
  action: { marginTop: spacing.lg },
});
