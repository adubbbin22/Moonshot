import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { gutCheck, type OutsideViewRate } from '@/domain/thesisTree';
import type { OutsideView } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const VERDICTS = {
  lower: 'You’re more optimistic than past cases. Breaking it down will show whether this time is different.',
  higher: 'You’re more skeptical than past cases. Breaking it down will show what you think is missing.',
  close: 'Your gut is close to how past cases went.',
} as const;

/** How cases like this one went before: the number to beat before reasoning from the specifics. */
export function OutsideViewCard({ view, rate, gut }: { view: OutsideView; rate: OutsideViewRate; gut?: number }) {
  return (
    <Card>
      <Text variant="label" tone="muted">
        The outside view
      </Text>
      <Text variant="heading">{view.question}</Text>
      {view.cases.map((c) => (
        <View key={c.label} style={styles.case}>
          <Text variant="label" style={[styles.outcome, { color: c.happened ? colors.yes : colors.no }]}>
            {c.happened ? 'Yes' : 'No'}
          </Text>
          <View style={styles.caseText}>
            <Text variant="label">{c.label}</Text>
            <Text variant="caption" tone="muted">
              {c.note}
            </Text>
          </View>
        </View>
      ))}
      <View style={styles.rate}>
        <Text variant="title">{formatPercent(rate.rate)}</Text>
        <Text variant="caption" tone="faint">
          {rate.hits} of {rate.total} went this way
        </Text>
      </View>
      <Text variant="caption" tone="faint">
        With only a few cases, the rate is pulled toward even odds: ({rate.hits} + 1) ÷ ({rate.total} + 2).
      </Text>
      {gut !== undefined ? (
        <Text>
          Your gut said {formatPercent(gut)}. {VERDICTS[gutCheck(gut, rate.rate)]}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  case: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  outcome: { width: 28 },
  caseText: { flex: 1, gap: 2 },
  rate: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
});
