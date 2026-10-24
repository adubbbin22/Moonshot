import { StyleSheet, View } from 'react-native';

import { Card, Chip, Text } from '@/components/ui';
import { edgeOverCrowd, ESTIMATED_FEES, eventVsOptions, sideProbability, venueArbitrage } from '@/domain/arbitrage';
import type { Call, EventQuestion, PredictionQuote, Side } from '@/domain/types';
import { usePredictionQuotes } from '@/hooks/usePredictionQuotes';
import { formatPercent } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const VENUE_LABELS = { kalshi: 'Kalshi', polymarket: 'Polymarket' } as const;

export interface PredictionOddsProps {
  question: EventQuestion;
  side: Side;
  call?: Call;
  /** What the options market charges for the first bet on this side (cost ÷ max payout, or model odds). */
  optionsOdds?: number;
}

const cents = (p: number) => `${Math.round(p * 100)}¢`;
const points = (p: number) => `${Math.round(Math.abs(p) * 100)} ${Math.round(Math.abs(p) * 100) === 1 ? 'pt' : 'pts'}`;

/**
 * Prediction-market odds for a question, the gap between venues (a real
 * arbitrage, before fees), and the comparison with the linked options bet:
 * how often the stock would have to follow the event for the options price
 * to be fair.
 */
export function PredictionOdds({ question, side, call, optionsOdds }: PredictionOddsProps) {
  const state = usePredictionQuotes(question);
  if (state.status === 'loading') return null;
  if (state.status === 'error') {
    return (
      <Card>
        <Text variant="label" tone="muted">
          Prediction markets
        </Text>
        <Text variant="caption" tone="faint">
          Couldn’t load odds: {state.message}
        </Text>
      </Card>
    );
  }
  const { quotes } = state;
  if (quotes.length === 0) return null;

  const sample = quotes.some((q) => q.basis === 'sample');
  const sideLabel = side === 'yes' ? 'Yes' : 'No';
  const crowd = quotes.reduce((s, q) => s + q.yes, 0) / quotes.length;
  const pEvent = sideProbability(crowd, side);
  const arb = venueArbitrage(quotes);
  const evo = optionsOdds !== undefined ? eventVsOptions(pEvent, optionsOdds) : undefined;

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="label" tone="muted">
          Prediction markets
        </Text>
        {sample ? <Chip label="Sample odds, not real" color={colors.no} /> : null}
      </View>
      {quotes.map((q) => (
        <QuoteRow key={`${q.venue}:${q.id}`} quote={q} side={side} />
      ))}

      {arb ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            Between the venues
          </Text>
          {arb.edge <= 0.001 ? (
            <Text tone="muted">The venues agree. No gap to trade.</Text>
          ) : (
            <Text tone="muted">
              Buy Yes at {VENUE_LABELS[arb.buyYesAt]} ({cents(arb.yesPrice)}) and No at {VENUE_LABELS[arb.buyNoAt]} (
              {cents(arb.noPrice)}): {cents(arb.cost)} for a guaranteed $1. That’s a {cents(arb.edge)} edge before fees, and
              fees run about {cents(ESTIMATED_FEES)}.{' '}
              {arb.netEdge > 0 ? 'A real arbitrage, if you can trade both.' : 'Not worth the trouble.'}
            </Text>
          )}
        </View>
      ) : null}

      {evo ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            Event odds vs. the options bet
          </Text>
          <Text tone="muted">
            The crowd gives {sideLabel} {formatPercent(pEvent)}. The options bet for this side costs{' '}
            {formatPercent(evo.optionsOdds)} of its max payout.{' '}
            {evo.verdict === 'move-priced-above-event'
              ? 'The options market prices the stock move as likelier than the event itself: the move can happen without the event, so the options bet isn’t a cheap way into this question.'
              : `That price is fair only if the stock follows the event about ${formatPercent(Math.min(1, evo.breakEvenLink))} of the time. ${
                  evo.verdict === 'options-cheaper'
                    ? 'If you think the link is stronger than that, the options bet is the cheaper way in; if weaker, the prediction market is.'
                    : 'The two are priced about the same; the options bet only wins if you also want the bigger payoff.'
                }`}
          </Text>
          <Text variant="caption" tone="faint">
            Different claims: the venues price the event, the options bet prices the stock.
          </Text>
        </View>
      ) : null}

      {call ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            You vs. the crowd
          </Text>
          <Text tone="muted">
            {(() => {
              const yours = call.side === side ? call.probability : 1 - call.probability;
              const edge = edgeOverCrowd(yours, pEvent);
              return `Your call gives ${sideLabel} ${formatPercent(yours)}, ${points(edge)} ${edge >= 0 ? 'more' : 'less'} than the crowd. ${
                Math.abs(edge) >= 0.1 ? 'That’s a real disagreement worth a bet, or a second look.' : 'You and the crowd roughly agree.'
              }`;
            })()}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function QuoteRow({ quote, side }: { quote: PredictionQuote; side: Side }) {
  const p = sideProbability(quote.yes, side);
  return (
    <View style={styles.quote}>
      <View style={styles.quoteText}>
        <Text variant="label">
          {VENUE_LABELS[quote.venue]} · {formatPercent(p)} {side === 'yes' ? 'Yes' : 'No'}
        </Text>
        <Text variant="caption" tone="faint">
          {quote.title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  quote: { flexDirection: 'row', gap: spacing.md },
  quoteText: { flex: 1, gap: 2 },
  block: { gap: spacing.xs },
});
