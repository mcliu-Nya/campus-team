import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import { toErrorMessage } from '@/lib/errors';
import { dataAdapter } from '@/services/repositories';
import { useAuth } from '@/state/AuthProvider';
import { useConfirm } from '@/state/ConfirmProvider';
import { useToast } from '@/state/ToastProvider';
import { useAsyncResource, useFocusLoad } from '@/hooks/useAsyncResource';
import type { TeamEntry } from '@/types/models';
import { TeamCard } from '@/components/team/TeamCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SignInRequired } from '@/components/ui/SignInRequired';

export default function MyTeamsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  const loader = useCallback(async () => {
    if (!user) return [] as TeamEntry[];
    return dataAdapter.recruitments.myTeams(user);
  }, [user]);

  const teams = useAsyncResource<TeamEntry[]>(loader, Boolean(user));
  useFocusLoad(teams.refresh);

  if (!user) {
    return <SignInRequired title="登录后查看我的队伍" description="加入或发布队伍后，可在这里查看双方联系方式。" />;
  }

  const handleLeave = async (entry: TeamEntry) => {
    const ok = await confirm({
      title: '退出队伍',
      message: `确认退出「${entry.recruitment.title}」？退出后将无法查看队伍联系方式。`,
      confirmText: '退出',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await dataAdapter.recruitments.leave(entry.recruitment.id, user);
      showToast('已退出队伍', 'success');
      await teams.refresh({ silent: true });
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (entry: TeamEntry, joinId: string) => {
    const ok = await confirm({
      title: '移除成员',
      message: '被移除的成员将无法再查看队伍联系方式。',
      confirmText: '移除',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await dataAdapter.recruitments.removeMember(entry.recruitment.id, joinId, user);
      showToast('已移除该成员', 'success');
      await teams.refresh({ silent: true });
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const items = teams.data ?? [];

  if (teams.loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <LoadingState label="正在加载我的队伍…" />
      </View>
    );
  }

  if (teams.error && items.length === 0) {
    return (
      <View style={styles.center}>
        <ErrorState message={teams.error} onRetry={() => void teams.refresh()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.recruitment.id}
        renderItem={({ item }) => (
          <TeamCard
            entry={item}
            viewer={user}
            onOpenRecruitment={() => router.push(`/recruitment/${item.recruitment.id}`)}
            onLeave={() => void handleLeave(item)}
            onRemoveMember={(joinId) => void handleRemove(item, joinId)}
          />
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={teams.loading}
        onRefresh={() => void teams.refresh()}
        ListHeaderComponent={
          items.length > 0 ? (
            <Text style={styles.summary}>
              共 {items.length} 支队伍 · 联系方式仅队伍双方可见
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="还没有加入任何队伍"
            description="去活动招募页看看，或发布一条自己的招募"
            actionLabel="浏览招募"
            onAction={() => router.push('/')}
          />
        }
      />
      {actionLoading ? <Text style={styles.loadingTip}>正在同步…</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  emptyContent: { flexGrow: 1, padding: spacing.xl },
  summary: { ...typography.caption, marginBottom: spacing.md },
  loadingTip: { ...typography.tiny, textAlign: 'center', paddingBottom: spacing.md },
});
