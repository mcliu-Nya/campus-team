import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SplashIntro } from '@/components/branding/SplashIntro';
import { addNotificationTapListener } from '@/lib/pushAlerts';
import { AuthProvider } from '@/state/AuthProvider';
import { ConfirmProvider } from '@/state/ConfirmProvider';
import { NotificationsProvider } from '@/state/NotificationsProvider';
import { ToastProvider } from '@/state/ToastProvider';

// 交给自定义启动动画接管，避免原生启动图与扩散动画之间闪一下白屏
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** 点击系统通知后跳到对应招募详情 */
function NotificationTapRouter() {
  const router = useRouter();
  useEffect(() => {
    let dispose: (() => void) | null = null;
    void addNotificationTapListener((recruitmentId) => {
      router.push(`/recruitment/${recruitmentId}`);
    }).then((remove) => {
      dispose = remove;
    });
    return () => dispose?.();
  }, [router]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // 根视图就绪，隐藏原生启动图，由 SplashIntro 播放扩散动画
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ToastProvider>
            <ConfirmProvider>
              <StatusBar style="dark" />
              <NotificationTapRouter />
              <Stack
                screenOptions={{
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: colors.card },
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontSize: 17, fontWeight: '600' },
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="login"
                  options={{ title: '登录 / 注册', presentation: 'modal' }}
                />
                <Stack.Screen name="recruitment-new" options={{ title: '发布招募' }} />
                <Stack.Screen name="recruitment/[id]" options={{ title: '招募详情' }} />
                <Stack.Screen name="recruitment-edit/[id]" options={{ title: '编辑招募' }} />
                <Stack.Screen name="my-teams" options={{ title: '我的队伍' }} />
                <Stack.Screen name="my-recruitments" options={{ title: '我的招募' }} />
                <Stack.Screen name="my-ended" options={{ title: '结束的招募' }} />
              </Stack>
              <SplashIntro />
            </ConfirmProvider>
          </ToastProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// 深链或冷启动时以 Tabs 作为锚点路由（expo-router 58 起用 anchor 取代 initialRouteName）
export const unstable_settings = {
  anchor: '(tabs)',
};

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={styles.errorRoot}>
      <Text style={typography.h2}>页面出错了</Text>
      <Text style={styles.errorMessage}>{error.message || '发生未知错误'}</Text>
      <Button label="重试" onPress={() => void retry()} variant="soft" />
    </View>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  errorMessage: { ...typography.bodyMuted, textAlign: 'center' },
});
