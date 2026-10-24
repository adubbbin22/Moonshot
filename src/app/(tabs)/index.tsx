import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BudgetMeter } from '@/components/BudgetMeter';
import { EventCard } from '@/components/EventCard';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { useTakeProfile } from '@/hooks/useTakeProfile';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppDispatch, useAppState } from '@/state/store';
import { colors, spacing } from '@/theme/tokens';

/** Home feed: your takes, then questions about what's happening in the world. */
export default function FeedScreen() {
  const { profile, positions, calls, pendingLanding } = useAppState();
  const dispatch = useAppDispatch();
  const takes = useTakeProfile();
  const events = catalog.listEvents();

  // Onboarding ends on the feed (the navigator's anchor); continue to where the user was headed.
  useEffect(() => {
    if (pendingLanding === 'takes') {
      dispatch({ type: 'clearLanding' });
      router.push('/takes');
    }
  }, [pendingLanding, dispatch]);

  const strongest = takes.strongest;

  return (
    <Screen
      title="Moonshot"
      subtitle="What do you think happens next?"
      accessory={<Chip label="Paper mode" color={colors.violet} />}>
      <Card style={styles.takes}>
        <Text variant="label" tone="muted">
          Your takes
        </Text>
        {strongest ? (
          <>
            <Text variant="heading">
              Strongest: “{strongest.stance}” · {formatPercent(strongest.probability)}
            </Text>
            <Text variant="caption" tone="faint">
              {takes.totalCalls} {takes.totalCalls === 1 ? 'call' : 'calls'} so far
            </Text>
          </>
        ) : (
          <Text tone="muted">Make a few calls to see what the market thinks of your takes.</Text>
        )}
        <View style={styles.actions}>
          {strongest ? (
            <Button label="Ways to express" onPress={() => router.push('/takes')} />
          ) : null}
          <Button
            label={strongest ? 'More calls' : 'Make calls'}
            variant={strongest ? 'secondary' : 'primary'}
            onPress={() => router.push('/calls')}
          />
        </View>
      </Card>

      <Card>
        <BudgetMeter profile={profile} positions={positions} />
      </Card>

      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          call={calls.find((c) => c.questionId === event.id)}
          onCall={() => router.push({ pathname: '/calls', params: { questionId: event.id } })}
          onOpen={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        />
      ))}

      <Card onPress={() => router.navigate('/theses')} style={styles.promo}>
        <View style={styles.promoText}>
          <Text variant="heading">Want to go deeper?</Text>
          <Text tone="muted">Answer three questions about a big theme and get bets that match your view.</Text>
        </View>
        <Text variant="label" tone="accent">
          Build a thesis →
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  takes: { borderColor: colors.violet },
  actions: { gap: spacing.sm },
  promo: { borderColor: colors.border },
  promoText: { gap: spacing.xs },
});
