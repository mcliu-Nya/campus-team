import type { AppNotification, JoinRecord, Recruitment, User } from '@/types/models';
import { normalizeCollege } from '@/lib/college';
import { normalizeContactType } from '@/lib/contact';
import { STORAGE_KEYS, SCHEMA_VERSION, localStore, type LocalDb } from '@/services/storage/localStore';
import { createSeedDb } from './seed';

/**
 * 本地数据库访问层：读取、写入、状态校正、首启种子。
 * 所有 LocalRepository 都通过 withDb 进入串行事务。
 */

export async function readDb(): Promise<LocalDb> {
  const [users, recruitments, joins, notifications] = await Promise.all([
    localStore.read<User[]>(STORAGE_KEYS.users, []),
    localStore.read<Recruitment[]>(STORAGE_KEYS.recruitments, []),
    localStore.read<JoinRecord[]>(STORAGE_KEYS.joins, []),
    localStore.read<AppNotification[]>(STORAGE_KEYS.notifications, []),
  ]);
  return {
    // 学院名单调整过：旧缓存里的通用学院名在读取时就地改名，避免出现两套写法
    users: users.map((item) => ({ ...item, college: normalizeCollege(item.college) })),
    // 旧版本缓存没有 contactType 字段，读取时按号码形态补齐，避免类型选择器读到 undefined
    recruitments: recruitments.map((item) => ({
      ...item,
      college: normalizeCollege(item.college),
      publisherCollege: normalizeCollege(item.publisherCollege),
      contactType: normalizeContactType(item.contactType, item.contact),
    })),
    joins: joins.map((item) => ({
      ...item,
      college: normalizeCollege(item.college),
      contactType: normalizeContactType(item.contactType, item.contact),
    })),
    notifications: notifications.map((item) => ({
      ...item,
      joinerCollege: normalizeCollege(item.joinerCollege),
      joinerContactType: normalizeContactType(item.joinerContactType, item.joinerContact),
    })),
  };
}

export async function writeDb(db: LocalDb): Promise<void> {
  await Promise.all([
    localStore.write(STORAGE_KEYS.users, db.users),
    localStore.write(STORAGE_KEYS.recruitments, db.recruitments),
    localStore.write(STORAGE_KEYS.joins, db.joins),
    localStore.write(STORAGE_KEYS.notifications, db.notifications),
  ]);
}

let seedPromise: Promise<void> | null = null;

/** 首启写入演示数据；多次调用只执行一次。 */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = localStore.transaction(async () => {
      const seeded = await localStore.read<boolean>(STORAGE_KEYS.seeded, false);
      if (!seeded) {
        const db = await readDb();
        if (db.recruitments.length === 0 && db.users.length === 0) {
          await writeDb(createSeedDb());
        }
        await localStore.write(STORAGE_KEYS.seeded, true);
      }

      // 结构升级：把读取时归一化的结果（学院改名、联系方式类型补齐）持久化一次
      const version = await localStore.read<number>(STORAGE_KEYS.schema, 0);
      if (version < SCHEMA_VERSION) {
        await writeDb(await readDb());
        await localStore.write(STORAGE_KEYS.schema, SCHEMA_VERSION);
      }
    });
  }
  return seedPromise;
}

/**
 * 状态校正：
 * - joinedCount 始终由 active 加入记录推导；
 * - 满员 -> full（仍留在首页展示，归入「已满员」分组）；有人退出后回到 recruiting；
 * - 超过报名截止时间 -> ended（含已满员的招募）；
 * - cancelled / ended 不会被自动改写。
 */
export function recomputeRecruitmentStatuses(db: LocalDb): boolean {
  let changed = false;
  const counts = new Map<string, number>();
  db.joins
    .filter((join) => join.status === 'active')
    .forEach((join) => {
      counts.set(join.recruitmentId, (counts.get(join.recruitmentId) ?? 0) + 1);
    });

  const timestamp = Date.now();
  db.recruitments.forEach((recruitment) => {
    const joined = counts.get(recruitment.id) ?? 0;
    if (recruitment.joinedCount !== joined) {
      recruitment.joinedCount = joined;
      changed = true;
    }
    if (recruitment.status === 'cancelled' || recruitment.status === 'ended') return;

    if (recruitment.status === 'full' && joined < recruitment.neededCount) {
      recruitment.status = 'recruiting';
      changed = true;
    } else if (recruitment.status === 'recruiting' && joined >= recruitment.neededCount) {
      recruitment.status = 'full';
      changed = true;
    }

    if (
      (recruitment.status === 'recruiting' || recruitment.status === 'full') &&
      recruitment.deadline &&
      new Date(recruitment.deadline).getTime() < timestamp
    ) {
      recruitment.status = 'ended';
      changed = true;
    }
  });

  return changed;
}

export interface WithDbOptions {
  readOnly?: boolean;
}

/** 串行事务：进入时校正状态，退出时落盘。 */
export async function withDb<T>(
  task: (db: LocalDb) => T | Promise<T>,
  options: WithDbOptions = {},
): Promise<T> {
  await ensureSeeded();
  return localStore.transaction(async () => {
    const db = await readDb();
    const changed = recomputeRecruitmentStatuses(db);
    const result = await task(db);
    if (!options.readOnly || changed) {
      await writeDb(db);
    }
    return result;
  });
}
