import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { toErrorMessage } from '@/lib/errors';

interface RefreshOptions {
  silent?: boolean;
}

/**
 * 通用异步资源：负责 loading / error / data 三态与静默刷新。
 * loader 必须是稳定引用（页面里用 useCallback 包裹）。
 */
export function useAsyncResource<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!enabled) {
        setLoading(false);
        return;
      }
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        setData(await loader());
      } catch (cause) {
        setError(toErrorMessage(cause));
      } finally {
        setLoading(false);
      }
    },
    [enabled, loader],
  );

  return { data, loading, error, refresh, setData };
}

/** 首次聚焦正常加载，之后回到页面时静默刷新。 */
export function useFocusLoad(refresh: (options?: RefreshOptions) => Promise<void>) {
  const hasLoaded = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: hasLoaded.current });
      hasLoaded.current = true;
    }, [refresh]),
  );
}
