/** 对外 DTO：与前端 src/types/models.ts 字段一一对应（camelCase，时间为 ISO 字符串）。 */

export type ContactTypeDto = 'qq' | 'wechat' | 'phone';

export interface UserDto {
  id: string;
  realName: string;
  studentId: string;
  college: string;
  createdAt: string;
}

export interface RecruitmentSummaryDto {
  id: string;
  title: string;
  college: string;
  activityType: string;
  neededCount: number;
  joinedCount: number;
  remainingCount: number;
  requirementsPreview: string;
  publisherId: string;
  publisherName: string;
  publisherCollege: string;
  deadline: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberViewDto {
  joinId: string;
  userId: string;
  realName: string;
  studentId: string;
  college: string;
  contact: string;
  contactType: ContactTypeDto;
  joinedAt: string;
}

export interface PublisherViewDto {
  userId: string;
  realName: string;
  studentId: string;
  college: string;
  contact: string;
  contactType: ContactTypeDto;
}

export interface RecruitmentDetailDto extends RecruitmentSummaryDto {
  requirements: string;
  extra: string;
  activityUrl: string;
  contactMasked: string;
  contact: string | null;
  contactType: ContactTypeDto;
  publisher: PublisherViewDto;
  members: MemberViewDto[];
  viewerIsPublisher: boolean;
  viewerHasJoined: boolean;
  viewerJoinedAt: string | null;
  canJoin: boolean;
  joinBlockedReason: string | null;
}

export interface TeamEntryDto {
  recruitment: RecruitmentSummaryDto;
  role: 'publisher' | 'member';
  joinedAt: string | null;
  myContact: string;
  myContactType: ContactTypeDto;
  publisher: PublisherViewDto;
  members: MemberViewDto[];
}

export interface NotificationDto {
  id: string;
  recipientUserId: string;
  recruitmentId: string;
  recruitmentTitle: string;
  joinerUserId: string;
  joinerName: string;
  joinerStudentId: string;
  joinerCollege: string;
  joinerContact: string;
  joinerContactType: ContactTypeDto;
  content: string;
  read: boolean;
  createdAt: string;
}
