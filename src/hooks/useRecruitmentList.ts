import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ActivityType,
  PublishedWithin,
  RecruitmentQuery,
  RecruitmentSummary,
  SpotFilter,
  User,
} from '@/types/models';
import { toErrorMessage } from '@/lib/errors';
import { dataAdapter } from '@/services/repositories';
import { useDebouncedValue } from './useDebouncedValue';

export interface FilterState {
  colleges: string[];
  types: ActivityType[];
  spot: SpotFilter;
  publishedWithin: PublishedWithin;
}

export const EMPTY_FILTERS: FilterState = {
  colleges: [],
  types: [],
  spot: 'any',
  publishedWithin: 'all',
};

const PAGE_SIZE = 10;

type LoadMode = 'initial' | 'refresh' | 'silent' | 'append';

/**
 * 招募列表状态机：搜索 + 筛选 + 分页 + 加载/错误/空状态。
 * 所有请求都经过 dataAdapter.recruitments，页面不关心数据来源。
 */
export function useRecruitmentList(viewer: User | null) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 350);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [items, setItems] = useState<RecruitmentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  const query = useMemo<RecruitmentQuery>(
    () => ({
      keyword: debouncedKeyword || undefined,
      colleges: filters.colleges,
      types: filters.types,
      spot: filters.spot,
      publishedWithin: filters.publishedWithin,
      pageSize: PAGE_SIZE,
    }),
    [debouncedKeyword, filters],
  );

  const load = useCallback(
    async (nextPage: number, mode: LoadMode) => {
      const currentId = ++requestId.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'append') setLoadingMore(true);
      if (mode !== 'append') setError(null);

      try {
        const result = await dataAdapter.recruitments.list(
          { ...query, page: nextPage },
          viewer,
        );
        if (currentId !== requestId.current) return;

        setItems((prev) =>
          mode === 'append' ? [...prev, ...result.items] : result.items,
        );
        setTotal(result.total);
        setHasMore(result.hasMore);
        setPage(result.page);
        setError(null);
      } catch (cause) {
        if (currentId !== requestId.current) return;
        setError(toErrorMessage(cause));
        if (mode !== 'append') {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (currentId === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [query, viewer],
  );

  useEffect(() => {
    // 首次进入页面主动拉取；setState 由请求结果驱动，不存在级联渲染风险
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, 'initial');
  }, [load]);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      await load(1, options?.silent ? 'silent' : 'refresh');
    },
    [load],
  );

  const loadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    await load(page + 1, 'append');
  }, [hasMore, load, loading, loadingMore, page, refreshing]);

  const applyFilters = useCallback((next: FilterState) => setFilters(next), []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const activeFilterCount = useMemo(
    () =>
      filters.colleges.length +
      filters.types.length +
      (filters.spot !== 'any' ? 1 : 0) +
      (filters.publishedWithin !== 'all' ? 1 : 0),
    [filters],
  );

  const isFiltering = activeFilterCount > 0 || debouncedKeyword.length > 0;

  return {
    keyword,
    setKeyword,
    filters,
    applyFilters,
    resetFilters,
    activeFilterCount,
    isFiltering,
    items,
    total,
    hasMore,
    loading,
    refreshing,
    loadingMore,
    error,
    reload,
    loadMore,
  };
}
