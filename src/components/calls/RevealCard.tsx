import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { outlivesQuestion } from '@/domain/horizon';
import { impliedOdds } from '@/domain/strategy';
import type { Call, EventQuestion } from '@/domain/types';
import { usePricedBet } from '@/hooks/usePricedBet';
import { formatDate, formatPercent } from '@/lib/format';
import { strikesLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

/** Real crowd numbers need a backend and enough people; until then we say so instead of inventing them. */
const CROWD_MINIMUM = 50;

export interface RevealCardProps {
  question: EventQuestion;
  call: Call;
  nextLabel: string;
  onNext: () => void;
}

/**
 * After a call is locked: your number, the crowd (once it's real), and what
 * the options market charges for the bet linked to your side.
 */
export function RevealCard({ question, call, nextLabel, onNext }: RevealCardProps) {
  const outcome = question.outcomes.find((o) => o.side === call.side);
  const linkedBet = outcome?.betIds[0] ? catalog.getBet(outcome.betIds[0]) : undefined;
  const sideColor = call.side === 'yes' ? colors.yes : colors.no;

  return (
    <Card style={styles.card}>
      <Text variant="caption" tone="faint">
        {question.question}
      </Text>

      <View style={styles.block}>
        <Text variant="label" tone="muted">
          Your call
        </Text>
        <View style={styles.callRow}>
          <Text variant="display" style={{ color: sideColor }}>
            {formatPercent(call.probability)}
          </Text>
          <Text variant="heading" style={styles.callSide}>
            {call.side === 'yes' ? 'Yes' : 'No'} · {outcome?.label}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="label">Moonshot crowd</Text>
        <Text variant="caption" tone="faint">
          Shows after {CROWD_MINIMUM} calls
        </Text>
      </View>

      {linkedBet ? (
        <LinkedBet betId={linkedBet.id} question={question} />
      ) : (
        <View style={styles.block}>
          <Text variant="label">The market</Text>
          <Text tone="muted">{outcome?.rationale}</Text>
        </View>
      )}

      <Button label={nextLabel} onPress={onNext} />
    </Card>
  );
}

function LinkedBet({ betId, question }: { betId: string; question: EventQuestion }) {
  const bet = catalog.getBet(betId);
  const state = usePricedBet(bet, question);

  if (state.status === 'loading') {
    return (
      <View style={[styles.market, styles.center]}>
        <ActivityIndicator color={colors.textMuted} />
        <Text variant="caption" tone="faint">
          Checking what the market charges…
        </Text>
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.market}>
        <Text variant="caption" tone="faint">
          Couldn’t price the linked bet right now. Your call still counts.
        </Text>
      </View>
    );
  }

  const { priced } = state;
  if (!outlivesQuestion(priced.expiration, question.resolution.resolvesOn)) {
    return (
      <View style={styles.market}>
        <Text variant="caption" tone="faint">
          No listed option lasts past this question yet. Your call still counts.
        </Text>
      </View>
    );
  }
  const odds = impliedOdds(priced);
  return (
    <View style={styles.market}>
      <Text variant="label">What the market charges</Text>
      <Text variant="title">~{formatPercent(odds.value)}</Text>
      <Text variant="caption" tone="muted">
        for {priced.underlying} {strikesLabel(priced.kind, priced.legs)} · {formatDate(priced.expiration)}
      </Text>
      <Text variant="caption" tone="faint">
        {odds.basis === 'price'
          ? 'That’s the price of the linked bet (cost ÷ max payout), not the odds of the question itself.'
          : 'That’s the options model’s chance the linked bet profits, not the odds of the question itself.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  block: { gap: spacing.xs },
  callRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, flexWrap: 'wrap' },
  callSide: { flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  market: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  center: { alignItems: 'center' },
});
