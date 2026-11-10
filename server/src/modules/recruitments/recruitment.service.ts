import { Prisma, type RecruitStatus } from '@prisma/client';
import { z } from 'zod';

import { errors } from '../../lib/http.js';
import { maskContact, maskStudentId } from '../../lib/mask.js';
import { prisma } from '../../lib/prisma.js';
import type {
  MemberViewDto,
  PublisherViewDto,
  RecruitmentDetailDto,
  RecruitmentSummaryDto,
  TeamEntryDto,
} from '../../types/dto.js';

const PREVIEW_LENGTH = 52;

const contactTypeSchema = z.enum(['qq', 'wechat', 'phone']);
export type ContactType = z.infer<typeof contactTypeSchema>;

const CONTACT_PATTERNS: Record<ContactType, RegExp[]> = {
  qq: [/^[1-9]\d{4,10}$/],
  wechat: [/^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/],
  phone: [/^1[3-9]\d{9}$/, /^0\d{2,3}-?\d{7,8}$/],
};

const CONTACT_TYPE_HINT =
  '联系方式与所选类型不匹配：QQ 需 5-11 位数字，微信需 6-20 位字母/数字/下划线，电话需 11 位手机号或带区号座机';

function matchesContactType(type: ContactType, contact: string): boolean {
  return CONTACT_PATTERNS[type].some((pattern) => pattern.test(contact));
}

const recruitmentInclude = {
  publisher: true,
  joins: { where: { status: 'active' as const }, orderBy: { joinedAt: 'asc' as const } },
} satisfies Prisma.RecruitmentInclude;

type RecruitmentRow = Prisma.RecruitmentGetPayload<{ include: typeof recruitmentInclude }>;
type JoinRow = RecruitmentRow['joins'][number];

export const writeSchema = z.object({
  title: z.string().trim().min(4, '活动名称至少 4 个字').max(40, '活动名称最多 40 个字'),
  college: z.string().trim().min(2, '请选择二级学院').max(40, '学院名称过长'),
  activityType: z.enum(['competition', 'research', 'innovation', 'practice', 'sports', 'volunteer', 'other']),
  neededCount: z.coerce.number().int('需要人数必须是整数').min(1, '至少需要 1 人').max(100, '最多 100 人'),
  requirements: z.string().trim().min(5, '请写清队员要求').max(300, '要求最多 300 字'),
  contactType: contactTypeSchema,
  contact: z.string().trim().min(5, '请填写有效的联系方式').max(60, '联系方式过长'),
  activityUrl: z.string().trim().url('活动链接格式不正确'),
  extra: z.string().trim().max(500, '补充内容最多 500 字').default(''),
  deadline: z
    .string()
    .datetime({ offset: true })
    .refine((value) => new Date(value).getTime() > Date.now(), '截止时间需晚于当前时间'),
}).superRefine((value, ctx) => {
  if (!matchesContactType(value.contactType, value.contact)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contact'], message: CONTACT_TYPE_HINT });
  }
});

export interface ListQuery {
  keyword?: string;
  college?: string[];
  type?: string[];
  spot?: 'any' | 'available' | 'scarce';
  publishedWithin?: 'all' | '1d' | '3d' | '7d';
  page?: number;
  pageSize?: number;
}

const WITHIN_DAYS: Record<string, number | null> = { all: null, '1d': 1, '3d': 3, '7d': 7 };

function preview(text: string): string {
  return text.length <= PREVIEW_LENGTH ? text : `${text.slice(0, PREVIEW_LENGTH)}…`;
}

function toSummary(row: RecruitmentRow): RecruitmentSummaryDto {
  return {
    id: row.id,
    title: row.title,
    college: row.college,
    activityType: row.activityType,
    neededCount: row.neededCount,
    joinedCount: row.joins.length,
    remainingCount: Math.max(row.neededCount - row.joins.length, 0),
    requirementsPreview: preview(row.requirements),
    publisherId: row.publisherId,
    publisherName: row.publisherName,
    publisherCollege: row.publisherCollege,
    deadline: row.deadline?.toISOString() ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMemberView(join: JoinRow): MemberViewDto {
  return {
    joinId: join.id,
    userId: join.userId,
    realName: join.realName,
    studentId: join.studentId,
    college: join.college,
    contact: join.contact,
    contactType: join.contactType,
    joinedAt: join.joinedAt.toISOString(),
  };
}

function toPublisherView(row: RecruitmentRow, reveal: boolean): PublisherViewDto {
  return {
    userId: row.publisherId,
    realName: row.publisherName,
    college: row.publisherCollege,
    studentId: reveal ? row.publisher.studentId : maskStudentId(row.publisher.studentId),
    contact: reveal ? row.contact : maskContact(row.contact),
    contactType: row.contactType,
  };
}

function lockMessage(status: RecruitStatus): string {
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

export function toDetail(row: RecruitmentRow, viewerId?: string): RecruitmentDetailDto {
  const isPublisher = viewerId === row.publisherId;
  const myJoin = viewerId ? row.joins.find((join) => join.userId === viewerId) : undefined;
  const isMember = isPublisher || Boolean(myJoin);
  const remainingCount = Math.max(row.neededCount - row.joins.length, 0);

  let canJoin = false;
  let joinBlockedReason: string | null = null;

  if (!viewerId) {
    joinBlockedReason = '登录后可加入队伍';
  } else if (isPublisher) {
    joinBlockedReason = '这是你发布的招募';
  } else if (myJoin) {
    joinBlockedReason = '你已在队伍中';
  } else if (remainingCount <= 0 || row.status === 'full') {
    joinBlockedReason = '名额已满';
  } else if (row.status !== 'recruiting') {
    joinBlockedReason = lockMessage(row.status);
  } else {
    canJoin = true;
  }

  return {
    ...toSummary(row),
    requirements: row.requirements,
    extra: row.extra,
    activityUrl: row.activityUrl,
    contactMasked: maskContact(row.contact),
    contact: isMember ? row.contact : null,
    contactType: row.contactType,
    publisher: toPublisherView(row, isMember),
    members: isMember ? row.joins.map(toMemberView) : [],
    viewerIsPublisher: isPublisher,
    viewerHasJoined: Boolean(myJoin),
    viewerJoinedAt: myJoin?.joinedAt.toISOString() ?? null,
    canJoin,
    joinBlockedReason,
  };
}

async function findRow(id: string): Promise<RecruitmentRow> {
  const row = await prisma.recruitment.findUnique({ where: { id }, include: recruitmentInclude });
  if (!row) throw errors.notFound('招募不存在或已被删除');
  return row;
}

/** 惰性处理过期招募：截止时间已过且仍在招募中/已满员 → ended。 */
async function expireOverdue(): Promise<void> {
  await prisma.recruitment.updateMany({
    where: { status: { in: ['recruiting', 'full'] }, deadline: { lt: new Date() } },
    data: { status: 'ended' },
  });
}

export async function list(query: ListQuery) {
  await expireOverdue();

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 10)));
  const spot = query.spot ?? 'any';

  // 满员招募不下架：仍出现在首页，归入「已满员」分组并排在 recruiting 之后
  const where: Prisma.RecruitmentWhereInput = { status: { in: ['recruiting', 'full'] } };

  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { requirements: { contains: keyword, mode: 'insensitive' } },
      { extra: { contains: keyword, mode: 'insensitive' } },
      { publisherName: { contains: keyword, mode: 'insensitive' } },
      { college: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (query.college?.length) where.college = { in: query.college };
  if (query.type?.length) {
    where.activityType = { in: query.type as Prisma.EnumActivityTypeFilter['in'] };
  }
  const withinDays = WITHIN_DAYS[query.publishedWithin ?? 'all'];
  if (withinDays) {
    where.createdAt = { gte: new Date(Date.now() - withinDays * 86_400_000) };
  }

  // spot 依赖 joined_count 与 needed_count 的差值，Prisma 无法直接表达，草案阶段在内存中过滤。
  // 数据量增大后应改为 SQL：needed_count - joined_count BETWEEN 1 AND 2。
  if (spot !== 'any') {
    const rows = await prisma.recruitment.findMany({
      where,
      include: recruitmentInclude,
      // 枚举定义顺序为 recruiting → full，asc 即「招募中在前、已满员在后」
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    const filtered = rows.filter((row) => {
      const remaining = row.neededCount - row.joins.length;
      return spot === 'available' ? remaining > 0 : remaining > 0 && remaining <= 2;
    });
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize).map(toSummary),
      total: filtered.length,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.recruitment.findMany({
      where,
      include: recruitmentInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.recruitment.count({ where }),
  ]);

  return {
    items: rows.map(toSummary),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getDetail(id: string, viewerId?: string): Promise<RecruitmentDetailDto> {
  await expireOverdue();
  return toDetail(await findRow(id), viewerId);
}

export async function create(input: unknown, userId: string): Promise<RecruitmentDetailDto> {
  const data = writeSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw errors.authRequired('登录状态已失效，请重新登录');

  const created = await prisma.recruitment.create({
    data: {
      title: data.title,
      college: data.college,
      activityType: data.activityType,
      neededCount: data.neededCount,
      requirements: data.requirements,
      contactType: data.contactType,
      contact: data.contact,
      activityUrl: data.activityUrl,
      extra: data.extra,
      deadline: new Date(data.deadline),
      publisherId: user.id,
      publisherName: user.realName,
      publisherCollege: user.college,
      status: 'recruiting',
      joinedCount: 0,
    },
  });

  return getDetail(created.id, userId);
}

export async function update(id: string, input: unknown, userId: string): Promise<RecruitmentDetailDto> {
  const data = writeSchema.parse(input);
  const row = await findRow(id);
  if (row.publisherId !== userId) throw errors.forbidden('只有发布者可以执行该操作');
  if (row.status === 'cancelled') throw errors.invalidStatus('已取消的招募不能编辑，请重新发布');

  const activeCount = row.joins.length;
  if (data.neededCount < activeCount) {
    throw errors.validation(`需要人数不能少于已加入人数（${activeCount} 人）`);
  }

  let status = row.status;
  if (status === 'full' && data.neededCount > activeCount) status = 'recruiting';
  if (status === 'ended' && new Date(data.deadline).getTime() > Date.now()) {
    // 延长截止时间后重新开放报名
    status = 'recruiting';
  }

  await prisma.recruitment.update({
    where: { id },
    data: {
      title: data.title,
      college: data.college,
      activityType: data.activityType,
      neededCount: data.neededCount,
      requirements: data.requirements,
      contactType: data.contactType,
      contact: data.contact,
      activityUrl: data.activityUrl,
      extra: data.extra,
      deadline: new Date(data.deadline),
      status,
    },
  });

  return getDetail(id, userId);
}

export const joinSchema = z
  .object({
    contactType: contactTypeSchema,
    contact: z.string().trim().min(5, '请填写有效的联系方式').max(60, '联系方式过长'),
  })
  .superRefine((value, ctx) => {
    if (!matchesContactType(value.contactType, value.contact)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contact'], message: CONTACT_TYPE_HINT });
    }
  });

export async function join(id: string, input: unknown, userId: string): Promise<RecruitmentDetailDto> {
  const { contact, contactType } = joinSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const row = await tx.recruitment.findUnique({ where: { id }, include: recruitmentInclude });
    if (!row) throw errors.notFound('招募不存在或已被删除');
    if (row.publisherId === userId) throw errors.forbidden('这是你发布的招募，无需加入');
    if (row.status !== 'recruiting') throw errors.invalidStatus(lockMessage(row.status));

    const activeCount = row.joins.length;
    if (activeCount >= row.neededCount) throw errors.full();

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw errors.authRequired('登录状态已失效，请重新登录');

    const existing = await tx.joinRecord.findUnique({
      where: { recruitmentId_userId: { recruitmentId: id, userId } },
    });

    const snapshot = {
      realName: user.realName,
      studentId: user.studentId,
      college: user.college,
      contact,
      contactType,
      status: 'active' as const,
      joinedAt: new Date(),
    };

    if (existing) {
      if (existing.status === 'active') throw errors.alreadyJoined();
      await tx.joinRecord.update({ where: { id: existing.id }, data: snapshot });
    } else {
      await tx.joinRecord.create({ data: { recruitmentId: id, userId, ...snapshot } });
    }

    const joinedCount = activeCount + 1;
    await tx.recruitment.update({
      where: { id },
      data: { joinedCount, status: joinedCount >= row.neededCount ? 'full' : 'recruiting' },
    });

    await tx.notification.create({
      data: {
        recipientUserId: row.publisherId,
        recruitmentId: id,
        recruitmentTitle: row.title,
        joinerUserId: user.id,
        joinerName: user.realName,
        joinerStudentId: user.studentId,
        joinerCollege: user.college,
        joinerContact: contact,
        joinerContactType: contactType,
        content: `「${row.title}」有新成员加入`,
        read: false,
      },
    });
  });

  return getDetail(id, userId);
}

export async function leave(id: string, userId: string): Promise<RecruitmentDetailDto> {
  await prisma.$transaction(async (tx) => {
    const row = await tx.recruitment.findUnique({ where: { id }, include: recruitmentInclude });
    if (!row) throw errors.notFound('招募不存在或已被删除');
    if (row.publisherId === userId) {
      throw errors.forbidden('发布者不能退出自己的队伍，可选择取消招募');
    }

    const myJoin = row.joins.find((join) => join.userId === userId);
    if (!myJoin) throw errors.notFound('你还没有加入该队伍');

    await tx.joinRecord.update({ where: { id: myJoin.id }, data: { status: 'left' } });

    const joinedCount = row.joins.length - 1;
    const status: RecruitStatus =
      row.status === 'full' && joinedCount < row.neededCount ? 'recruiting' : row.status;
    await tx.recruitment.update({ where: { id }, data: { joinedCount, status } });
  });

  return getDetail(id, userId);
}

export async function removeMember(
  id: string,
  joinId: string,
  userId: string,
): Promise<RecruitmentDetailDto> {
  await prisma.$transaction(async (tx) => {
    const row = await tx.recruitment.findUnique({ where: { id }, include: recruitmentInclude });
    if (!row) throw errors.notFound('招募不存在或已被删除');
    if (row.publisherId !== userId) throw errors.forbidden('只有发布者可以执行该操作');

    const target = row.joins.find((join) => join.id === joinId);
    if (!target) throw errors.notFound('成员不存在或已退出');

    await tx.joinRecord.update({ where: { id: target.id }, data: { status: 'removed' } });

    const joinedCount = row.joins.length - 1;
    const status: RecruitStatus =
      row.status === 'full' && joinedCount < row.neededCount ? 'recruiting' : row.status;
    await tx.recruitment.update({ where: { id }, data: { joinedCount, status } });
  });

  return getDetail(id, userId);
}

/**
 * 物理删除：仅发布者可删除已满员 / 已结束 / 已取消的招募。
 * 招募及其加入记录、相关通知一并删除，不在数据库中保留历史数据。
 */
export async function remove(id: string, userId: string): Promise<void> {
  const row = await findRow(id);
  if (row.publisherId !== userId) throw errors.forbidden('只有发布者可以执行该操作');
  if (row.status === 'recruiting') {
    throw errors.invalidStatus('招募中的活动不能删除，请先取消招募');
  }
  if (row.status === 'full') {
    throw errors.invalidStatus('已满员的活动仍在展示中，请取消招募或等到报名截止后再删除');
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { recruitmentId: id } }),
    prisma.joinRecord.deleteMany({ where: { recruitmentId: id } }),
    prisma.recruitment.delete({ where: { id } }),
  ]);
}

export async function cancel(id: string, userId: string): Promise<RecruitmentDetailDto> {
  const row = await findRow(id);
  if (row.publisherId !== userId) throw errors.forbidden('只有发布者可以执行该操作');
  if (row.status === 'cancelled') throw errors.invalidStatus('该招募已经是取消状态');

  await prisma.recruitment.update({ where: { id }, data: { status: 'cancelled' } });
  return getDetail(id, userId);
}

export async function reopen(
  id: string,
  userId: string,
  neededCountInput?: unknown,
): Promise<RecruitmentDetailDto> {
  const row = await findRow(id);
  if (row.publisherId !== userId) throw errors.forbidden('只有发布者可以执行该操作');
  if (row.status === 'recruiting') throw errors.invalidStatus('该招募仍在招募中');

  const activeCount = row.joins.length;
  const fallback = Math.max(row.neededCount, activeCount + 1);
  const neededCount =
    neededCountInput === undefined || neededCountInput === null
      ? fallback
      : z.coerce.number().int().min(1).max(100).parse(neededCountInput);

  if (neededCount <= activeCount) {
    throw errors.validation(`需要人数必须大于已加入人数（${activeCount} 人）`);
  }

  const deadline =
    row.deadline && row.deadline.getTime() > Date.now()
      ? row.deadline
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.recruitment.update({
    where: { id },
    data: { status: 'recruiting', neededCount, deadline },
  });

  return getDetail(id, userId);
}

export async function myTeams(userId: string): Promise<TeamEntryDto[]> {
  const rows = await prisma.recruitment.findMany({
    where: {
      status: { notIn: ['cancelled'] },
      OR: [{ publisherId: userId }, { joins: { some: { userId, status: 'active' } } }],
    },
    include: recruitmentInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map((row) => {
    const isPublisher = row.publisherId === userId;
    const myJoin = row.joins.find((join) => join.userId === userId);
    return {
      recruitment: toSummary(row),
      role: isPublisher ? 'publisher' : 'member',
      joinedAt: myJoin?.joinedAt.toISOString() ?? null,
      myContact: isPublisher ? row.contact : (myJoin?.contact ?? ''),
      myContactType: isPublisher ? row.contactType : (myJoin?.contactType ?? 'wechat'),
      publisher: toPublisherView(row, true),
      members: row.joins.map(toMemberView),
    };
  });
}

export async function myRecruitments(userId: string): Promise<RecruitmentSummaryDto[]> {
  const rows = await prisma.recruitment.findMany({
    // 满员但未到截止时间仍属「进行中」
    where: { publisherId: userId, status: { in: ['recruiting', 'full'] } },
    include: recruitmentInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toSummary);
}

export async function myEnded(userId: string): Promise<RecruitmentSummaryDto[]> {
  const rows = await prisma.recruitment.findMany({
    where: { publisherId: userId, status: { in: ['ended', 'cancelled'] } },
    include: recruitmentInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(toSummary);
}
