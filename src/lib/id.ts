/** 生成带前缀的本地主键，便于在日志中区分实体类型。 */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

/** 用于列表 key / 本地存储分页游标等场景的稳定 id。 */
export function createNotificationId(): string {
  return createId('ntf');
}

export function createJoinId(): string {
  return createId('join');
}

export function createRecruitmentId(): string {
  return createId('rc');
}

export function createUserId(): string {
  return createId('user');
}
