import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Text } from './Text';
import { colors, spacing } from '@/theme/tokens';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Rendered to the right of the title. */
  accessory?: ReactNode;
  children: ReactNode;
  /** Pinned below the scroll area, e.g. a primary action. */
  footer?: ReactNode;
  /** Tab screens own the top inset; stack screens under a header don't. */
  edges?: Edge[];
}

export function Screen({
  title,
  subtitle,
  accessory,
  children,
  footer,
  edges = ['top'],
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="title">{title}</Text>
              {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
            </View>
            {accessory}
          </View>
        ) : null}
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
