import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, hitSlop, radius, spacing, typography } from '@/constants/theme';
import { useRecruitmentList } from '@/hooks/useRecruitmentList';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/state/AuthProvider';
import { FilterSheet } from '@/components/recruitment/FilterSheet';
import { RecruitmentCard } from '@/components/recruitment/RecruitmentCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';

export default function RecruitmentFeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const list = useRecruitmentList(user);
  const reloadList = list.reload;
  const [filterVisible, setFilterVisible] = useState(false);

  // 从发布 / 详情返回时静默刷新，首次进入由 hook 自己加载
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void reloadList({ silent: true });
    }, [reloadList]),
  );

  const openPublish = () => requireAuth(() => router.push('/recruitment-new'));

  const renderEmpty = () => {
    if (list.loading) return <LoadingState label="正在加载招募…" />;
    if (list.error) return <ErrorState message={list.error} onRetry={() => void list.reload()} />;
    if (list.isFiltering) {
      return (
        <EmptyState
          icon="search-outline"
          title="没有找到匹配的招募"
          description="试试更换关键词，或减少筛选条件"
          actionLabel="清除筛选"
          onAction={() => {
            list.setKeyword('');
            list.resetFilters();
          }}
        />
      );
    }
    return (
      <EmptyState
        icon="people-outline"
        title="还没有进行中的招募"
        description="缺一个队友？发布第一条招募，让同学找到你"
        actionLabel="发布招募"
        onAction={openPublish}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={typography.h1}>活动招募</Text>
          <Text style={styles.subtitle}>
            {list.loading ? '正在同步最新招募…' : `${list.total} 个活动`}
          </Text>
        </View>
        <Button label="发布招募" icon="add" size="sm" onPress={openPublish} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            value={list.keyword}
            onChangeText={list.setKeyword}
            placeholder="搜索活动名称、要求、补充内容"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {list.keyword.length > 0 ? (
            <Pressable onPress={() => list.setKeyword('')} hitSlop={hitSlop} accessibilityLabel="清空搜索">
              <Ionicons name="close-circle" size={17} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFilterVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="筛选"
          style={({ pressed }) => [
            styles.filterButton,
            list.activeFilterCount > 0 ? styles.filterButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={list.activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          {list.activeFilterCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{list.activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {list.activeFilterCount > 0 ? (
        <View style={styles.activeBar}>
          <Text style={styles.activeText}>已应用 {list.activeFilterCount} 个筛选条件</Text>
          <Pressable onPress={list.resetFilters} hitSlop={hitSlop}>
            <Text style={styles.clearText}>清除筛选</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // 满员招募不隐藏，归入「已满员」分组并排在最后
          const isFirstFull =
            item.status === 'full' && (index === 0 || list.items[index - 1]?.status !== 'full');
          return (
            <View>
              {isFirstFull ? (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>已满员</Text>
                  <Text style={styles.sectionHint}>名额已招满，暂不接收新成员</Text>
                </View>
              ) : null}
              <RecruitmentCard
                item={item}
                onPress={() => router.push(`/recruitment/${item.id}`)}
              />
            </View>
          );
        }}
        contentContainerStyle={list.items.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={list.refreshing}
        onRefresh={() => void list.reload()}
        onEndReached={() => void list.loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator style={styles.footerLoading} color={colors.primary} />
          ) : list.items.length > 0 && !list.hasMore ? (
            <Text style={styles.footerTip}>已经到底啦 · 共 {list.total} 个招募</Text>
          ) : undefined
        }
      />

      <FilterSheet
        // 每次打开重新挂载，以当前生效条件作为草稿初值
        key={filterVisible ? 'filter-open' : 'filter-closed'}
        visible={filterVisible}
        filters={list.filters}
        onClose={() => setFilterVisible(false)}
        onApply={list.applyFilters}
        onReset={list.resetFilters}
      />
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
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  subtitle: { ...typography.caption, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    paddingVertical: 0,
    color: colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterCountText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  activeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  activeText: { ...typography.caption, color: colors.primaryDark },
  clearText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xs,
  },
  emptyContent: { flexGrow: 1, paddingHorizontal: spacing.xl },
  footerLoading: { marginVertical: spacing.lg },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  sectionTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  sectionHint: { ...typography.tiny },
  footerTip: {
    ...typography.tiny,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
