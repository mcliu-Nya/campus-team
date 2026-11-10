import { DATA_MODE } from '../config';
import type { DataAdapter } from './types';
import { localAuthRepository } from './local/localAuthRepository';
import { localNotificationRepository } from './local/localNotificationRepository';
import { localRecruitmentRepository } from './local/localRecruitmentRepository';
import { remoteAuthRepository } from './remote/remoteAuthRepository';
import { remoteNotificationRepository } from './remote/remoteNotificationRepository';
import { remoteRecruitmentRepository } from './remote/remoteRecruitmentRepository';

/**
 * 唯一的适配器出口：页面与 hooks 只 import 这里。
 * EXPO_PUBLIC_DATA_MODE=local  → AsyncStorage（离线可用）
 * EXPO_PUBLIC_DATA_MODE=remote → REST API（需要后端）
 */
function createLocalAdapter(): DataAdapter {
  return {
    mode: 'local',
    auth: localAuthRepository,
    recruitments: localRecruitmentRepository,
    notifications: localNotificationRepository,
  };
}

function createRemoteAdapter(): DataAdapter {
  return {
    mode: 'remote',
    auth: remoteAuthRepository,
    recruitments: remoteRecruitmentRepository,
    notifications: remoteNotificationRepository,
  };
}

export const dataAdapter: DataAdapter =
  DATA_MODE === 'remote' ? createRemoteAdapter() : createLocalAdapter();

export const isRemoteMode = dataAdapter.mode === 'remote';

export type { DataAdapter } from './types';
