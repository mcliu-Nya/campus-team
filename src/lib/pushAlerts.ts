import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/** Android 通知渠道：必须存在且重要性为 HIGH 才会在锁屏/横幅弹出 */
const CHANNEL_ID = 'team-joins';
const CHANNEL_NAME = '队伍加入提醒';

let modulePromise: Promise<NotificationsModule | null> | null = null;
let handlerInstalled = false;

/**
 * expo-notifications 没有 Web 实现，用动态 import 隔离：
 * Web 端返回 null，调用方静默跳过，不影响浏览器预览。
 */
async function getModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  if (!modulePromise) {
    modulePromise = import('expo-notifications')
      .then((mod) => mod as NotificationsModule)
      .catch(() => null);
  }
  return modulePromise;
}

/** 创建渠道 + 安装前台处理器 + 申请权限；返回是否已获得通知权限 */
export async function preparePushAlerts(): Promise<boolean> {
  const mod = await getModule();
  if (!mod) return false;

  if (Platform.OS === 'android') {
    await mod.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      description: '有新成员加入你发布的招募时提醒',
      importance: mod.AndroidImportance.HIGH,
      lightColor: '#2F6FED',
      sound: 'default',
      vibrationPattern: [0, 200, 120, 200],
    });
  }

  if (!handlerInstalled) {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerInstalled = true;
  }

  const current = await mod.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const asked = await mod.requestPermissionsAsync();
  return asked.granted;
}

export interface JoinAlert {
  notificationId: string;
  recruitmentId: string;
  recruitmentTitle: string;
  joinerName: string;
  contactLabel: string;
  contact: string;
}

/** 立即推送一条系统通知（本地通知，不依赖推送服务器） */
export async function showJoinAlert(alert: JoinAlert): Promise<void> {
  const mod = await getModule();
  if (!mod) return;

  await mod.scheduleNotificationAsync({
    content: {
      title: '有同学加入了你的队伍',
      body: `${alert.joinerName} 加入了「${alert.recruitmentTitle}」\n${alert.contactLabel}：${alert.contact}`,
      data: { recruitmentId: alert.recruitmentId, notificationId: alert.notificationId },
      sound: 'default',
    },
    // Android 用带 channelId 的 trigger 才能落到 HIGH 重要性渠道（立即投递）
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

/** 用户点击通知时取出要跳转的招募 id */
export async function extractRecruitmentId(
  data: Record<string, unknown> | undefined,
): Promise<string | null> {
  const value = data?.recruitmentId;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function addNotificationTapListener(
  handler: (recruitmentId: string) => void,
): Promise<() => void> {
  const mod = await getModule();
  if (!mod) return () => {};
  const subscription = mod.addNotificationResponseReceivedListener((response) => {
    const id = response.notification.request.content.data?.recruitmentId;
    if (typeof id === 'string' && id.length > 0) handler(id);
  });
  return () => subscription.remove();
}
