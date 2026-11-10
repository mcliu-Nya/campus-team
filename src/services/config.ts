/**
 * 运行时配置：通过 Expo 的 EXPO_PUBLIC_* 环境变量切换数据源。
 * 页面与组件永远不读环境变量，只依赖 repositories 抽象层。
 */

export type DataMode = 'local' | 'remote';

const rawMode = (process.env.EXPO_PUBLIC_DATA_MODE ?? 'local').trim().toLowerCase();

/** local：AsyncStorage 本地数据；remote：REST API */
export const DATA_MODE: DataMode = rawMode === 'remote' ? 'remote' : 'local';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api')
  .trim()
  .replace(/\/+$/, '');

const parsedTimeout = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 15000);

export const API_TIMEOUT = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 15000;

export const IS_REMOTE = DATA_MODE === 'remote';

export const APP_ENV = {
  dataMode: DATA_MODE,
  apiBaseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
} as const;
