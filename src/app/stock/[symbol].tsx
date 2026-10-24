import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BetExpressions } from '@/components/BetExpressions';
import { CompanyFacts } from '@/components/stock/CompanyFacts';
import { Card, Chip, Screen, Text } from '@/components/ui';
import { betsExpressing } from '@/domain/catalysts';
import type { Catalyst, CatalystKind, CatalystTiming, Direction } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

const KIND_LABELS: Record<CatalystKind, string> = {
  demand: 'Demand',
  pricing: 'Pricing',
  costs: 'Costs',
  rates: 'Rates',
  policy: 'Policy',
  event: 'Event',
  competition: 'Competition',
  sentiment: 'Sentiment',
};

const TIMING_LABELS: Record<CatalystTiming, string> = {
  'on-the-news': 'Moves on the news',
  'over-quarters': 'Shows up over quarters',
};

const KIND_OF: Record<string, string> = { stock: 'Stock', etf: 'Fund', commodity: 'Commodity fund' };

/**
 * The framework for one security: what it is, what moves it (the catalyst
 * map, both directions), what to watch, and the bets that express each
 * direction.
 */
export default function StockScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const profile = catalog.getUnderlying(symbol);

  if (!profile) {
    return (
      <Screen edges={[]}>
        <Text>No framework for {symbol} yet.</Text>
      </Screen>
    );
  }

  const bets = catalog.listBets();
  const sides: { direction: Direction; title: string; catalysts: Catalyst[] }[] = [
    { direction: 'up', title: 'What pushes it up', catalysts: profile.catalysts.filter((c) => c.direction === 'up') },
    { direction: 'down', title: 'What pushes it down', catalysts: profile.catalysts.filter((c) => c.direction === 'down') },
  ];

  return (
    <Screen edges={['bottom']}>
      <View style={styles.meta}>
        <Chip label={KIND_OF[profile.kind]} />
        <Text variant="caption" tone="faint">
          {profile.symbol}
        </Text>
      </View>
      <Text variant="title">{profile.name}</Text>
      <Text tone="muted">{profile.whatItIs}</Text>
      <Card>
        <Text variant="label" tone="muted">
          Moves on
        </Text>
        <Text>{profile.movesOn}</Text>
      </Card>
      <CompanyFacts symbol={profile.symbol} />
      {profile.provenance ? (
        <Card style={styles.drafted}>
          <Text variant="label" tone="muted">
            Drafted by AI, not yet reviewed
          </Text>
          <Text variant="caption" tone="muted">
            A model wrote this map. A person checks it before it enters the library.
          </Text>
        </Card>
      ) : null}

      {sides.map(({ direction, title, catalysts }) => {
        const color = direction === 'up' ? colors.upside : colors.downside;
        const expressing = betsExpressing(bets, profile.symbol, direction);
        return (
          <View key={direction} style={styles.side}>
            <Text variant="heading" style={{ color }}>
              {direction === 'up' ? '▲' : '▼'} {title}
            </Text>
            {catalysts.map((c) => (
              <CatalystCard key={c.id} catalyst={c} color={color} />
            ))}
            {expressing.length > 0 ? (
              <Card>
                <Text variant="caption" tone="faint">
                  Bets that pay if it {direction === 'up' ? 'rises' : 'falls'}
                </Text>
                <BetExpressions
                  items={expressing.map((bet) => ({ bet }))}
                  noFitText="No bet fits right now."
                  onOpen={(bet) => router.push({ pathname: '/bet/[id]', params: { id: bet.id } })}
                />
              </Card>
            ) : (
              <Text variant="caption" tone="faint">
                No bet in the catalog pays if it {direction === 'up' ? 'rises' : 'falls'}.
              </Text>
            )}
          </View>
        );
      })}

      <Card>
        <Text variant="label" tone="muted">
          Ways to lose even if you’re right about the world
        </Text>
        {profile.risks.map((risk) => (
          <Text key={risk} tone="muted">
            • {risk}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

function CatalystCard({ catalyst, color }: { catalyst: Catalyst; color: string }) {
  return (
    <Card>
      <Text variant="heading">{catalyst.label}</Text>
      <View style={styles.tags}>
        <Chip label={KIND_LABELS[catalyst.kind]} color={color} />
        <Chip label={TIMING_LABELS[catalyst.timing]} />
      </View>
      <Text tone="muted">{catalyst.why}</Text>
      <View style={styles.block}>
        <Text variant="caption" tone="faint">
          Watch for
        </Text>
        {catalyst.watch.map((w) => (
          <Text key={w} variant="caption" tone="muted">
            • {w}
          </Text>
        ))}
      </View>
      {catalyst.checks?.map((check) => {
        const question = catalog.getEvent(check.questionId);
        if (!question) return null;
        return (
          <Pressable
            key={check.questionId}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: question.id } })}
            style={({ pressed }) => [styles.check, pressed && styles.checkPressed]}>
            <Text variant="caption" tone="faint">
              Tested by a question · resolves {formatDate(question.resolution.resolvesOn)} ·{' '}
              {check.side === 'yes' ? 'Yes' : 'No'} means it fires
            </Text>
            <Text variant="label">{question.question} ›</Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { gap: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  block: { gap: 2 },
  check: { gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg },
  checkPressed: { backgroundColor: colors.surfaceRaised },
  drafted: { borderColor: colors.no },
});
