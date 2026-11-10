import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  onPress: () => void;
}

/** 只读选择框：点击后由调用方打开选择弹层（学院、活动类型、截止时间等）。 */
export function SelectField({
  label,
  value,
  placeholder = '请选择',
  required = false,
  error,
  hint,
  onPress,
}: SelectFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}：${value || placeholder}`}
        style={({ pressed }) => [
          styles.box,
          error ? styles.boxError : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={[styles.value, value ? null : styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textFaint} />
      </Pressable>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.body, fontWeight: '600', fontSize: 14, marginBottom: spacing.sm },
  required: { color: colors.danger },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  boxError: { borderColor: colors.danger, backgroundColor: '#FFF8F8' },
  pressed: { opacity: 0.75 },
  value: { ...typography.body, fontSize: 14, flex: 1, marginRight: spacing.sm },
  placeholder: { color: colors.textFaint },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs + 2 },
  hint: { ...typography.caption, color: colors.textFaint, marginTop: spacing.xs + 2 },
});
