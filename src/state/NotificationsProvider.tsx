import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { contactTypeMeta } from '@/constants/options';
import type { AppNotification } from '@/types/models';
import { toErrorMessage } from '@/lib/errors';
import { preparePushAlerts, showJoinAlert } from '@/lib/pushAlerts';
import { dataAdapter } from '@/services/repositories';
import { useAuth } from './AuthProvider';

/** 已提醒过的通知 id：避免轮询时重复弹系统通知 */
const SEEN_KEY = '@campus-team/notif-seen/v1';
/** 应用在前台时的轮询间隔（毫秒） */
const POLL_INTERVAL = 15_000;

interface NotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * 通知全局状态：Tab 角标与通知页共享同一份数据。
 * 只依赖 NotificationRepository，本地 / 远程模式无感切换。
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenRef = useRef<Set<string> | null>(null);
  const pushReady = useRef(false);

  /**
   * 发现「新加入」通知时弹一条系统通知。
   * 首次运行只记录基线，避免登录瞬间把历史通知全弹一遍。
   */
  const notifyNewJoins = useCallback(async (list: AppNotification[]) => {
    if (Platform.OS === 'web') return;

    if (!seenRef.current) {
      const raw = await AsyncStorage.getItem(SEEN_KEY);
      if (raw === null) {
        const initial = new Set(list.map((item) => item.id));
        seenRef.current = initial;
        await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...initial].slice(-200)));
        return;
      }
      try {
        seenRef.current = new Set(JSON.parse(raw) as string[]);
      } catch {
        seenRef.current = new Set();
      }
    }

    const seen = seenRef.current;
    const fresh = list.filter((item) => !item.read && !seen.has(item.id));
    if (fresh.length === 0) return;

    fresh.forEach((item) => seen.add(item.id));
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));

    if (!pushReady.current) pushReady.current = await preparePushAlerts();
    if (!pushReady.current) return;

    // 时间正序弹出，保证最新一条落在通知中心最上方
    for (const item of [...fresh].reverse()) {
      await showJoinAlert({
        notificationId: item.id,
        recruitmentId: item.recruitmentId,
        recruitmentTitle: item.recruitmentTitle,
        joinerName: item.joinerName,
        contactLabel: contactTypeMeta(item.joinerContactType).label,
        contact: item.joinerContact,
      });
    }
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setItems([]);
        return;
      }
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const list = await dataAdapter.notifications.list(user);
        setItems(list);
        await notifyNewJoins(list);
      } catch (cause) {
        setError(toErrorMessage(cause));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [notifyNewJoins, user],
  );

  useEffect(() => {
    if (status === 'signedIn') {
      // 登录态就绪后拉取通知；状态更新发生在异步回调里
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refresh();
    } else if (status === 'signedOut') {
      setItems([]);
      setError(null);
      setLoading(false);
    }
  }, [status, refresh]);

  // 登录后创建通知渠道并申请权限（Android 13+ 会弹系统授权框）
  useEffect(() => {
    if (status !== 'signedIn') {
      pushReady.current = false;
      return;
    }
    let alive = true;
    void preparePushAlerts().then((granted) => {
      if (alive) pushReady.current = granted;
    });
    return () => {
      alive = false;
    };
  }, [status]);

  // 前台轮询：新成员加入后尽快弹出系统通知，同时保持 Tab 角标最新
  useEffect(() => {
    if (status !== 'signedIn' || !user) return;
    const timer = setInterval(() => {
      void refresh({ silent: true });
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [status, refresh, user]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;
      const target = items.find((item) => item.id === id);
      if (!target || target.read) return;
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      try {
        await dataAdapter.notifications.markRead(id, user);
      } catch (cause) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: false } : item)));
        setError(toErrorMessage(cause));
      }
    },
    [items, user],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = items.filter((item) => !item.read);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await Promise.all(unread.map((item) => dataAdapter.notifications.markRead(item.id, user)));
    } catch (cause) {
      setError(toErrorMessage(cause));
      await refresh({ silent: true });
    }
  }, [items, refresh, user]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ items, unreadCount, loading, error, refresh, markRead, markAllRead }),
    [items, unreadCount, loading, error, refresh, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications 必须在 NotificationsProvider 内部使用');
  return context;
}
