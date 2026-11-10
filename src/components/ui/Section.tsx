import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';

interface SectionProps {
  title: string;
  icon?: IconName;
  children: ReactNode;
  action?: ReactNode;
  muted?: boolean;
}

/** 详情页信息分组卡片。 */
export function Section({ title, icon, children, action, muted = false }: SectionProps) {
  return (
    <View style={[styles.card, muted ? null : cardShadow]}>
      <View style={styles.header}>
        {icon ? <Ionicons name={icon} size={15} color={colors.primaryDark} /> : null}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  title: { ...typography.body, fontWeight: '600', fontSize: 14 },
  spacer: { flex: 1 },
  body: { gap: spacing.sm },
});
