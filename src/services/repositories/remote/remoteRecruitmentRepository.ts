import type {
  Paginated,
  RecruitmentDetail,
  RecruitmentQuery,
  RecruitmentSummary,
  TeamEntry,
  User,
} from '@/types/models';
import type { JoinRequest, RecruitmentWriteRequest } from '@/types/api';
import { apiRequest, type QueryValue } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { RecruitmentRepository } from '../types';

function toQuery(query: RecruitmentQuery): Record<string, QueryValue> {
  return {
    keyword: query.keyword,
    // 服务端契约用单数参数名（见 docs/api.md），多值以逗号连接
    college: query.colleges?.length ? query.colleges : undefined,
    type: query.types?.length ? query.types : undefined,
    spot: query.spot,
    publishedWithin: query.publishedWithin,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/**
 * 远程实现：与 LocalAdapter 保持完全一致的方法签名。
 * 权限与隐私裁剪由后端负责（服务端能拿到 JWT 里的用户身份）。
 */
export const remoteRecruitmentRepository: RecruitmentRepository = {
  list(query: RecruitmentQuery, viewer: User | null): Promise<Paginated<RecruitmentSummary>> {
    void viewer;
    return apiRequest<Paginated<RecruitmentSummary>>(endpoints.recruitments, {
      method: 'GET',
      query: toQuery(query),
    });
  },

  getDetail(id: string, viewer: User | null): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.recruitment(id));
  },

  create(input: RecruitmentWriteRequest, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.recruitments, {
      method: 'POST',
      body: input,
    });
  },

  update(id: string, input: RecruitmentWriteRequest, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.recruitment(id), {
      method: 'PATCH',
      body: input,
    });
  },

  join(id: string, input: JoinRequest, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.join(id), {
      method: 'POST',
      body: input,
    });
  },

  leave(id: string, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.leave(id), { method: 'POST' });
  },

  removeMember(id: string, joinId: string, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.removeMember(id), {
      method: 'POST',
      body: { joinId },
    });
  },

  cancel(id: string, viewer: User): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.cancel(id), { method: 'POST' });
  },

  reopen(id: string, viewer: User, neededCount?: number): Promise<RecruitmentDetail> {
    void viewer;
    return apiRequest<RecruitmentDetail>(endpoints.reopen(id), {
      method: 'POST',
      body: neededCount === undefined ? {} : { neededCount },
    });
  },

  async deleteRecruitment(id: string, viewer: User): Promise<void> {
    void viewer;
    await apiRequest<null>(endpoints.recruitment(id), { method: 'DELETE' });
  },

  myTeams(viewer: User): Promise<TeamEntry[]> {
    void viewer;
    return apiRequest<TeamEntry[]>(endpoints.myTeams);
  },

  myRecruitments(viewer: User): Promise<RecruitmentSummary[]> {
    void viewer;
    return apiRequest<RecruitmentSummary[]>(endpoints.myRecruitments);
  },

  myEnded(viewer: User): Promise<RecruitmentSummary[]> {
    void viewer;
    return apiRequest<RecruitmentSummary[]>(endpoints.myEnded);
  },
};
