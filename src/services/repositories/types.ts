import type {
  AppNotification,
  Paginated,
  RecruitmentDetail,
  RecruitmentQuery,
  RecruitmentSummary,
  TeamEntry,
  User,
} from '@/types/models';
import type {
  AuthSession,
  JoinRequest,
  LoginRequest,
  RecruitmentWriteRequest,
} from '@/types/api';
import type { DataMode } from '../config';

/**
 * 仓储接口：页面只依赖这些接口，不关心本地还是远程。
 * viewer 参数让 LocalAdapter 能做权限与隐私裁剪；RemoteAdapter 则依赖 JWT。
 */

export interface AuthRepository {
  login(input: LoginRequest): Promise<AuthSession>;
  me(token: string): Promise<User>;
}

export interface RecruitmentRepository {
  list(query: RecruitmentQuery, viewer: User | null): Promise<Paginated<RecruitmentSummary>>;
  getDetail(id: string, viewer: User | null): Promise<RecruitmentDetail>;
  create(input: RecruitmentWriteRequest, viewer: User): Promise<RecruitmentDetail>;
  update(id: string, input: RecruitmentWriteRequest, viewer: User): Promise<RecruitmentDetail>;
  join(id: string, input: JoinRequest, viewer: User): Promise<RecruitmentDetail>;
  leave(id: string, viewer: User): Promise<RecruitmentDetail>;
  removeMember(id: string, joinId: string, viewer: User): Promise<RecruitmentDetail>;
  cancel(id: string, viewer: User): Promise<RecruitmentDetail>;
  /** 删除已结束 / 已取消的招募（物理删除，仅发布者可用） */
  deleteRecruitment(id: string, viewer: User): Promise<void>;
  reopen(id: string, viewer: User, neededCount?: number): Promise<RecruitmentDetail>;
  myTeams(viewer: User): Promise<TeamEntry[]>;
  myRecruitments(viewer: User): Promise<RecruitmentSummary[]>;
  myEnded(viewer: User): Promise<RecruitmentSummary[]>;
}

export interface NotificationRepository {
  list(viewer: User): Promise<AppNotification[]>;
  markRead(id: string, viewer: User): Promise<AppNotification>;
  unreadCount(viewer: User): Promise<number>;
}

/** 数据适配器：local / remote 两个实现，运行时按环境变量选择 */
export interface DataAdapter {
  readonly mode: DataMode;
  readonly auth: AuthRepository;
  readonly recruitments: RecruitmentRepository;
  readonly notifications: NotificationRepository;
}
