/**
 * 领域模型定义。
 * 前后端共享同一份类型（未来 server 可直接复用或由 Prisma 生成后对齐）。
 * 所有时间字段统一使用 ISO 8601 字符串，例如 "2026-11-09T09:57:19.000Z"。
 */

export type ISODateString = string;

/** 联系方式类型：电话 / 微信 / QQ */
export type ContactType = 'phone' | 'wechat' | 'qq';

/**
 * 招募状态：招募中 / 已满员 / 已结束 / 已取消。
 * 满员后仍会展示在首页，直到报名截止；删除操作会直接移除记录。
 */
export type RecruitStatus = 'recruiting' | 'full' | 'ended' | 'cancelled';

/** 活动类型 */
export type ActivityType =
  | 'competition'
  | 'research'
  | 'innovation'
  | 'practice'
  | 'sports'
  | 'volunteer'
  | 'other';

/** 用户（登录身份） */
export interface User {
  id: string;
  realName: string;
  studentId: string;
  college: string;
  createdAt: ISODateString;
}

/** 招募完整记录（仓储层内部使用，包含明文联系方式） */
export interface Recruitment {
  id: string;
  title: string;
  college: string;
  activityType: ActivityType;
  neededCount: number;
  joinedCount: number;
  requirements: string;
  contactType: ContactType;
  contact: string;
  activityUrl: string;
  extra: string;
  deadline: ISODateString | null;
  publisherId: string;
  publisherName: string;
  publisherCollege: string;
  status: RecruitStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 列表 / 卡片使用的摘要，不包含明文联系方式 */
export interface RecruitmentSummary {
  id: string;
  title: string;
  college: string;
  activityType: ActivityType;
  neededCount: number;
  joinedCount: number;
  remainingCount: number;
  requirementsPreview: string;
  publisherId: string;
  publisherName: string;
  publisherCollege: string;
  deadline: ISODateString | null;
  status: RecruitStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 队伍成员视图（仅同队双方可见明文联系方式） */
export interface MemberView {
  joinId: string;
  userId: string;
  realName: string;
  studentId: string;
  college: string;
  contactType: ContactType;
  contact: string;
  joinedAt: ISODateString;
}

/** 发布者视图 */
export interface PublisherView {
  userId: string;
  realName: string;
  studentId: string;
  college: string;
  contactType: ContactType;
  contact: string;
}

/** 招募详情，按当前访问者计算隐私字段 */
export interface RecruitmentDetail extends RecruitmentSummary {
  requirements: string;
  extra: string;
  activityUrl: string;
  contactType: ContactType;
  contactMasked: string;
  contact: string | null;
  publisher: PublisherView;
  members: MemberView[];
  viewerIsPublisher: boolean;
  viewerHasJoined: boolean;
  viewerJoinedAt: ISODateString | null;
  canJoin: boolean;
  joinBlockedReason: string | null;
}

/** 加入记录（不做物理删除，使用状态标记） */
export type JoinStatus = 'active' | 'left' | 'removed';

export interface JoinRecord {
  id: string;
  recruitmentId: string;
  userId: string;
  realName: string;
  studentId: string;
  college: string;
  contactType: ContactType;
  contact: string;
  joinedAt: ISODateString;
  status: JoinStatus;
  updatedAt: ISODateString;
}

/** 通知：面向招募发布者 */
export interface AppNotification {
  id: string;
  recipientUserId: string;
  recruitmentId: string;
  recruitmentTitle: string;
  joinerUserId: string;
  joinerName: string;
  joinerStudentId: string;
  joinerCollege: string;
  joinerContactType: ContactType;
  joinerContact: string;
  content: string;
  read: boolean;
  createdAt: ISODateString;
}

/** “我的队伍”条目 */
export type TeamRole = 'publisher' | 'member';

export interface TeamEntry {
  recruitment: RecruitmentSummary;
  role: TeamRole;
  joinedAt: ISODateString | null;
  myContactType: ContactType;
  myContact: string;
  publisher: PublisherView;
  members: MemberView[];
}

/** 列表筛选条件 */
export type SpotFilter = 'any' | 'available' | 'scarce';
export type PublishedWithin = 'all' | '1d' | '3d' | '7d';

export interface RecruitmentQuery {
  keyword?: string;
  colleges?: string[];
  types?: ActivityType[];
  spot?: SpotFilter;
  publishedWithin?: PublishedWithin;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
