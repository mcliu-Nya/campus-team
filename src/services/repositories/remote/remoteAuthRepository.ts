import type { AuthSession, LoginRequest } from '@/types/api';
import type { User } from '@/types/models';
import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { AuthRepository } from '../types';

/** 远程实现：真实后端就绪后，把 DATA_MODE 切到 remote 即可生效 */
export const remoteAuthRepository: AuthRepository = {
  login(input: LoginRequest): Promise<AuthSession> {
    return apiRequest<AuthSession>(endpoints.login, {
      method: 'POST',
      body: input,
      auth: false,
    });
  },

  me(token: string): Promise<User> {
    return apiRequest<User>(endpoints.me, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
