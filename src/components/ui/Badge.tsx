import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color: string;
  background: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, background, size = 'sm' }: BadgeProps) {
  const compact = size === 'sm';
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: background,
          paddingVertical: compact ? 2 : 4,
          paddingHorizontal: compact ? spacing.sm : spacing.md,
        },
      ]}
    >
      <Text style={[styles.label, { color, fontSize: compact ? 11 : 13 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignSelf: 'flex-start' },
  label: { fontWeight: '600' },
});
