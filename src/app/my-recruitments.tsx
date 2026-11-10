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

export default function MyRecruitmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const loader = useCallback(async () => {
    if (!user) return [] as RecruitmentSummary[];
    return dataAdapter.recruitments.myRecruitments(user);
  }, [user]);

  const mine = useAsyncResource<RecruitmentSummary[]>(loader, Boolean(user));
  useFocusLoad(mine.refresh);

  if (!user) {
    return <SignInRequired title="登录后查看我的招募" description="发布招募后可在这里编辑或取消。" />;
  }

  const handleCancel = async (item: RecruitmentSummary) => {
    const ok = await confirm({
      title: '取消招募',
      message: `取消「${item.title}」后将不再展示，可在「结束的招募」中重新发布。`,
      confirmText: '取消招募',
      destructive: true,
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await dataAdapter.recruitments.cancel(item.id, user);
      showToast('已取消', 'success');
      await mine.refresh({ silent: true });
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const items = mine.data ?? [];

  if (mine.loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <LoadingState label="正在加载我的招募…" />
      </View>
    );
  }

  if (mine.error && items.length === 0) {
    return (
      <View style={styles.center}>
        <ErrorState message={mine.error} onRetry={() => void mine.refresh()} />
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
            roleLabel="招募中"
            onPress={() => router.push(`/recruitment/${item.id}`)}
            actions={[
              {
                label: busyId === item.id ? '处理中…' : '编辑',
                icon: 'create-outline',
                variant: 'secondary',
                onPress: () => router.push(`/recruitment-edit/${item.id}`),
              },
              {
                label: '取消招募',
                icon: 'close-circle-outline',
                variant: 'secondary',
                onPress: () => void handleCancel(item),
              },
            ]}
          />
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={mine.loading}
        onRefresh={() => void mine.refresh()}
        ListHeaderComponent={
          items.length > 0 ? (
            <Text style={styles.summary}>共 {items.length} 条进行中的招募</Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="megaphone-outline"
            title="还没有进行中的招募"
            description="发布一条招募，等待同学加入"
            actionLabel="发布招募"
            onAction={() => router.push('/recruitment-new')}
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
