import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { contactTypeMeta } from '@/constants/options';
import { colors, cardShadow, radius, spacing, typography } from '@/constants/theme';
import { formatDateTime, formatRelative } from '@/lib/date';
import type { AppNotification } from '@/types/models';

interface NotificationItemProps {
  item: AppNotification;
  onPress: () => void;
  onOpenRecruitment?: () => void;
}

export function NotificationItem({ item, onPress, onOpenRecruitment }: NotificationItemProps) {
  const contactMeta = contactTypeMeta(item.joinerContactType);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.content}${item.read ? '，已读' : '，未读'}`}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        item.read ? styles.cardRead : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, item.read ? styles.iconCircleRead : null]}>
          <Ionicons
            name={item.read ? 'checkmark-outline' : 'person-add-outline'}
            size={16}
            color={item.read ? colors.textFaint : colors.primaryDark}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, item.read ? styles.titleRead : null]} numberOfLines={1}>
            {item.content}
          </Text>
          <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
        </View>
        {item.read ? null : <View style={styles.unreadDot} />}
      </View>

      <View style={styles.detailBox}>
        <InfoLine icon="id-card-outline" label="姓名学号" value={`${item.joinerName} · ${item.joinerStudentId}`} />
        <InfoLine icon="school-outline" label="二级学院" value={item.joinerCollege} />
        <InfoLine
          icon={contactMeta.icon}
          label="联系方式"
          value={`${contactMeta.label}：${item.joinerContact}`}
        />
        <InfoLine icon="time-outline" label="加入时间" value={formatDateTime(item.createdAt)} />
      </View>

      <View style={styles.footer}>
        <Ionicons name="megaphone-outline" size={13} color={colors.textFaint} />
        <Text style={styles.footerText} numberOfLines={1}>
          {item.recruitmentTitle}
        </Text>
        {onOpenRecruitment ? (
          <Pressable
            onPress={onOpenRecruitment}
            hitSlop={8}
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={styles.linkText}>查看招募</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={13} color={colors.textFaint} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cardRead: { borderLeftColor: colors.border, opacity: 0.9 },
  pressed: { opacity: 0.85 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRead: { backgroundColor: colors.cardMuted },
  headerText: { flex: 1 },
  title: { ...typography.body, fontWeight: '600', fontSize: 14 },
  titleRead: { fontWeight: '500', color: colors.textSecondary },
  time: { ...typography.tiny, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  detailBox: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: 6,
  },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { ...typography.tiny, width: 56 },
  infoValue: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerText: { ...typography.caption, flex: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
