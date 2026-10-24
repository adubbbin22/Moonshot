import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, radius, spacing } from '@/theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}

/** Selectable chip when `onPress` is set, otherwise a static tag. */
export function Chip({ label, selected = false, onPress, color }: ChipProps) {
  const tint = color ?? colors.accent;
  const content = (
    <Text variant="caption" style={{ color: selected ? colors.onAccent : (color ?? colors.textMuted) }}>
      {label}
    </Text>
  );

  if (!onPress) {
    return <View style={[styles.chip, { borderColor: color ?? colors.border }]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        styles.selectable,
        selected && { backgroundColor: tint, borderColor: tint },
        pressed && styles.pressed,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selectable: {
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.8 },
});
