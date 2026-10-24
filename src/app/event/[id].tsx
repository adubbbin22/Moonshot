import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BetCard } from '@/components/BetCard';
import { CrowdBar } from '@/components/CrowdBar';
import { Card, Chip, Screen, Text } from '@/components/ui';
import type { Side } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { CATEGORY_LABELS } from '@/theme/categories';
import { colors, radius, spacing } from '@/theme/tokens';

/** A single question: pick a side, see the bets that pay off if you're right. */
export default function EventScreen() {
  const params = useLocalSearchParams<{ id: string; side?: Side }>();
  const event = catalog.getEvent(params.id);
  const [side, setSide] = useState<Side>(params.side === 'no' ? 'no' : 'yes');

  if (!event) {
    return (
      <Screen edges={[]}>
        <Text>This question is no longer available.</Text>
      </Screen>
    );
  }

  const outcome = event.outcomes.find((o) => o.side === side) ?? event.outcomes[0];
  const bets = outcome.betIds.flatMap((id) => catalog.getBet(id) ?? []);

  return (
    <Screen edges={[]}>
      <View style={styles.meta}>
        <Chip label={CATEGORY_LABELS[event.category]} />
        <Text variant="caption" tone="faint">
          Resolves {event.resolvesBy}
        </Text>
      </View>
      <Text variant="title">{event.question}</Text>
      <Text tone="muted">{event.context}</Text>
      <CrowdBar yes={event.crowdYes} />

      <View style={styles.toggle} accessibilityRole="tablist">
        {event.outcomes.map((o) => {
          const selected = o.side === side;
          const color = o.side === 'yes' ? colors.yes : colors.no;
          return (
            <Pressable
              key={o.side}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setSide(o.side)}
              style={[styles.toggleOption, selected && { backgroundColor: color }]}>
              <Text variant="label" style={{ color: selected ? colors.onAccent : color }}>
                {o.side === 'yes' ? 'Yes' : 'No'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <Text variant="caption" tone="faint">
          If you’re right
        </Text>
        <Text variant="heading">{outcome.label}</Text>
        <Text tone="muted">{outcome.rationale}</Text>
      </Card>

      {bets.map((bet) => (
        <BetCard
          key={bet.id}
          bet={bet}
          onPress={() =>
            router.push({
              pathname: '/bet/[id]',
              params: { id: bet.id, eventId: event.id, side, thesis: outcome.rationale },
            })
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  toggleOption: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
