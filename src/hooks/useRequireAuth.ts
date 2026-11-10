import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/state/AuthProvider';
import { useToast } from '@/state/ToastProvider';

/** 需要登录的操作统一入口：未登录先提示并跳到登录页，避免每个页面重复判断。 */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  return useCallback(
    (action: () => void) => {
      if (!user) {
        showToast('请先登录后再操作', 'info');
        router.push('/login');
        return;
      }
      action();
    },
    [router, showToast, user],
  );
}
