import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIVITY_TYPE_MAP, STATUS_META } from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { formatRelative } from '@/lib/date';
import type { RecruitmentSummary } from '@/types/models';
import { Badge } from '@/components/ui/Badge';

interface RecruitmentCardProps {
  item: RecruitmentSummary;
  onPress: () => void;
}

export function RecruitmentCard({ item, onPress }: RecruitmentCardProps) {
  const typeMeta = ACTIVITY_TYPE_MAP[item.activityType];
  const statusMeta = STATUS_META[item.status];
  const ratio = item.neededCount > 0 ? Math.min(item.joinedCount / item.neededCount, 1) : 0;
  const almostFull = item.remainingCount > 0 && item.remainingCount <= 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}，${statusMeta.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, cardShadow, pressed ? styles.pressed : null]}
    >
      <View style={styles.topRow}>
        <Badge label={statusMeta.label} color={statusMeta.color} background={statusMeta.background} />
        <View style={styles.typeTag}>
          <Ionicons name={typeMeta.icon} size={13} color={colors.textMuted} />
          <Text style={styles.typeText}>{typeMeta.label}</Text>
        </View>
        <View style={styles.flexSpacer} />
        <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.metaRow}>
        <Ionicons name="school-outline" size={13} color={colors.textFaint} />
        <Text style={styles.metaText} numberOfLines={1}>
          {item.college}
        </Text>
      </View>

      {item.requirementsPreview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {item.requirementsPreview}
        </Text>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>

      <View style={styles.footer}>
        <View style={styles.counter}>
          <Ionicons name="people-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.counterText}>
            已加入 {item.joinedCount}/{item.neededCount}
          </Text>
        </View>
        {item.status === 'recruiting' ? (
          <Badge
            label={almostFull ? `仅剩 ${item.remainingCount} 个名额` : `还差 ${item.remainingCount} 人`}
            color={almostFull ? colors.warning : colors.success}
            background={almostFull ? colors.warningSoft : colors.successSoft}
          />
        ) : null}
        <View style={styles.flexSpacer} />
        <Text style={styles.publisher} numberOfLines={1}>
          {item.publisherName}
        </Text>
      </View>
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
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeText: { ...typography.caption, fontSize: 12 },
  flexSpacer: { flex: 1 },
  time: { ...typography.tiny },
  title: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { ...typography.caption, flexShrink: 1 },
  preview: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardMuted,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  counterText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  publisher: { ...typography.tiny, maxWidth: 90 },
});
