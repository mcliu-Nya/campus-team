import { COLLEGES } from '@/constants/options';

/**
 * 学院名称迁移：
 * 早期演示数据用的是通用学院名，学校正式名单调整后，读取旧缓存时就地改名，
 * 这样筛选选项、列表展示和用户资料不会出现两套写法。
 * 命中不了的旧名字保持原样，避免改写用户自己填写的内容。
 */
const LEGACY_COLLEGE_ALIASES: Record<string, string> = {
  计算机与信息工程学院: '通信与信息工程学院',
  电子与电气工程学院: '电子技术与工程学院',
  经济管理学院: '经济与管理学院',
  外国语学院: '外语学院',
  数学与统计学院: '公共基础学院',
  体育学院: '公共基础学院',
  艺术设计学院: '设计与艺术学院',
};

export function normalizeCollege(value: string | null | undefined): string {
  const name = (value ?? '').trim();
  if (!name) return '';
  return LEGACY_COLLEGE_ALIASES[name] ?? name;
}

export function isKnownCollege(value: string): boolean {
  return (COLLEGES as readonly string[]).includes(value);
}
