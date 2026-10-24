import { StyleSheet, View } from 'react-native';

import { Card, Chip, Text } from '@/components/ui';
import { eventVsOptions, venueStake } from '@/domain/arbitrage';
import { MIN_PAYOFF_MULTIPLE, type PricedStrategy } from '@/domain/strategy';
import type { Call, EventQuestion, PredictionQuote, Side } from '@/domain/types';
import { formatDate, formatMoney, formatMultiple, formatPercent } from '@/lib/format';
import { rangeLabel } from '@/lib/strategyText';
import { colors, radius, spacing } from '@/theme/tokens';

const VENUE_LABELS = { kalshi: 'Kalshi', polymarket: 'Polymarket' } as const;
const cents = (p: number) => `${Math.round(p * 100)}¢`;

export interface VsVenueCardProps {
  priced: PricedStrategy;
  contracts: number;
  question: EventQuestion;
  side: Side;
  quotes: PredictionQuote[];
  call?: Call;
}

/**
 * The same dollars on this bet and on the prediction-market contract for
 * the side it expresses: what each buys, what each pays if right, what each
 * needs to go right. Kalshi first when it's quoted; Polymarket otherwise.
 */
export function VsVenueCard({ priced, contracts, question, side, quotes, call }: VsVenueCardProps) {
  const same = quotes.filter((q) => (q.match ?? 'same') === 'same');
  const pool = same.length > 0 ? same : quotes;
  const quote = pool.find((q) => q.venue === 'kalshi') ?? pool[0];
  if (!quote) return null;
  const related = (quote.match ?? 'same') === 'related';
  const stake = priced.costPerContract * contracts;
  const venue = venueStake(quote, side, stake);
  if (!venue) return null;

  const venueName = VENUE_LABELS[quote.venue];
  const sideLabel = side === 'yes' ? 'Yes' : 'No';
  const optionsMultiple = priced.payoffMultiple ?? MIN_PAYOFF_MULTIPLE;
  const optionsPayout = (priced.maxValuePerContract ?? priced.costPerContract * MIN_PAYOFF_MULTIPLE) * contracts;
  const top = priced.outcomes[priced.outcomes.length - 1];
  // A venue contract at price p is fair at p, so the link that makes the options price fair is the link that beats the contract.
  const { breakEvenLink, verdict } = eventVsOptions(venue.price, 1 / optionsMultiple);
  const yours = call ? (call.side === side ? call.probability : 1 - call.probability) : undefined;

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="label" tone="muted">
          This bet vs. a {venueName} bet
        </Text>
        {quote.basis === 'sample' ? (
          <Chip label="Sample odds" color={colors.no} />
        ) : quote.basis === 'snapshot' ? (
          <Chip label={`Snapshot · ${formatDate(quote.asOf)}`} color={colors.violet} />
        ) : null}
      </View>
      <Text variant="caption" tone="faint">
        Put the same {formatMoney(stake)} on each.
        {related ? ` ${venueName} doesn’t list this exact question; this is its closest market.` : ''}
      </Text>

      <View style={styles.columns}>
        <Column
          title={`${venueName} · ${sideLabel} at ${cents(venue.price)}`}
          rows={[
            ['Buys', `${venue.contracts} contracts`],
            ['Pays if right', `${formatMoney(venue.payout)} · ${formatMultiple(venue.multiple)}`],
            ['Odds', `Crowd: ${formatPercent(venue.price)}`],
            ['Needs', related ? `“${quote.title}” to resolve ${sideLabel}` : `The question to resolve ${sideLabel} by ${formatDate(question.resolution.resolvesOn)}`],
          ]}
        />
        <Column
          title="This bet"
          accent
          rows={[
            ['Buys', `${contracts} ${contracts === 1 ? 'contract' : 'contracts'}`],
            [
              'Pays if right',
              priced.maxValuePerContract === null
                ? `${formatMoney(optionsPayout)}+ · no cap`
                : `${formatMoney(optionsPayout)} · ${formatMultiple(optionsMultiple)}`,
            ],
            ['Odds', `Options market: ${formatPercent(top.probability)}`],
            ['Needs', `${rangeLabel(priced.underlying, top.lower, top.upper)} by ${formatDate(priced.expiration)}`],
          ]}
        />
      </View>

      <Text tone="muted">
        {verdict === 'move-priced-above-event'
          ? `At today’s prices the ${venueName} contract pays more per dollar than this bet even if ${priced.underlying} followed the event every time: the options market prices the stock move as likelier than the event itself. Take this bet for the stock move, not as a way into the question.`
          : `If both go your way, this bet pays ${formatMultiple(optionsPayout / venue.payout)} what the ${venueName} contract does. The price: it needs two things, the event and the stock. Per dollar it beats the ${venueName} contract when ${priced.underlying} follows a ${sideLabel} at least ${formatPercent(breakEvenLink)} of the time.`}
      </Text>
      {yours !== undefined ? (
        <Text variant="caption" tone="faint">
          Your call gives {sideLabel} {formatPercent(yours)} against the crowd’s {formatPercent(venue.price)}.{' '}
          {yours > venue.price + 0.05
            ? `The ${venueName} contract is the cleaner way to bet that; this bet adds the stock on top.`
            : `You roughly agree with the crowd on the event, so this bet only makes sense if your edge is in the stock.`}
        </Text>
      ) : null}
      {related && quote.note ? (
        <Text variant="caption" tone="muted">
          How it differs: {quote.note} So the odds aren’t directly comparable; the dollars are.
        </Text>
      ) : null}
      <Text variant="caption" tone="faint">
        Before fees. {venueName} contracts pay $1 each when the market resolves; this bet is paper and pays at expiry.
      </Text>
    </Card>
  );
}

function Column({ title, rows, accent = false }: { title: string; rows: [string, string][]; accent?: boolean }) {
  return (
    <View style={[styles.column, accent && styles.columnAccent]}>
      <Text variant="label" tone={accent ? 'accent' : 'default'}>
        {title}
      </Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text variant="caption" tone="faint">
            {label}
          </Text>
          <Text variant="caption">{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  columns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1, gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg },
  columnAccent: { borderWidth: 1, borderColor: colors.accent },
  row: { gap: 2 },
});
