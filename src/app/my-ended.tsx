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
import type { RecruitmentSummary } from '@/types/models';
import { ManagedRecruitmentCard } from '@/components/recruitment/ManagedRecruitmentCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SignInRequired } from '@/components/ui/SignInRequired';

const HINTS: Record<string, string> = {
  ended: '已结束，可重新发布',
  cancelled: '已取消，可重新发布',
};

export default function MyEndedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const loader = useCallback(async () => {
    if (!user) return [] as RecruitmentSummary[];
    return dataAdapter.recruitments.myEnded(user);
  }, [user]);

  const ended = useAsyncResource<RecruitmentSummary[]>(loader, Boolean(user));
  useFocusLoad(ended.refresh);

  if (!user) {
    return <SignInRequired title="登录后查看结束的招募" description="已结束、已取消的招募都在这里。" />;
  }

  const handleReopen = async (item: RecruitmentSummary) => {
    const suggested = Math.max(item.neededCount, item.joinedCount + 1);
    const ok = await confirm({
      title: '重新发布',
      message: `「${item.title}」将恢复为招募中，需要人数 ${suggested} 人。`,
      confirmText: '重新发布',
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      const updated = await dataAdapter.recruitments.reopen(item.id, user);
      showToast(`已重新发布，需要 ${updated.neededCount} 人`, 'success');
      await ended.refresh({ silent: true });
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: RecruitmentSummary) => {
    const ok = await confirm({
      title: '删除招募',
      message: `删除「${item.title}」后数据将被移除，无法恢复。`,
      confirmText: '删除',
      destructive: true,
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await dataAdapter.recruitments.deleteRecruitment(item.id, user);
      showToast('已删除', 'success');
      await ended.refresh({ silent: true });
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const items = ended.data ?? [];

  if (ended.loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <LoadingState label="正在加载归档招募…" />
      </View>
    );
  }

  if (ended.error && items.length === 0) {
    return (
      <View style={styles.center}>
        <ErrorState message={ended.error} onRetry={() => void ended.refresh()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ManagedRecruitmentCard
            item={item}
            footerHint={HINTS[item.status]}
            onPress={() => router.push(`/recruitment/${item.id}`)}
            actions={[
              {
                label: '查看详情',
                icon: 'document-text-outline',
                variant: 'secondary',
                onPress: () => router.push(`/recruitment/${item.id}`),
              },
              {
                label: busyId === item.id ? '处理中…' : '重新发布',
                icon: 'refresh-outline',
                variant: 'soft',
                onPress: () => void handleReopen(item),
              },
              {
                label: '删除',
                icon: 'trash-outline',
                variant: 'danger',
                onPress: () => void handleDelete(item),
              },
            ]}
          />
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={ended.loading}
        onRefresh={() => void ended.refresh()}
        ListHeaderComponent={
          items.length > 0 ? (
            <Text style={styles.summary}>共 {items.length} 条 · 可重新发布或删除</Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="archive-outline"
            title="还没有结束的招募"
            description="结束或取消的招募会出现在这里"
            actionLabel="查看我的招募"
            onAction={() => router.push('/my-recruitments')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  emptyContent: { flexGrow: 1, padding: spacing.xl },
  summary: { ...typography.caption, marginBottom: spacing.md },
});
