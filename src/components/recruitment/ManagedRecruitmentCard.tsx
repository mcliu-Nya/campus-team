import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIVITY_TYPE_MAP, STATUS_META } from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { formatRelative } from '@/lib/date';
import type { RecruitmentSummary } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { Button, type ButtonVariant } from '@/components/ui/Button';

export interface RecruitmentAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  onPress: () => void;
}

interface ManagedRecruitmentCardProps {
  item: RecruitmentSummary;
  roleLabel?: string;
  actions?: RecruitmentAction[];
  onPress?: () => void;
  footerHint?: string;
}

/** 我的招募 / 结束的招募共用卡片：状态 + 概要 + 操作按钮。 */
export function ManagedRecruitmentCard({
  item,
  roleLabel,
  actions = [],
  onPress,
  footerHint,
}: ManagedRecruitmentCardProps) {
  const statusMeta = STATUS_META[item.status];
  const typeMeta = ACTIVITY_TYPE_MAP[item.activityType];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, cardShadow, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.header}>
        <Badge label={statusMeta.label} color={statusMeta.color} background={statusMeta.background} />
        <View style={styles.typeTag}>
          <Ionicons name={typeMeta.icon} size={12} color={colors.textMuted} />
          <Text style={styles.typeText}>{typeMeta.label}</Text>
        </View>
        {roleLabel ? (
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        ) : null}
        <View style={styles.spacer} />
        <Text style={styles.time}>{formatRelative(item.updatedAt)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta} numberOfLines={1}>
          {item.college}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>
          已加入 {item.joinedCount}/{item.neededCount}
        </Text>
      </View>

      {footerHint ? <Text style={styles.hint}>{footerHint}</Text> : null}

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              icon={action.icon}
              variant={action.variant ?? 'secondary'}
              size="sm"
              onPress={action.onPress}
              style={styles.actionButton}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  typeText: { ...typography.tiny },
  roleTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 11, color: colors.primaryDark, fontWeight: '600' },
  spacer: { flex: 1 },
  time: { ...typography.tiny },
  title: { ...typography.h3, fontSize: 16, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  meta: { ...typography.caption },
  dot: { ...typography.caption, color: colors.textFaint },
  hint: { ...typography.caption, color: colors.textFaint, marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionButton: { flexGrow: 1 },
});
