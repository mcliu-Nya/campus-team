import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

interface FieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  accessory?: ReactNode;
}

export function Field({
  label,
  required = false,
  error,
  hint,
  accessory,
  multiline,
  style,
  ...inputProps
}: FieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        {accessory}
      </View>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          error ? styles.inputError : null,
          style,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { ...typography.body, fontWeight: '600', fontSize: 14 },
  required: { color: colors.danger },
  input: {
    ...typography.body,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    minHeight: 46,
  },
  inputMultiline: { minHeight: 104, paddingTop: spacing.md - 2 },
  inputError: { borderColor: colors.danger, backgroundColor: '#FFF8F8' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs + 2 },
  hint: { ...typography.caption, color: colors.textFaint, marginTop: spacing.xs + 2 },
});
