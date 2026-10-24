import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { Reasoning } from '@/hooks/useReasoning';
import { formatPercent } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

/** "Why this bet": the user's chain from their belief to this bet, and where it could break. */
export function ReasoningCard({ reasoning, marketOdds }: { reasoning: Reasoning; marketOdds?: number }) {
  const { lines, chain, why, path, killCriteria } = reasoning;
  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        Your reasoning
      </Text>
      {lines.map((line, i) => (
        <View key={`${line.kind}:${line.claim}`} style={styles.line}>
          <Text variant="caption" tone="faint" style={styles.index}>
            {i + 1}
          </Text>
          <View style={styles.lineText}>
            {line.kind === 'not-belief' ? (
              <Text variant="caption" tone="faint">
                It doesn’t happen:
              </Text>
            ) : line.kind === 'lasts' ? (
              <Text variant="caption" tone="faint">
                Then what? It lasts until expiry despite:
              </Text>
            ) : i > 0 ? (
              <Text variant="caption" tone="faint">
                Which means
              </Text>
            ) : null}
            <Text tone={line.kind === 'lasts' ? 'muted' : 'default'}>{line.claim}</Text>
          </View>
          <Text variant="label" style={styles.yours}>
            {line.probability === undefined ? '–' : formatPercent(line.probability)}
          </Text>
        </View>
      ))}
      {why ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            Why this bet
          </Text>
          <Text tone="muted">{why}</Text>
        </View>
      ) : null}
      <View style={styles.compare}>
        <Text variant="label" style={styles.yours}>
          {chain === undefined ? 'Rate every step to see your chain' : `Your chain ${formatPercent(chain)}`}
        </Text>
        {marketOdds !== undefined ? (
          <Text variant="label" tone="muted">
            Market ~{formatPercent(marketOdds)}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" tone="faint">
        The bet pays on the stock price, not on your chain. Your chain can come true and the stock can still miss.
      </Text>
      <View style={styles.block}>
        <Text variant="caption" tone="faint">
          Where it could break
        </Text>
        {path.steps.map((step) => (
          <Text key={step.id} tone="muted">
            • {step.against}
          </Text>
        ))}
      </View>
      {killCriteria.length > 0 ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            Your kill criteria, from your pre-mortem
          </Text>
          {killCriteria.map((signal) => (
            <Text key={signal}>• {signal}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.violet },
  line: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  index: { width: 16, paddingTop: 4 },
  lineText: { flex: 1, gap: 2 },
  yours: { color: colors.violet },
  block: { gap: 2 },
  compare: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
});
