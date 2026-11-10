import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { firstNameChar } from '@/lib/text';

interface AvatarProps {
  name: string;
  size?: number;
  muted?: boolean;
}

export function Avatar({ name, size = 40, muted = false }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: muted ? colors.cardMuted : colors.primarySoft,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { fontSize: size * 0.42, color: muted ? colors.textMuted : colors.primaryDark },
        ]}
      >
        {firstNameChar(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
    borderRadius: radius.pill,
  },
  label: { fontWeight: '700' },
});
