import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { Button } from './Button';
import { EmptyState } from './StateViews';

interface SignInRequiredProps {
  title?: string;
  description?: string;
}

/** 需要登录才能访问的页面统一占位。 */
export function SignInRequired({
  title = '登录后继续操作',
  description = '填写真实姓名、学号与二级学院即可完成注册，信息只用于队伍联络。',
}: SignInRequiredProps) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <EmptyState
        icon="lock-closed-outline"
        title={title}
        description={description}
        actionLabel="去登录"
        onAction={() => router.push('/login')}
      />
      <Button label="返回浏览招募" variant="ghost" size="sm" onPress={() => router.push('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
});
