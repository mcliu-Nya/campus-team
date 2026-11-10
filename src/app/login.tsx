import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLLEGES } from '@/constants/options';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { toErrorMessage } from '@/lib/errors';
import { hasErrors, validateLoginForm } from '@/lib/validate';
import { useAuth } from '@/state/AuthProvider';
import { useToast } from '@/state/ToastProvider';
import {
  EMPTY_LOGIN_FORM,
  type FormErrors,
  type LoginFormValues,
} from '@/types/forms';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Sheet } from '@/components/ui/Sheet';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [values, setValues] = useState<LoginFormValues>(EMPTY_LOGIN_FORM);
  const [errors, setErrors] = useState<FormErrors<LoginFormValues>>({});
  const [submitting, setSubmitting] = useState(false);
  const [collegeVisible, setCollegeVisible] = useState(false);

  const patch = (next: Partial<LoginFormValues>) => {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const merged = { ...prev };
      (Object.keys(next) as (keyof LoginFormValues)[]).forEach((key) => {
        delete merged[key];
      });
      return merged;
    });
  };

  const submit = async () => {
    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      showToast('请检查表单填写', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const signedIn = await signIn({
        realName: values.realName.trim(),
        studentId: values.studentId.trim(),
        college: values.college,
      });
      showToast(`欢迎，${signedIn.realName}`, 'success');
      router.back();
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <View style={styles.signedIn}>
        <Avatar name={user.realName} size={64} />
        <Text style={typography.h2}>已登录</Text>
        <Text style={styles.signedInText}>
          {user.realName} · {user.studentId}
          {'\n'}
          {user.college}
        </Text>
        <Button label="关闭" variant="soft" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={26} color={colors.primaryDark} />
          </View>
          <Text style={typography.h2}>登录 / 注册</Text>
          <Text style={styles.heroText}>填写真实姓名、学号、二级学院完成注册。</Text>
        </View>

        <Field
          label="真实姓名"
          required
          value={values.realName}
          onChangeText={(text) => patch({ realName: text })}
          placeholder="请输入真实姓名"
          error={errors.realName}
          maxLength={20}
          returnKeyType="next"
        />

        <Field
          label="学号"
          required
          value={values.studentId}
          onChangeText={(text) => patch({ studentId: text })}
          placeholder="请输入学号"
          error={errors.studentId}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />

        <SelectField
          label="二级学院"
          required
          value={values.college}
          placeholder="请选择所属学院"
          error={errors.college}
          onPress={() => setCollegeVisible(true)}
        />

        <Button
          label="登录 / 注册"
          onPress={() => void submit()}
          loading={submitting}
          fullWidth
          size="md"
        />

        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.demoTitle}>登录说明</Text>
          </View>
          <Text style={styles.demoText}>
            首次使用即完成注册；之后用同一学号登录，发布招募时会自动带出你的身份信息。
          </Text>
        </View>

        <Text style={styles.privacy}>联系方式与学号仅队伍双方可见。</Text>
      </ScrollView>

      <Sheet
        visible={collegeVisible}
        title="选择二级学院"
        onClose={() => setCollegeVisible(false)}
        maxHeightRatio={0.7}
      >
        <View style={styles.collegeList}>
          {COLLEGES.map((college) => (
            <Chip
              key={college}
              label={college}
              active={values.college === college}
              onPress={() => {
                patch({ college });
                setCollegeVisible(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: { alignItems: 'center', marginBottom: spacing.xxl, gap: spacing.sm },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  demoCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demoTitle: { ...typography.caption, fontWeight: '700', color: colors.textMuted },
  demoText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  privacy: {
    ...typography.tiny,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 17,
  },
  collegeList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.md },
  signedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: colors.bg,
  },
  signedInText: { ...typography.bodyMuted, textAlign: 'center' },
});
