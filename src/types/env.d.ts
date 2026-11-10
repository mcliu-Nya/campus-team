/**
 * Expo 在打包时把 EXPO_PUBLIC_* 变量内联进 bundle。
 * 这里声明项目实际用到的键，避免额外引入 @types/node。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_DATA_MODE?: 'local' | 'remote' | string;
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_API_TIMEOUT?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}

declare const process: { env: NodeJS.ProcessEnv };
