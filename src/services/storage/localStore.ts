import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppNotification, JoinRecord, Recruitment, User } from '@/types/models';

/**
 * 本地存储键。只有 LocalAdapter 内部会读写这些键，
 * 页面 / 组件不得直接接触 AsyncStorage。
 */
export const STORAGE_KEYS = {
  users: '@campus-team/users/v1',
  session: '@campus-team/session/v1',
  recruitments: '@campus-team/recruitments/v1',
  joins: '@campus-team/joins/v1',
  notifications: '@campus-team/notifications/v1',
  seeded: '@campus-team/seeded/v1',
  schema: '@campus-team/schema/v1',
} as const;

/**
 * 本地数据结构版本：
 * 2 - 二级学院改名为学校正式名单（旧数据在读取时迁移并回写）
 */
export const SCHEMA_VERSION = 2;

export interface LocalDb {
  users: User[];
  recruitments: Recruitment[];
  joins: JoinRecord[];
  notifications: AppNotification[];
}

export const EMPTY_DB: LocalDb = {
  users: [],
  recruitments: [],
  joins: [],
  notifications: [],
};

/**
 * 极简 AsyncStorage 封装：
 * - 统一 JSON 序列化与容错；
 * - 所有写操作串行执行，避免并发 read-modify-write 丢数据。
 */
class LocalStore {
  private queue: Promise<unknown> = Promise.resolve();

  async read<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /** 串行化读改写，保证同一时刻只有一个事务在跑 */
  transaction<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /** 仅用于开发 / 测试：清空全部本地数据 */
  async resetAll(): Promise<void> {
    await this.transaction(async () => {
      await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key)));
    });
  }
}

export const localStore = new LocalStore();
