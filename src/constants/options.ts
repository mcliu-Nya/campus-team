import type { Ionicons } from '@expo/vector-icons';

import type { ActivityType, ContactType, PublishedWithin, RecruitStatus, SpotFilter } from '@/types/models';

export type IconName = keyof typeof Ionicons.glyphMap;

/** 二级学院（登录、发布、筛选共用同一份列表，顺序与学校官网一致） */
export const COLLEGES = [
  '电子技术与工程学院',
  '通信与信息工程学院',
  '机械与能源工程学院',
  '经济与管理学院',
  '中德工程学院',
  '设计与艺术学院',
  '外语学院',
  '马克思主义学院',
  '公共基础学院',
  '消防救援与贯通学院',
  '申安网络安全产业学院',
  '创新创业（世赛）学院',
  '继续教育学院',
] as const;

export type College = (typeof COLLEGES)[number];

/** 活动类型 */
export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: IconName }[] = [
  { value: 'competition', label: '学科竞赛', icon: 'trophy-outline' },
  { value: 'research', label: '科研项目', icon: 'flask-outline' },
  { value: 'innovation', label: '创新创业', icon: 'bulb-outline' },
  { value: 'practice', label: '社会实践', icon: 'people-outline' },
  { value: 'sports', label: '文体活动', icon: 'basketball-outline' },
  { value: 'volunteer', label: '志愿服务', icon: 'heart-outline' },
  { value: 'other', label: '其他', icon: 'apps-outline' },
];

export const ACTIVITY_TYPE_MAP: Record<ActivityType, { label: string; icon: IconName }> =
  ACTIVITY_TYPES.reduce(
    (acc, item) => ({ ...acc, [item.value]: { label: item.label, icon: item.icon } }),
    {} as Record<ActivityType, { label: string; icon: IconName }>,
  );

/** 联系方式类型：展示顺序 QQ / 微信 / 电话，发布与加入表单共用 */
export const CONTACT_TYPES: {
  value: ContactType;
  label: string;
  icon: IconName;
  placeholder: string;
  keyboardType: 'default' | 'phone-pad' | 'number-pad';
  hint: string;
}[] = [
  {
    value: 'qq',
    label: 'QQ',
    icon: 'chatbubbles-outline',
    placeholder: 'QQ 号，例如 123456789',
    keyboardType: 'number-pad',
    hint: '5-11 位数字，首位不能为 0',
  },
  {
    value: 'wechat',
    label: '微信',
    icon: 'logo-wechat',
    placeholder: '微信号，例如 wx_student2026',
    keyboardType: 'default',
    hint: '6-20 位字母、数字、下划线或减号，需以字母开头',
  },
  {
    value: 'phone',
    label: '电话',
    icon: 'call-outline',
    placeholder: '手机号，例如 13800001234',
    keyboardType: 'phone-pad',
    hint: '11 位手机号，或带区号的座机号（如 010-12345678）',
  },
];

export type ContactTypeMeta = (typeof CONTACT_TYPES)[number];

export const DEFAULT_CONTACT_TYPE: ContactType = 'wechat';

export const CONTACT_TYPE_MAP: Record<ContactType, ContactTypeMeta> = CONTACT_TYPES.reduce(
  (acc, item) => ({ ...acc, [item.value]: item }),
  {} as Record<ContactType, ContactTypeMeta>,
);

export function contactTypeLabel(type: ContactType): string {
  return CONTACT_TYPE_MAP[type]?.label ?? '联系方式';
}

/** 展示用：历史数据或后端缺字段时退回默认类型，避免读取 undefined 崩溃 */
export function contactTypeMeta(type: ContactType | null | undefined): ContactTypeMeta {
  return CONTACT_TYPE_MAP[type ?? DEFAULT_CONTACT_TYPE] ?? CONTACT_TYPE_MAP.wechat;
}

/** 剩余名额筛选 */
export const SPOT_OPTIONS: { value: SpotFilter; label: string; hint: string }[] = [
  { value: 'any', label: '全部', hint: '不限名额' },
  { value: 'available', label: '还有名额', hint: '至少 1 个空位' },
  { value: 'scarce', label: '仅剩 1-2 个', hint: '手慢无' },
];

/** 发布时间筛选 */
export const PUBLISHED_WITHIN_OPTIONS: { value: PublishedWithin; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: '1d', label: '24 小时内' },
  { value: '3d', label: '3 天内' },
  { value: '7d', label: '7 天内' },
];

export const PUBLISHED_WITHIN_DAYS: Record<PublishedWithin, number | null> = {
  all: null,
  '1d': 1,
  '3d': 3,
  '7d': 7,
};

/** 招募状态展示 */
export const STATUS_META: Record<
  RecruitStatus,
  { label: string; color: string; background: string; icon: IconName }
> = {
  recruiting: {
    label: '招募中',
    color: '#0E9F6E',
    background: '#E6F7F0',
    icon: 'megaphone-outline',
  },
  full: { label: '已满员', color: '#B45309', background: '#FEF3C7', icon: 'checkmark-done-outline' },
  ended: { label: '已结束', color: '#475569', background: '#EEF2F6', icon: 'flag-outline' },
  cancelled: { label: '已取消', color: '#DC2626', background: '#FEE2E2', icon: 'close-circle-outline' },
};

/** 报名截止时间快捷选项（天），截止时间是必填项 */
export const DEADLINE_PRESETS: { value: number; label: string }[] = [
  { value: 3, label: '3 天后' },
  { value: 7, label: '1 周后' },
  { value: 14, label: '2 周后' },
];
