import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BudgetMeter } from '@/components/BudgetMeter';
import { EventCard } from '@/components/EventCard';
import { Card, Chip, Screen, Text } from '@/components/ui';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { colors, spacing } from '@/theme/tokens';

/** Home feed: questions about what's happening in the world, each leading to bets. */
export default function FeedScreen() {
  const { profile, positions } = useAppState();
  const events = catalog.listEvents();

  return (
    <Screen
      title="Moonshot"
      subtitle="What do you think happens next?"
      accessory={<Chip label="Paper mode" color={colors.violet} />}>
      <Card>
        <BudgetMeter profile={profile} positions={positions} />
      </Card>

      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onAnswer={(side) =>
            router.push({ pathname: '/event/[id]', params: { id: event.id, side } })
          }
        />
      ))}

      <Card onPress={() => router.navigate('/theses')} style={styles.promo}>
        <View style={styles.promoText}>
          <Text variant="heading">Not sure where to start?</Text>
          <Text tone="muted">Answer three questions about the world and get bets that match your view.</Text>
        </View>
        <Text variant="label" tone="accent">
          Build a thesis →
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  promo: { borderColor: colors.violet },
  promoText: { gap: spacing.xs },
});
