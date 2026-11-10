import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACTIVITY_TYPE_MAP,
  CONTACT_TYPE_MAP,
  DEFAULT_CONTACT_TYPE,
  STATUS_META,
  contactTypeMeta,
} from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { formatDateTime, formatDeadlineHint, formatRelative } from '@/lib/date';
import { toErrorMessage } from '@/lib/errors';
import { validateContact } from '@/lib/validate';
import { dataAdapter } from '@/services/repositories';
import { useAuth } from '@/state/AuthProvider';
import { useConfirm } from '@/state/ConfirmProvider';
import { useToast } from '@/state/ToastProvider';
import type { ContactType, RecruitmentDetail } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContactTypePicker } from '@/components/ui/ContactTypePicker';
import { Field } from '@/components/ui/Field';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { MemberRow } from '@/components/team/MemberRow';

export default function RecruitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<RecruitmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [contactType, setContactType] = useState<ContactType>(DEFAULT_CONTACT_TYPE);
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id) return;
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        setDetail(await dataAdapter.recruitments.getDetail(id, user));
      } catch (cause) {
        setError(toErrorMessage(cause));
      } finally {
        setLoading(false);
      }
    },
    [id, user],
  );

  const hasLoaded = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void load({ silent: hasLoaded.current });
      hasLoaded.current = true;
    }, [load]),
  );

  const openJoin = () => {
    if (!detail) return;
    if (!user) {
      showToast('请先登录', 'info');
      router.push('/login');
      return;
    }
    // 加入者填的是自己的联系方式，不沿用发布者的类型，保留上一次选择
    setContact('');
    setContactError(null);
    setJoinVisible(true);
  };

  const submitJoin = async () => {
    if (!detail || !user) return;
    const message = validateContact(contact, contactType);
    if (message) {
      setContactError(message);
      return;
    }
    setSubmitting(true);
    try {
      const updated = await dataAdapter.recruitments.join(
        detail.id,
        { contactType, contact: contact.trim() },
        user,
      );
      setDetail(updated);
      setJoinVisible(false);
      showToast('已加入队伍', 'success');
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!detail || !user) return;
    const ok = await confirm({
      title: '退出队伍',
      message: '退出后无法查看队伍联系方式。',
      confirmText: '退出',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      setDetail(await dataAdapter.recruitments.leave(detail.id, user));
      showToast('已退出队伍', 'success');
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!detail || !user) return;
    const ok = await confirm({
      title: '取消招募',
      message: '取消后不再展示，成员将无法查看联系方式。',
      confirmText: '取消招募',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      setDetail(await dataAdapter.recruitments.cancel(detail.id, user));
      showToast('招募已取消', 'success');
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!detail || !user) return;
    const suggested = Math.max(detail.neededCount, detail.joinedCount + 1);
    const ok = await confirm({
      title: '重新发布',
      message: `将恢复为招募中，需要人数 ${suggested} 人。`,
      confirmText: '重新发布',
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      setDetail(await dataAdapter.recruitments.reopen(detail.id, user));
      showToast('招募已重新发布', 'success');
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (joinId: string) => {
    if (!detail || !user) return;
    const ok = await confirm({
      title: '移除成员',
      message: '移除后对方将无法查看队伍联系方式。',
      confirmText: '移除',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      setDetail(await dataAdapter.recruitments.removeMember(detail.id, joinId, user));
      showToast('已移除该成员', 'success');
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('设备不支持打开该链接');
      await Linking.openURL(url);
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingState label="正在加载招募详情…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorState message={error} onRetry={() => void load()} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="document-outline"
          title="招募不存在"
          description="该招募可能已被发布者删除"
          actionLabel="返回列表"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  const statusMeta = STATUS_META[detail.status];
  const typeMeta = ACTIVITY_TYPE_MAP[detail.activityType];
  const isMember = detail.viewerIsPublisher || detail.viewerHasJoined;
  const ratio = detail.neededCount > 0 ? Math.min(detail.joinedCount / detail.neededCount, 1) : 0;
  const isLocked = detail.status !== 'recruiting';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroTop}>
            <Badge label={statusMeta.label} color={statusMeta.color} background={statusMeta.background} />
            <Badge label={typeMeta.label} color={colors.textSecondary} background={colors.cardMuted} />
            {detail.remainingCount > 0 && detail.status === 'recruiting' ? (
              <Badge
                label={`剩余 ${detail.remainingCount} 个名额`}
                color={detail.remainingCount <= 2 ? colors.warning : colors.success}
                background={detail.remainingCount <= 2 ? colors.warningSoft : colors.successSoft}
              />
            ) : null}
          </View>

          <Text style={styles.title}>{detail.title}</Text>

          <View style={styles.metaList}>
            <MetaRow icon="school-outline" text={detail.college} />
            <MetaRow
              icon="calendar-outline"
              text={`${formatDeadlineHint(detail.deadline)}${
                detail.deadline ? `（${formatDateTime(detail.deadline)}）` : ''
              }`}
            />
            <MetaRow
              icon="time-outline"
              text={`发布于 ${formatDateTime(detail.createdAt)} · ${formatRelative(detail.createdAt)}`}
            />
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>队伍人数</Text>
            <Text style={styles.progressValue}>
              {detail.joinedCount} / {detail.neededCount}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
          </View>

          {isLocked ? (
            <View style={styles.lockBanner}>
              <Ionicons name={statusMeta.icon} size={14} color={statusMeta.color} />
              <Text style={[styles.lockText, { color: statusMeta.color }]}>
                {detail.status === 'full'
                  ? '名额已满，仍会展示到报名截止'
                  : detail.status === 'cancelled'
                    ? '该招募已被发布者取消'
                    : '该招募已结束'}
              </Text>
            </View>
          ) : null}
        </View>

        <Section title="队员要求" icon="list-outline">
          <Text style={styles.paragraph}>{detail.requirements}</Text>
        </Section>

        {detail.extra ? (
          <Section title="补充说明" icon="information-circle-outline">
            <Text style={styles.paragraph}>{detail.extra}</Text>
          </Section>
        ) : null}

        <Section title="活动链接" icon="link-outline">
          <Pressable
            onPress={() => void openLink(detail.activityUrl)}
            accessibilityRole="link"
            style={({ pressed }) => [styles.linkRow, pressed ? styles.pressed : null]}
          >
            <Text style={styles.linkText} numberOfLines={2}>
              {detail.activityUrl}
            </Text>
            <Ionicons name="open-outline" size={15} color={colors.primary} />
          </Pressable>
        </Section>

        <Section title="发布者" icon="person-outline">
          <MemberRow
            name={detail.publisher.realName}
            college={detail.publisher.college}
            studentId={isMember ? detail.publisher.studentId : undefined}
            contactType={detail.publisher.contactType}
            contact={isMember ? detail.publisher.contact : undefined}
            caption="发布者"
          />
          {isMember && detail.contact ? (
            <View style={styles.contactBox}>
              <Text style={styles.contactLabel}>
                队伍联系方式 · {contactTypeMeta(detail.contactType).label}
              </Text>
              <Text style={styles.contactValue} selectable>
                {detail.contact}
              </Text>
            </View>
          ) : (
            <View style={styles.maskedBox}>
              <Ionicons name="eye-off-outline" size={14} color={colors.textMuted} />
              <Text style={styles.maskedText}>加入后可见（{detail.contactMasked}）</Text>
            </View>
          )}
        </Section>

        <Section title={`队伍成员（${detail.joinedCount}/${detail.neededCount}）`} icon="people-outline">
          {detail.members.length > 0 ? (
            detail.members.map((member) => (
              <MemberRow
                key={member.joinId}
                name={member.realName}
                college={member.college}
                studentId={member.studentId}
                contactType={member.contactType}
                contact={member.contact}
                caption={member.userId === user?.id ? '我' : `加入于 ${formatRelative(member.joinedAt)}`}
                actionLabel={detail.viewerIsPublisher ? '移除' : undefined}
                onAction={
                  detail.viewerIsPublisher
                    ? () => void handleRemoveMember(member.joinId)
                    : undefined
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              {isMember ? '还没有其他成员加入，把招募分享给同学吧' : '加入后可查看成员名单与联系方式'}
            </Text>
          )}
        </Section>

        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textFaint} />
          <Text style={styles.privacyText}>
            姓名、学号与联系方式仅队伍双方可见，列表默认脱敏。
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {detail.viewerIsPublisher ? (
          <View style={styles.actionRow}>
            <Button
              label="编辑招募"
              icon="create-outline"
              variant="secondary"
              onPress={() => router.push(`/recruitment-edit/${detail.id}`)}
              style={styles.actionButton}
            />
            {detail.status === 'recruiting' ? (
              <Button
                label="取消招募"
                icon="close-circle-outline"
                variant="danger"
                loading={actionLoading}
                onPress={() => void handleCancel()}
                style={styles.actionButton}
              />
            ) : (
              <Button
                label="重新发布"
                icon="refresh-outline"
                loading={actionLoading}
                onPress={() => void handleReopen()}
                style={styles.actionButton}
              />
            )}
          </View>
        ) : detail.viewerHasJoined ? (
          <Button
            label="退出队伍"
            icon="exit-outline"
            variant="secondary"
            loading={actionLoading}
            onPress={() => void handleLeave()}
            fullWidth
          />
        ) : (
          <Button
            label={
              !user
                ? '登录后加入队伍'
                : detail.canJoin
                  ? '加入队伍'
                  : (detail.joinBlockedReason ?? '暂不可加入')
            }
            icon={detail.canJoin ? 'add-circle-outline' : 'lock-closed-outline'}
            onPress={openJoin}
            disabled={Boolean(user) && !detail.canJoin}
            fullWidth
          />
        )}
      </View>

      <Sheet
        visible={joinVisible}
        title="加入队伍"
        subtitle={detail.title}
        onClose={() => setJoinVisible(false)}
        maxHeightRatio={0.6}
        footer={
          <Button label="确认加入" onPress={() => void submitJoin()} loading={submitting} fullWidth />
        }
      >
        <Text style={styles.joinHint}>
          提交后发布者会收到通知，双方可在「我的队伍」查看彼此的联系方式。
        </Text>
        <ContactTypePicker
          value={contactType}
          onChange={(next) => {
            setContactType(next);
            setContactError(null);
          }}
          label="你的联系方式类型"
        />
        <Field
          label="你的联系方式"
          required
          value={contact}
          onChangeText={(text) => {
            setContact(text);
            setContactError(null);
          }}
          placeholder={CONTACT_TYPE_MAP[contactType].placeholder}
          error={contactError ?? undefined}
          hint={`${CONTACT_TYPE_MAP[contactType].hint}；仅同队成员可见`}
          keyboardType={CONTACT_TYPE_MAP[contactType].keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={60}
        />
      </Sheet>
    </View>
  );
}

function MetaRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={colors.textFaint} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.h1, fontSize: 22, lineHeight: 30, marginTop: spacing.md },
  metaList: { gap: 6, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...typography.caption, flexShrink: 1 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  progressLabel: { ...typography.caption },
  progressValue: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardMuted,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  lockText: { ...typography.caption, flex: 1 },
  paragraph: { ...typography.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkText: { ...typography.caption, color: colors.primary, flex: 1 },
  pressed: { opacity: 0.7 },
  contactBox: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  contactLabel: { ...typography.tiny, color: colors.success },
  contactValue: { ...typography.body, fontWeight: '600', fontSize: 14 },
  maskedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  maskedText: { ...typography.caption, flex: 1 },
  emptyText: { ...typography.caption, color: colors.textFaint, lineHeight: 20 },
  privacyNote: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  privacyText: { ...typography.tiny, flex: 1, lineHeight: 17 },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1 },
  joinHint: { ...typography.caption, lineHeight: 19, marginBottom: spacing.lg },
});
