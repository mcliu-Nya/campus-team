import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { LoginRequest } from '@/types/api';
import type { User } from '@/types/models';
import { setAuthToken } from '@/services/api/client';
import { dataAdapter } from '@/services/repositories';
import { sessionStore } from '@/services/storage/sessionStore';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (input: LoginRequest) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 登录态：唯一接触 sessionStore 的地方。
 * 恢复流程：读取本地 session → 注入 token → 调用 auth.me 校验 → 决定 signedIn / signedOut。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const session = await sessionStore.load();
      if (!active) return;
      if (!session) {
        setStatus('signedOut');
        return;
      }

      setAuthToken(session.token);
      try {
        const me = await dataAdapter.auth.me(session.token);
        if (!active) return;
        setToken(session.token);
        setUser(me);
        setStatus('signedIn');
      } catch {
        setAuthToken(null);
        await sessionStore.clear();
        if (!active) return;
        setToken(null);
        setUser(null);
        setStatus('signedOut');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (input: LoginRequest) => {
    const session = await dataAdapter.auth.login(input);
    setAuthToken(session.token);
    await sessionStore.save(session);
    setToken(session.token);
    setUser(session.user);
    setStatus('signedIn');
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await sessionStore.clear();
    setToken(null);
    setUser(null);
    setStatus('signedOut');
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    const me = await dataAdapter.auth.me(token);
    setUser(me);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut, refresh }),
    [status, user, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内部使用');
  return context;
}
