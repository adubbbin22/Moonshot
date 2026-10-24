import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Resolution } from '@/domain/types';
import { colors, radius, spacing } from '@/theme/tokens';

/** "How this resolves": the source and rule behind a question, one tap away. */
export function ResolutionNote({ resolution }: { resolution: Resolution }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((o) => !o)}
      style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="caption" tone="muted">
          How this resolves · {resolution.source}
        </Text>
        <Text variant="caption" tone="faint">
          {open ? 'Hide' : 'Show'}
        </Text>
      </View>
      {open ? (
        <Text variant="caption" tone="muted" style={styles.rule}>
          {resolution.rule}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rule: { lineHeight: 18 },
});
