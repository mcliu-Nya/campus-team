import type {
  MemberView,
  Paginated,
  PublisherView,
  Recruitment,
  RecruitmentDetail,
  RecruitmentQuery,
  RecruitmentSummary,
  RecruitStatus,
  TeamEntry,
  User,
} from '@/types/models';
import type { JoinRequest, RecruitmentWriteRequest } from '@/types/api';

import { PUBLISHED_WITHIN_DAYS } from '@/constants/options';
import { addDays, nowIso } from '@/lib/date';
import { AppError } from '@/lib/errors';
import { createJoinId, createNotificationId, createRecruitmentId } from '@/lib/id';
import { maskContact, maskStudentId } from '@/lib/mask';
import { truncate } from '@/lib/text';
import { validateContact, validateRecruitmentForm } from '@/lib/validate';
import type { LocalDb } from '@/services/storage/localStore';
import type { RecruitmentRepository } from '../types';
import { withDb } from './localDb';

const PREVIEW_LENGTH = 52;

function activeJoins(db: LocalDb, recruitmentId: string) {
  return db.joins
    .filter((join) => join.recruitmentId === recruitmentId && join.status === 'active')
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

function toSummary(recruitment: Recruitment): RecruitmentSummary {
  return {
    id: recruitment.id,
    title: recruitment.title,
    college: recruitment.college,
    activityType: recruitment.activityType,
    neededCount: recruitment.neededCount,
    joinedCount: recruitment.joinedCount,
    remainingCount: Math.max(recruitment.neededCount - recruitment.joinedCount, 0),
    requirementsPreview: truncate(recruitment.requirements, PREVIEW_LENGTH),
    publisherId: recruitment.publisherId,
    publisherName: recruitment.publisherName,
    publisherCollege: recruitment.publisherCollege,
    deadline: recruitment.deadline,
    status: recruitment.status,
    createdAt: recruitment.createdAt,
    updatedAt: recruitment.updatedAt,
  };
}

function toMemberView(db: LocalDb, joinId: string): MemberView | null {
  const join = db.joins.find((item) => item.id === joinId);
  if (!join) return null;
  return {
    joinId: join.id,
    userId: join.userId,
    realName: join.realName,
    studentId: join.studentId,
    college: join.college,
    contactType: join.contactType,
    contact: join.contact,
    joinedAt: join.joinedAt,
  };
}

function publisherView(db: LocalDb, recruitment: Recruitment, reveal: boolean): PublisherView {
  const publisher = db.users.find((user) => user.id === recruitment.publisherId);
  return {
    userId: recruitment.publisherId,
    realName: recruitment.publisherName,
    studentId: reveal ? (publisher?.studentId ?? '—') : maskStudentId(publisher?.studentId ?? '—'),
    college: recruitment.publisherCollege,
    contactType: recruitment.contactType,
    contact: reveal ? recruitment.contact : maskContact(recruitment.contact),
  };
}

function statusLockMessage(status: RecruitStatus): string {
  switch (status) {
    case 'full':
      return '名额已满，暂不接收新成员';
    case 'ended':
      return '报名已截止';
    case 'cancelled':
      return '招募已取消';
    default:
      return '当前状态不可加入';
  }
}

function buildDetail(db: LocalDb, recruitment: Recruitment, viewer: User | null): RecruitmentDetail {
  const joins = activeJoins(db, recruitment.id);
  const isPublisher = viewer !== null && viewer.id === recruitment.publisherId;
  const myJoin = viewer ? joins.find((join) => join.userId === viewer.id) : undefined;
  const isMember = Boolean(myJoin) || isPublisher;
  const remainingCount = Math.max(recruitment.neededCount - recruitment.joinedCount, 0);

  let canJoin = false;
  let joinBlockedReason: string | null = null;

  if (!viewer) {
    joinBlockedReason = '登录后可加入队伍';
  } else if (isPublisher) {
    joinBlockedReason = '这是你发布的招募';
  } else if (myJoin) {
    joinBlockedReason = '你已在队伍中';
  } else if (remainingCount <= 0 || recruitment.status === 'full') {
    joinBlockedReason = '名额已满';
  } else if (recruitment.status !== 'recruiting') {
    joinBlockedReason = statusLockMessage(recruitment.status);
  } else {
    canJoin = true;
  }

  return {
    ...toSummary(recruitment),
    requirements: recruitment.requirements,
    extra: recruitment.extra,
    activityUrl: recruitment.activityUrl,
    contactType: recruitment.contactType,
    contactMasked: maskContact(recruitment.contact),
    contact: isMember ? recruitment.contact : null,
    publisher: publisherView(db, recruitment, isMember),
    members: isMember
      ? joins
          .map((join) => toMemberView(db, join.id))
          .filter((member): member is MemberView => member !== null)
      : [],
    viewerIsPublisher: isPublisher,
    viewerHasJoined: Boolean(myJoin),
    viewerJoinedAt: myJoin?.joinedAt ?? null,
    canJoin,
    joinBlockedReason,
  };
}

function assertWriteInput(input: RecruitmentWriteRequest): void {
  const errors = validateRecruitmentForm({
    title: input.title,
    college: input.college,
    activityType: input.activityType,
    neededCount: String(input.neededCount),
    requirements: input.requirements,
    contactType: input.contactType,
    contact: input.contact,
    activityUrl: input.activityUrl,
    extra: input.extra,
    deadline: input.deadline,
  });
  const firstError = Object.values(errors).find(Boolean);
  if (firstError) throw new AppError('VALIDATION_ERROR', firstError);
}

function findRecruitment(db: LocalDb, id: string): Recruitment {
  const recruitment = db.recruitments.find((item) => item.id === id);
  if (!recruitment) {
    throw new AppError('NOT_FOUND', '招募不存在或已被删除');
  }
  return recruitment;
}

function assertPublisher(recruitment: Recruitment, viewer: User): void {
  if (recruitment.publisherId !== viewer.id) {
    throw new AppError('FORBIDDEN', '只有发布者可以执行该操作');
  }
}

/** 本地实现：所有状态规则（防重复、满员、归档、通知）都在这里收口 */
export const localRecruitmentRepository: RecruitmentRepository = {
  async list(
    query: RecruitmentQuery,
    viewer: User | null,
  ): Promise<Paginated<RecruitmentSummary>> {
    void viewer; // 列表不返回明文联系方式，无需按访问者裁剪
    return withDb(
      (db) => {
        const keyword = (query.keyword ?? '').trim().toLowerCase();
        const colleges = query.colleges ?? [];
        const types = query.types ?? [];
        const spot = query.spot ?? 'any';
        const page = Math.max(1, query.page ?? 1);
        const pageSize = Math.min(Math.max(1, query.pageSize ?? 20), 100);
        const withinDays = PUBLISHED_WITHIN_DAYS[query.publishedWithin ?? 'all'];
        const timestamp = Date.now();

        // 满员招募仍留在首页（归入「已满员」分组并排在 recruiting 之后），
        // 只有到截止时间后才由 recomputeRecruitmentStatuses 转为 ended 并离开首页。
        const filtered = db.recruitments
          .filter(
            (recruitment) => recruitment.status === 'recruiting' || recruitment.status === 'full',
          )
          .filter((recruitment) => {
            if (withinDays !== null) {
              const created = new Date(recruitment.createdAt).getTime();
              if (timestamp - created > withinDays * 24 * 60 * 60 * 1000) return false;
            }
            if (colleges.length > 0 && !colleges.includes(recruitment.college)) return false;
            if (types.length > 0 && !types.includes(recruitment.activityType)) return false;

            const remaining = recruitment.neededCount - recruitment.joinedCount;
            if (spot === 'available' && remaining <= 0) return false;
            if (spot === 'scarce' && (remaining <= 0 || remaining > 2)) return false;

            if (keyword) {
              const haystack = [
                recruitment.title,
                recruitment.college,
                recruitment.requirements,
                recruitment.extra,
                recruitment.publisherName,
              ]
                .join(' ')
                .toLowerCase();
              if (!haystack.includes(keyword)) return false;
            }
            return true;
          })
          .sort((a, b) => {
            // 招募中的排在前面，已满员的默认排在最后
            if (a.status !== b.status) return a.status === 'recruiting' ? -1 : 1;
            return b.createdAt.localeCompare(a.createdAt);
          });

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize).map(toSummary);
        return { items, total, page, pageSize, hasMore: start + items.length < total };
      },
      { readOnly: true },
    );
  },

  async getDetail(id: string, viewer: User | null): Promise<RecruitmentDetail> {
    return withDb(
      (db) => {
        const recruitment = findRecruitment(db, id);
        return buildDetail(db, recruitment, viewer);
      },
      { readOnly: true },
    );
  },

  async create(input: RecruitmentWriteRequest, viewer: User): Promise<RecruitmentDetail> {
    assertWriteInput(input);
    return withDb((db) => {
      const timestamp = nowIso();
      const recruitment: Recruitment = {
        id: createRecruitmentId(),
        title: input.title.trim(),
        college: input.college.trim(),
        activityType: input.activityType,
        neededCount: Number(input.neededCount),
        joinedCount: 0,
        requirements: input.requirements.trim(),
        contactType: input.contactType,
        contact: input.contact.trim(),
        activityUrl: input.activityUrl.trim(),
        extra: input.extra.trim(),
        deadline: input.deadline,
        publisherId: viewer.id,
        publisherName: viewer.realName,
        publisherCollege: viewer.college,
        status: 'recruiting',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.recruitments.push(recruitment);
      return buildDetail(db, recruitment, viewer);
    });
  },

  async update(
    id: string,
    input: RecruitmentWriteRequest,
    viewer: User,
  ): Promise<RecruitmentDetail> {
    assertWriteInput(input);
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      assertPublisher(recruitment, viewer);
      if (recruitment.status === 'cancelled') {
        throw new AppError('INVALID_STATUS', '已取消的招募不能编辑，请重新发布');
      }
      if (Number(input.neededCount) < recruitment.joinedCount) {
        throw new AppError(
          'VALIDATION_ERROR',
          `需要人数不能少于已加入人数（${recruitment.joinedCount} 人）`,
        );
      }

      recruitment.title = input.title.trim();
      recruitment.college = input.college.trim();
      recruitment.activityType = input.activityType;
      recruitment.neededCount = Number(input.neededCount);
      recruitment.requirements = input.requirements.trim();
      recruitment.contactType = input.contactType;
      recruitment.contact = input.contact.trim();
      recruitment.activityUrl = input.activityUrl.trim();
      recruitment.extra = input.extra.trim();
      recruitment.deadline = input.deadline;
      recruitment.updatedAt = nowIso();

      // 截止时间被延长后自动恢复招募中
      if (
        recruitment.status === 'ended' &&
        (!recruitment.deadline || new Date(recruitment.deadline).getTime() > Date.now())
      ) {
        recruitment.status = 'recruiting';
      }
      return buildDetail(db, recruitment, viewer);
    });
  },

  async join(id: string, input: JoinRequest, viewer: User): Promise<RecruitmentDetail> {
    const contact = input.contact.trim();
    const contactError = validateContact(contact, input.contactType);
    if (contactError) throw new AppError('VALIDATION_ERROR', contactError);

    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      const joins = activeJoins(db, recruitment.id);

      if (recruitment.publisherId === viewer.id) {
        throw new AppError('FORBIDDEN', '这是你发布的招募，无需加入');
      }
      if (joins.some((join) => join.userId === viewer.id)) {
        throw new AppError('ALREADY_JOINED', '你已加入该队伍，请勿重复加入');
      }
      if (recruitment.status !== 'recruiting') {
        throw new AppError('INVALID_STATUS', statusLockMessage(recruitment.status));
      }
      if (recruitment.joinedCount >= recruitment.neededCount) {
        throw new AppError('RECRUITMENT_FULL', '名额已满，无法加入');
      }

      const joinedAt = nowIso();
      db.joins.push({
        id: createJoinId(),
        recruitmentId: recruitment.id,
        userId: viewer.id,
        realName: viewer.realName,
        studentId: viewer.studentId,
        college: viewer.college,
        contactType: input.contactType,
        contact,
        joinedAt,
        status: 'active',
        updatedAt: joinedAt,
      });

      recruitment.joinedCount += 1;
      recruitment.updatedAt = joinedAt;
      if (recruitment.joinedCount >= recruitment.neededCount) {
        recruitment.status = 'full';
      }

      db.notifications.unshift({
        id: createNotificationId(),
        recipientUserId: recruitment.publisherId,
        recruitmentId: recruitment.id,
        recruitmentTitle: recruitment.title,
        joinerUserId: viewer.id,
        joinerName: viewer.realName,
        joinerStudentId: viewer.studentId,
        joinerCollege: viewer.college,
        joinerContactType: input.contactType,
        joinerContact: contact,
        content: `「${recruitment.title}」有新成员加入`,
        read: false,
        createdAt: joinedAt,
      });

      return buildDetail(db, recruitment, viewer);
    });
  },

  async leave(id: string, viewer: User): Promise<RecruitmentDetail> {
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      if (recruitment.publisherId === viewer.id) {
        throw new AppError('FORBIDDEN', '发布者不能退出自己的队伍，可选择取消招募');
      }
      const join = activeJoins(db, recruitment.id).find((item) => item.userId === viewer.id);
      if (!join) throw new AppError('NOT_FOUND', '你还没有加入该队伍');

      const timestamp = nowIso();
      join.status = 'left';
      join.updatedAt = timestamp;
      recruitment.joinedCount = Math.max(recruitment.joinedCount - 1, 0);
      if (recruitment.status === 'full') recruitment.status = 'recruiting';
      recruitment.updatedAt = timestamp;

      return buildDetail(db, recruitment, viewer);
    });
  },

  async removeMember(id: string, joinId: string, viewer: User): Promise<RecruitmentDetail> {
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      assertPublisher(recruitment, viewer);
      const join = db.joins.find(
        (item) =>
          item.id === joinId && item.recruitmentId === recruitment.id && item.status === 'active',
      );
      if (!join) throw new AppError('NOT_FOUND', '成员不存在或已退出');

      const timestamp = nowIso();
      join.status = 'removed';
      join.updatedAt = timestamp;
      recruitment.joinedCount = Math.max(recruitment.joinedCount - 1, 0);
      if (recruitment.status === 'full') recruitment.status = 'recruiting';
      recruitment.updatedAt = timestamp;

      return buildDetail(db, recruitment, viewer);
    });
  },

  async cancel(id: string, viewer: User): Promise<RecruitmentDetail> {
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      assertPublisher(recruitment, viewer);
      if (recruitment.status === 'cancelled') {
        throw new AppError('INVALID_STATUS', '该招募已经是取消状态');
      }
      recruitment.status = 'cancelled';
      recruitment.updatedAt = nowIso();
      return buildDetail(db, recruitment, viewer);
    });
  },

  async reopen(id: string, viewer: User, neededCount?: number): Promise<RecruitmentDetail> {
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      assertPublisher(recruitment, viewer);
      if (recruitment.status === 'recruiting') {
        throw new AppError('INVALID_STATUS', '该招募仍在招募中，无需重新发布');
      }

      const nextNeeded = neededCount ?? Math.max(recruitment.neededCount, recruitment.joinedCount + 1);
      if (!Number.isInteger(nextNeeded) || nextNeeded < 1 || nextNeeded > 100) {
        throw new AppError('VALIDATION_ERROR', '需要人数需为 1-100 的整数');
      }
      if (nextNeeded <= recruitment.joinedCount) {
        throw new AppError(
          'VALIDATION_ERROR',
          `需要人数需大于已加入人数（${recruitment.joinedCount} 人）`,
        );
      }

      recruitment.neededCount = nextNeeded;
      recruitment.status = 'recruiting';
      if (!recruitment.deadline || new Date(recruitment.deadline).getTime() < Date.now()) {
        recruitment.deadline = addDays(7);
      }
      recruitment.updatedAt = nowIso();
      return buildDetail(db, recruitment, viewer);
    });
  },

  async deleteRecruitment(id: string, viewer: User): Promise<void> {
    return withDb((db) => {
      const recruitment = findRecruitment(db, id);
      assertPublisher(recruitment, viewer);
      if (recruitment.status === 'recruiting') {
        throw new AppError('INVALID_STATUS', '招募中的活动不能删除，请先取消招募');
      }
      if (recruitment.status === 'full') {
        throw new AppError(
          'INVALID_STATUS',
          '已满员的活动仍在展示中，请取消招募或等到报名截止后再删除',
        );
      }
      // 物理删除：招募及其加入记录、相关通知一并移除，本地不保留历史数据
      db.recruitments = db.recruitments.filter((item) => item.id !== recruitment.id);
      db.joins = db.joins.filter((join) => join.recruitmentId !== recruitment.id);
      db.notifications = db.notifications.filter(
        (notification) => notification.recruitmentId !== recruitment.id,
      );
    });
  },

  async myTeams(viewer: User): Promise<TeamEntry[]> {
    return withDb(
      (db) => {
        const entries: TeamEntry[] = [];
        db.recruitments.forEach((recruitment) => {
          if (recruitment.status === 'cancelled') return;
          const joins = activeJoins(db, recruitment.id);
          const myJoin = joins.find((join) => join.userId === viewer.id);
          const isPublisher = recruitment.publisherId === viewer.id;
          if (!isPublisher && !myJoin) return;

          entries.push({
            recruitment: toSummary(recruitment),
            role: isPublisher ? 'publisher' : 'member',
            joinedAt: myJoin?.joinedAt ?? null,
            myContactType: isPublisher ? recruitment.contactType : (myJoin?.contactType ?? 'wechat'),
            myContact: isPublisher ? recruitment.contact : (myJoin?.contact ?? ''),
            publisher: publisherView(db, recruitment, true),
            members: joins
              .map((join) => toMemberView(db, join.id))
              .filter((member): member is MemberView => member !== null),
          });
        });
        return entries.sort((a, b) =>
          b.recruitment.updatedAt.localeCompare(a.recruitment.updatedAt),
        );
      },
      { readOnly: true },
    );
  },

  async myRecruitments(viewer: User): Promise<RecruitmentSummary[]> {
    return withDb(
      (db) =>
        db.recruitments
          .filter(
            (recruitment) =>
              recruitment.publisherId === viewer.id &&
              // 满员但未到截止时间仍属「进行中」，与首页保持一致
              (recruitment.status === 'recruiting' || recruitment.status === 'full'),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map(toSummary),
      { readOnly: true },
    );
  },

  async myEnded(viewer: User): Promise<RecruitmentSummary[]> {
    return withDb(
      (db) =>
        db.recruitments
          .filter(
            (recruitment) =>
              recruitment.publisherId === viewer.id &&
              (recruitment.status === 'ended' || recruitment.status === 'cancelled'),
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map(toSummary),
      { readOnly: true },
    );
  },
};
