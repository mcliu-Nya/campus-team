import type { ContactType } from '@/types/models';

const PHONE_RE = /^1[3-9]\d{9}$/;
const QQ_RE = /^[1-9]\d{4,10}$/;

/**
 * 按号码形态推断联系方式类型。
 * 用于两处：种子数据生成，以及旧版本本地缓存（没有 contactType 字段）的兼容迁移。
 */
export function inferContactType(contact: string): ContactType {
  const value = contact.trim();
  if (PHONE_RE.test(value)) return 'phone';
  if (QQ_RE.test(value)) return 'qq';
  return 'wechat';
}

/** 读取历史数据时兜底：字段缺失或取值非法时按号码形态推断 */
export function normalizeContactType(
  type: ContactType | null | undefined,
  contact: string,
): ContactType {
  if (type === 'phone' || type === 'wechat' || type === 'qq') return type;
  return inferContactType(contact);
}
