import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIVITY_TYPE_MAP, STATUS_META, contactTypeMeta } from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { formatDateTime } from '@/lib/date';
import type { TeamEntry, User } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MemberRow } from './MemberRow';

interface TeamCardProps {
  entry: TeamEntry;
  viewer: User;
  onOpenRecruitment: () => void;
  onLeave?: () => void;
  onRemoveMember?: (joinId: string) => void;
}

/** “我的队伍”卡片：集中展示双方联系方式与成员管理入口。 */
export function TeamCard({ entry, viewer, onOpenRecruitment, onLeave, onRemoveMember }: TeamCardProps) {
  const { recruitment, role, publisher, members, myContact, myContactType, joinedAt } = entry;
  const statusMeta = STATUS_META[recruitment.status];
  const typeMeta = ACTIVITY_TYPE_MAP[recruitment.activityType];
  const isPublisher = role === 'publisher';

  return (
    <View style={[styles.card, cardShadow]}>
      <Pressable onPress={onOpenRecruitment} style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <View style={styles.header}>
          <Badge label={statusMeta.label} color={statusMeta.color} background={statusMeta.background} />
          <Badge
            label={isPublisher ? '我发布的' : '我加入的'}
            color={colors.primaryDark}
            background={colors.primarySoft}
          />
          <View style={styles.spacer} />
          <Ionicons name={typeMeta.icon} size={14} color={colors.textMuted} />
          <Text style={styles.typeText}>{typeMeta.label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {recruitment.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {recruitment.college} · 已加入 {recruitment.joinedCount}/{recruitment.neededCount}
          {joinedAt ? ` · 我的加入时间 ${formatDateTime(joinedAt)}` : ''}
        </Text>
      </Pressable>

      <View style={styles.contactBox}>
        <View style={styles.contactLine}>
          <Text style={styles.contactLabel}>我的联系方式</Text>
          <Text style={styles.contactValue} selectable numberOfLines={1}>
            {myContact ? `${contactTypeMeta(myContactType).label} · ${myContact}` : '—'}
          </Text>
        </View>
        <View style={styles.contactLine}>
          <Text style={styles.contactLabel}>发布者</Text>
          <Text style={styles.contactValue} selectable numberOfLines={1}>
            {publisher.realName} · {publisher.college} ·{' '}
            {contactTypeMeta(publisher.contactType).label} {publisher.contact}
          </Text>
        </View>
        <Text style={styles.privacyHint}>联系方式仅队伍双方可见，请勿外传</Text>
      </View>

      <View style={styles.memberHeader}>
        <Ionicons name="people-outline" size={14} color={colors.textMuted} />
        <Text style={styles.memberTitle}>队伍成员（{members.length}）</Text>
      </View>

      {members.length === 0 ? (
        <Text style={styles.emptyMembers}>还没有成员加入，分享招募给同学吧</Text>
      ) : (
        members.map((member) => (
          <MemberRow
            key={member.joinId}
            name={member.realName}
            college={member.college}
            studentId={member.studentId}
            contactType={member.contactType}
            contact={member.contact}
            caption={member.userId === viewer.id ? '我' : undefined}
            actionLabel={isPublisher && member.userId !== viewer.id ? '移除' : undefined}
            onAction={
              isPublisher && onRemoveMember ? () => onRemoveMember(member.joinId) : undefined
            }
          />
        ))
      )}

      <View style={styles.actions}>
        <Button
          label="查看招募详情"
          variant="secondary"
          size="sm"
          icon="document-text-outline"
          onPress={onOpenRecruitment}
          style={styles.action}
        />
        {!isPublisher && onLeave ? (
          <Button
            label="退出队伍"
            variant="danger"
            size="sm"
            icon="exit-outline"
            onPress={onLeave}
            style={styles.action}
          />
        ) : null}
      </View>
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
  pressed: { opacity: 0.9 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spacer: { flex: 1 },
  typeText: { ...typography.tiny },
  title: { ...typography.h3, fontSize: 16, marginTop: spacing.sm },
  meta: { ...typography.caption, marginTop: spacing.xs },
  contactBox: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  contactLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactLabel: { ...typography.tiny, width: 84 },
  contactValue: { ...typography.caption, color: colors.text, flex: 1, fontWeight: '500' },
  privacyHint: { ...typography.tiny, color: colors.textFaint, marginTop: 2 },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberTitle: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  emptyMembers: { ...typography.caption, color: colors.textFaint, paddingVertical: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
