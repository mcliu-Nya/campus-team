import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { contactTypeMeta } from '@/constants/options';
import { colors, spacing, typography } from '@/constants/theme';
import type { ContactType } from '@/types/models';
import { Avatar } from '@/components/ui/Avatar';

interface MemberRowProps {
  name: string;
  college?: string;
  studentId?: string;
  contactType?: ContactType;
  contact?: string;
  caption?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  actionDestructive?: boolean;
}

/** 成员行：详情页与“我的队伍”共用，联系方式只会在同队可见数据里出现。 */
export function MemberRow({
  name,
  college,
  studentId,
  contactType,
  contact,
  caption,
  actionLabel,
  actionIcon = 'person-remove-outline',
  onAction,
  actionDestructive = true,
}: MemberRowProps) {
  const contactMeta = contact ? contactTypeMeta(contactType) : null;
  return (
    <View style={styles.row}>
      <Avatar name={name} size={38} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {studentId ? <Text style={styles.studentId}>{studentId}</Text> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {[college, caption].filter(Boolean).join(' · ') || '—'}
        </Text>
        {contact ? (
          <View style={styles.contactRow}>
            <Ionicons name={contactMeta?.icon ?? 'call-outline'} size={12} color={colors.primaryDark} />
            {contactMeta ? <Text style={styles.contactType}>{contactMeta.label}</Text> : null}
            <Text style={styles.contact} selectable numberOfLines={1}>
              {contact}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
        >
          <Ionicons
            name={actionIcon}
            size={14}
            color={actionDestructive ? colors.danger : colors.textMuted}
          />
          <Text style={[styles.actionText, actionDestructive ? styles.actionDanger : null]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    gap: spacing.md,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.body, fontWeight: '600', fontSize: 14, flexShrink: 1 },
  studentId: { ...typography.tiny },
  meta: { ...typography.caption, marginTop: 1 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contact: { fontSize: 12, color: colors.primaryDark, fontWeight: '500' },
  contactType: { fontSize: 11, color: colors.primaryDark, fontWeight: '700' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionText: { ...typography.caption, color: colors.textMuted },
  actionDanger: { color: colors.danger },
  pressed: { opacity: 0.6 },
});
