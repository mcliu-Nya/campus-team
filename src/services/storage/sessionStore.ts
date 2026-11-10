import type { AuthSession } from '@/types/api';
import { STORAGE_KEYS, localStore } from './localStore';

/**
 * 登录态持久化。与业务仓储分开，避免页面直接操作 AsyncStorage。
 */
export const sessionStore = {
  load(): Promise<AuthSession | null> {
    return localStore.read<AuthSession | null>(STORAGE_KEYS.session, null);
  },
  save(session: AuthSession): Promise<void> {
    return localStore.write(STORAGE_KEYS.session, session);
  },
  clear(): Promise<void> {
    return localStore.remove(STORAGE_KEYS.session);
  },
};
