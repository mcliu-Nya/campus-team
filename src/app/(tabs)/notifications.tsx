import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, hitSlop, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/state/AuthProvider';
import { useNotifications } from '@/state/NotificationsProvider';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      if (user) void refresh({ silent: true });
    }, [refresh, user]),
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <Text style={typography.h1}>通知</Text>
        </View>
        <EmptyState
          icon="notifications-outline"
          title="登录后查看加入通知"
          description="同学加入你发布的招募时，这里会收到提醒"
          actionLabel="去登录"
          onAction={() => router.push('/login')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={typography.h1}>通知</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息都已读'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={() => void markAllRead()} hitSlop={hitSlop} style={styles.readAll}>
            <Ionicons name="checkmark-done" size={15} color={colors.primary} />
            <Text style={styles.readAllText}>全部已读</Text>
          </Pressable>
        ) : null}
      </View>

      {loading && items.length === 0 ? (
        <LoadingState label="正在加载通知…" />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => void markRead(item.id)}
              onOpenRecruitment={() => router.push(`/recruitment/${item.recruitmentId}`)}
            />
          )}
          contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="mail-open-outline"
              title="暂时没有通知"
              description="当有同学加入你发布的招募时，会在这里显示对方的联系信息"
              actionLabel="去看看招募"
              onAction={() => router.push('/')}
            />
          }
          ListFooterComponent={
            items.length > 0 ? (
              <Text style={styles.footerTip}>点击卡片可标记为已读</Text>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1 },
  subtitle: { ...typography.caption, marginTop: 2 },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  emptyContent: { flexGrow: 1 },
  footerTip: { ...typography.tiny, textAlign: 'center', paddingVertical: spacing.lg },
});
