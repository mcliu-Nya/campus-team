import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { IconName } from '@/constants/options';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/state/AuthProvider';
import { useConfirm } from '@/state/ConfirmProvider';
import { useToast } from '@/state/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/StateViews';

// 版本号取自安装包本身（versionName / versionCode），方便确认手机上装的是哪一版
const APP_VERSION =
  Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0';
const APP_BUILD =
  Application.nativeBuildVersion ??
  (Constants.expoConfig?.android?.versionCode
    ? String(Constants.expoConfig.android.versionCode)
    : null);

const MENU: { icon: IconName; label: string; description: string; href: string }[] = [
  {
    icon: 'people-outline',
    label: '我的队伍',
    description: '成员与彼此联系方式',
    href: '/my-teams',
  },
  {
    icon: 'megaphone-outline',
    label: '我的招募',
    description: '编辑、取消进行中的招募',
    href: '/my-recruitments',
  },
  {
    icon: 'archive-outline',
    label: '结束的招募',
    description: '已结束与已取消的招募',
    href: '/my-ended',
  },
];

export default function ProfileScreen() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState label="正在恢复登录状态…" />
      </SafeAreaView>
    );
  }

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: '退出登录',
      message: '退出后需重新登录才能发布或加入队伍。',
      confirmText: '退出登录',
      destructive: true,
    });
    if (!confirmed) return;
    await signOut();
    showToast('已退出登录', 'success');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={typography.h1}>我的</Text>

        {user ? (
          <View style={[styles.profileCard, cardShadow]}>
            <Avatar name={user.realName} size={56} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.realName}</Text>
              <Text style={styles.meta}>学号 {user.studentId}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {user.college}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.loginCard, cardShadow]}>
            <View style={styles.loginIcon}>
              <Ionicons name="people-circle-outline" size={30} color={colors.primaryDark} />
            </View>
            <Text style={styles.loginTitle}>登录后开始组队</Text>
            <Text style={styles.loginDesc}>填写姓名、学号、学院即可注册。</Text>
            <Button
              label="登录 / 注册"
              icon="log-in-outline"
              onPress={() => router.push('/login')}
              fullWidth
            />
          </View>
        )}

        <View style={[styles.menuCard, cardShadow]}>
          {MENU.map((item, index) => (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.menuItem,
                index > 0 ? styles.menuDivider : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primaryDark} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>

        {user ? (
          <Button
            label="退出登录"
            variant="secondary"
            icon="log-out-outline"
            onPress={() => void handleSignOut()}
            fullWidth
            style={styles.signOut}
          />
        ) : null}

        <Text style={styles.footnote}>联系方式仅队伍双方可见，列表默认脱敏。</Text>
        <Text style={styles.version}>
          {APP_BUILD ? `版本 ${APP_VERSION} (${APP_BUILD})` : `版本 ${APP_VERSION}`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileInfo: { flex: 1 },
  name: { ...typography.h2, fontSize: 19 },
  meta: { ...typography.caption, marginTop: 1 },
  loginCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loginIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: { ...typography.h3, marginTop: spacing.xs },
  loginDesc: { ...typography.bodyMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { ...typography.body, fontWeight: '600', fontSize: 14 },
  menuDesc: { ...typography.tiny, marginTop: 1 },
  pressed: { backgroundColor: colors.cardMuted },
  signOut: { marginTop: spacing.xs },
  footnote: { ...typography.tiny, textAlign: 'center', lineHeight: 17, color: colors.textFaint },
  version: {
    ...typography.tiny,
    textAlign: 'center',
    marginTop: spacing.xs,
    color: colors.textFaint,
  },
});
