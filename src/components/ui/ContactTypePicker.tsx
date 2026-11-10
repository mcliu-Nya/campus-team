import { StyleSheet, Text, View } from 'react-native';

import { CONTACT_TYPES } from '@/constants/options';
import { colors, spacing, typography } from '@/constants/theme';
import type { ContactType } from '@/types/models';
import { Chip } from './Chip';

interface ContactTypePickerProps {
  value: ContactType;
  onChange: (value: ContactType) => void;
  label?: string;
  error?: string;
  hint?: string;
}

/** 联系方式类型选择：QQ / 微信 / 电话，发布与加入表单共用。 */
export function ContactTypePicker({
  value,
  onChange,
  label = '联系方式类型',
  error,
  hint,
}: ContactTypePickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {CONTACT_TYPES.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            active={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { ...typography.tiny, color: colors.danger, marginTop: spacing.xs },
  hint: { ...typography.tiny, marginTop: spacing.xs },
});
