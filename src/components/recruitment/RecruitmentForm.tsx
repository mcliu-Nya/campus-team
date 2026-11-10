import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACTIVITY_TYPES, COLLEGES, DEADLINE_PRESETS, contactTypeMeta } from '@/constants/options';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { addDays, formatDateTime, formatDeadlineHint } from '@/lib/date';
import { hasErrors, validateRecruitmentForm } from '@/lib/validate';
import type { RecruitmentWriteRequest } from '@/types/api';
import type { ActivityType } from '@/types/models';
import { type FormErrors, type RecruitmentFormValues } from '@/types/forms';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ContactTypePicker } from '@/components/ui/ContactTypePicker';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Sheet } from '@/components/ui/Sheet';
import { DeadlinePickerSheet } from '@/components/recruitment/DeadlinePickerSheet';

interface RecruitmentFormProps {
  mode: 'create' | 'edit';
  initialValues: RecruitmentFormValues;
  submitting: boolean;
  minNeededCount?: number;
  onSubmit: (payload: RecruitmentWriteRequest) => void | Promise<void>;
}

type PresetMatch = number | 'custom';

/** 预设选项按「天」生成，自定义时间允许 10 分钟误差仍视作命中预设 */
const PRESET_TOLERANCE_MS = 10 * 60 * 1000;

function matchPreset(deadline: string | null): PresetMatch | null {
  if (!deadline) return null;
  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  const hit = DEADLINE_PRESETS.find(
    (preset) => Math.abs(target - (now + preset.value * 86_400_000)) <= PRESET_TOLERANCE_MS,
  );
  return hit ? hit.value : 'custom';
}

export function RecruitmentForm({
  mode,
  initialValues,
  submitting,
  minNeededCount = 0,
  onSubmit,
}: RecruitmentFormProps) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<RecruitmentFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<RecruitmentFormValues>>({});
  const [collegeVisible, setCollegeVisible] = useState(false);
  const [deadlineVisible, setDeadlineVisible] = useState(false);

  const preset = matchPreset(values.deadline);
  const contactMeta = contactTypeMeta(values.contactType);

  const patch = (next: Partial<RecruitmentFormValues>) => {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const merged = { ...prev };
      (Object.keys(next) as (keyof RecruitmentFormValues)[]).forEach((key) => {
        delete merged[key];
      });
      return merged;
    });
  };

  const handleSubmit = () => {
    const nextErrors = validateRecruitmentForm(values);
    const needed = Number(values.neededCount);
    if (!nextErrors.neededCount && Number.isFinite(needed) && needed < minNeededCount) {
      nextErrors.neededCount = `需要人数不能少于已加入人数（${minNeededCount} 人）`;
    }
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    void onSubmit({
      title: values.title.trim(),
      college: values.college,
      activityType: values.activityType,
      neededCount: needed,
      requirements: values.requirements.trim(),
      contactType: values.contactType,
      contact: values.contact.trim(),
      activityUrl: values.activityUrl.trim(),
      extra: values.extra.trim(),
      deadline: values.deadline,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>基本信息</Text>

        <Field
          label="活动名称 / 标题"
          required
          value={values.title}
          onChangeText={(text) => patch({ title: text })}
          placeholder="例如：全国大学生数学建模竞赛校内选拔组队"
          error={errors.title}
          maxLength={40}
        />

        <SelectField
          label="二级学院"
          required
          value={values.college}
          placeholder="请选择发布者所属学院"
          error={errors.college}
          hint="用于归属学院展示与筛选"
          onPress={() => setCollegeVisible(true)}
        />

        <Text style={styles.fieldLabel}>活动类型</Text>
        <View style={styles.chipWrap}>
          {ACTIVITY_TYPES.map((type) => (
            <Chip
              key={type.value}
              label={type.label}
              icon={type.icon}
              active={values.activityType === type.value}
              onPress={() => patch({ activityType: type.value as ActivityType })}
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <Field
          label="需要人数"
          required
          value={values.neededCount}
          onChangeText={(text) => patch({ neededCount: text.replace(/[^\d]/g, '') })}
          placeholder="例如：3"
          keyboardType="number-pad"
          error={errors.neededCount}
          hint={
            minNeededCount > 0
              ? `已有 ${minNeededCount} 人加入，人数不能低于该值`
              : '1-100 人，满员后仍展示在首页'
          }
        />

        <Field
          label="队员要求"
          required
          value={values.requirements}
          onChangeText={(text) => patch({ requirements: text })}
          placeholder="例如：熟悉 Python 与 LaTeX，有数学建模经验优先，每周可投入 10 小时"
          error={errors.requirements}
          hint="5-300 字，写清技能要求与投入时间"
          multiline
          maxLength={300}
        />

        <Text style={styles.sectionLabel}>联络方式</Text>

        <ContactTypePicker
          value={values.contactType}
          onChange={(contactType) => patch({ contactType, contact: values.contact })}
          hint="列表只展示脱敏信息，加入后可见完整内容"
        />

        <Field
          label="联系方式"
          required
          value={values.contact}
          onChangeText={(text) => patch({ contact: text })}
          placeholder={contactMeta.placeholder}
          error={errors.contact}
          hint={`${contactMeta.hint}；用于队员联系你`}
          keyboardType={contactMeta.keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={60}
        />

        <Field
          label="活动链接"
          required
          value={values.activityUrl}
          onChangeText={(text) => patch({ activityUrl: text })}
          placeholder="https://..."
          error={errors.activityUrl}
          hint="竞赛官网、通知公告或在线文档链接"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.sectionLabel}>补充信息</Text>

        <Field
          label="补充内容"
          value={values.extra}
          onChangeText={(text) => patch({ extra: text })}
          placeholder="活动奖励、活动时间、集合方式等，可留空"
          error={errors.extra}
          hint="选填，最多 500 字"
          multiline
          maxLength={500}
        />

        <Text style={styles.fieldLabel}>报名截止时间（必填）</Text>
        <View style={styles.chipWrap}>
          {DEADLINE_PRESETS.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              active={preset === option.value}
              onPress={() => patch({ deadline: addDays(option.value) })}
            />
          ))}
          <Chip
            label="自定义"
            icon="calendar-outline"
            active={preset === 'custom'}
            onPress={() => setDeadlineVisible(true)}
            style={styles.customChip}
          />
        </View>
        <View style={styles.deadlineHint}>
          <Ionicons name="calendar-outline" size={13} color={colors.textFaint} />
          <Text style={styles.deadlineText}>
            {values.deadline
              ? `截止 ${formatDateTime(values.deadline)}${preset === 'custom' ? '（自定义）' : ''} · ${formatDeadlineHint(values.deadline)}`
              : '请选择截止时间'}
          </Text>
        </View>
        {errors.deadline ? <Text style={styles.fieldError}>{errors.deadline}</Text> : null}

        <View style={styles.privacyTip}>
          <Ionicons name="shield-checkmark-outline" size={15} color={colors.primaryDark} />
          <Text style={styles.privacyText}>联系方式仅队伍成员可见，列表默认脱敏。</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button
          label={mode === 'create' ? '发布招募' : '保存修改'}
          icon={mode === 'create' ? 'megaphone-outline' : 'save-outline'}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
        />
      </View>

      <Sheet
        visible={collegeVisible}
        title="选择二级学院"
        onClose={() => setCollegeVisible(false)}
        maxHeightRatio={0.7}
      >
        <View style={styles.chipWrap}>
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

      <DeadlinePickerSheet
        key={deadlineVisible ? 'deadline-open' : 'deadline-closed'}
        visible={deadlineVisible}
        value={values.deadline}
        onClose={() => setDeadlineVisible(false)}
        onConfirm={(iso) => {
          patch({ deadline: iso });
          setDeadlineVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: spacing.md,
  },
  fieldLabel: { ...typography.body, fontWeight: '600', fontSize: 14, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // 固定宽度：无论是否已选自定义时间，按钮位置与尺寸都不变
  customChip: { minWidth: 96, justifyContent: 'center' },
  spacer: { height: spacing.lg },
  deadlineHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  deadlineText: { ...typography.caption },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  privacyTip: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  privacyText: { ...typography.caption, color: colors.primaryDark, flex: 1, lineHeight: 18 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
