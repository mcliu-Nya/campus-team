/** 时间工具：对外统一使用 ISO 8601 字符串，展示层做本地化格式化。 */

const pad = (value: number): string => String(value).padStart(2, '0');

export function nowIso(): string {
  return new Date().toISOString();
}

export function toIso(date: Date): string {
  return date.toISOString();
}

export function isoFromNow(options: { days?: number; hours?: number; minutes?: number }): string {
  const { days = 0, hours = 0, minutes = 0 } = options;
  const ms = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

export function addDays(days: number): string {
  return isoFromNow({ days });
}

/** 默认报名截止时间：明天 18:00（发布表单的初始值） */
export function defaultDeadlineIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date.toISOString();
}

function safeDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidIso(input: string | null | undefined): boolean {
  return safeDate(input) !== null;
}

export function isPast(input: string | null | undefined): boolean {
  const date = safeDate(input);
  return date !== null && date.getTime() < Date.now();
}

/** 2026-11-09 18:00 */
export function formatDateTime(input: string | null | undefined): string {
  const date = safeDate(input);
  if (!date) return '—';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** 11-09 */
export function formatShortDate(input: string | null | undefined): string {
  const date = safeDate(input);
  if (!date) return '—';
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 刚刚 / 12 分钟前 / 3 小时前 / 2 天前 / 11-09 */
export function formatRelative(input: string | null | undefined): string {
  const date = safeDate(input);
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return formatDateTime(input);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return formatShortDate(input);
}

/** 距离截止还有多久，用于详情页提示 */
export function formatDeadlineHint(input: string | null | undefined): string {
  const date = safeDate(input);
  if (!date) return '未设置截止时间';
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return '报名已截止';
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return '报名即将截止';
  if (hours < 24) return `还有 ${hours} 小时截止`;
  return `还有 ${Math.floor(hours / 24)} 天截止`;
}
