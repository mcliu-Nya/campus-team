/**
 * 日历与「自定义截止时间」纯函数：不依赖 React Native，便于测试与复用。
 * 对外仍以 ISO 8601 字符串为准，日历内部使用本地时区的年月日。
 */

const pad = (value: number): string => String(value).padStart(2, '0');

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface MonthCell {
  /** 2026-11-09，作为列表 key */
  key: string;
  day: number;
  inMonth: boolean;
  /** 早于今天或不属于当前月 → 不可选 */
  disabled: boolean;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function clampHour(hour: number): number {
  return ((hour % 24) + 24) % 24;
}

export function clampMinute(minute: number): number {
  return ((minute % 60) + 60) % 60;
}

/** 月份翻页，返回规范化后的 {year, month} */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthLabel(year: number, month: number): string {
  return `${year} 年 ${month + 1} 月`;
}

/** 2026-11-20 周五 */
export function formatDayLabel(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 周${
    WEEKDAY_LABELS[date.getDay()]
  }`;
}

/** 11-20 周五（窄屏摘要用，长度稳定） */
export function formatShortDayLabel(date: Date): string {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} 周${WEEKDAY_LABELS[date.getDay()]}`;
}

/** 18:30 */
export function formatTimeLabel(hour: number, minute: number): string {
  return `${pad(clampHour(hour))}:${pad(clampMinute(minute))}`;
}

/**
 * 按周切分的月视图，周日开头；本月之外与已过日期标记为不可选。
 * 固定 6 行（42 格）——大月/小月切换时行数不变，日历高度稳定，
 * 下方「清除截止 / 确定」按钮不会随月份跳动。
 */
export function buildMonthGrid(
  year: number,
  month: number,
  today: Date = new Date(),
): MonthCell[][] {
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const total = 6 * 7;
  const floor = startOfDay(today).getTime();

  const cells: MonthCell[] = [];
  for (let index = 0; index < total; index += 1) {
    const date = new Date(year, month, 1 - offset + index);
    const inMonth = date.getMonth() === month;
    cells.push({
      key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      day: date.getDate(),
      inMonth,
      disabled: !inMonth || startOfDay(date).getTime() < floor,
    });
  }

  const weeks: MonthCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** 把「日期 + 时分」组合成本地时区的 ISO 8601 字符串 */
export function composeIso(day: Date, hour: number, minute: number): string {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    clampHour(hour),
    clampMinute(minute),
    0,
    0,
  ).toISOString();
}

/** 解析 ISO，返回本地年月日时分；失败返回 null */
export function splitIso(input: string | null | undefined): DateParts | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

/** 打开选择器时的初始值：已有截止时间沿用，否则取「明天 18:00」 */
export function initialPickerParts(value: string | null): DateParts {
  const parts = splitIso(value);
  if (parts) return parts;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    year: tomorrow.getFullYear(),
    month: tomorrow.getMonth(),
    day: tomorrow.getDate(),
    hour: 18,
    minute: 0,
  };
}
