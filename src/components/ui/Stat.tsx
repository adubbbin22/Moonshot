import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, type AppTextProps } from './Text';
import { spacing } from '@/theme/tokens';

export interface StatProps {
  label: string;
  value: string;
  tone?: AppTextProps['tone'];
}

export function Stat({ label, value, tone = 'default' }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text variant="heading" tone={tone}>
        {value}
      </Text>
      <Text variant="caption" tone="faint">
        {label}
      </Text>
    </View>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  stat: { flex: 1, gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
});
