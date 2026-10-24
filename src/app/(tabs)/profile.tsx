import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ConvexityCurve } from '@/components/ConvexityCurve';
import { Disclaimer } from '@/components/Disclaimer';
import { TakeProfileView } from '@/components/TakeProfileView';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { BUDGET_OPTIONS, maxStakePerBet } from '@/domain/sizing';
import { useTakeProfile } from '@/hooks/useTakeProfile';
import { formatMoney } from '@/lib/format';
import { useAppDispatch, useAppState } from '@/state/store';
import { spacing } from '@/theme/tokens';

const PRINCIPLES = [
  {
    title: 'Defined risk',
    body: 'Every bet is a long option or a debit spread. You pay once up front and that’s the most you can lose. No margin, no naked selling, no credit spreads.',
  },
  {
    title: 'Asymmetric payoff',
    body: 'We only show bets that can pay at least 3x what they cost.',
  },
  {
    title: 'Market odds, not opinions',
    body: 'The odds on every bet come from option prices, so you see what the market thinks before you bet against it.',
  },
  {
    title: 'Thesis first',
    body: 'Every bet starts from a belief about the world, so you know why you own it and when to admit you were wrong.',
  },
  {
    title: 'The barbell',
    body: 'Keep most of your money very safe. Put a small slice you can afford to lose into moonshots.',
  },
];

export default function ProfileScreen() {
  const { profile } = useAppState();
  const dispatch = useAppDispatch();
  const takes = useTakeProfile();

  return (
    <Screen title="You" subtitle="Your take profile, your budget, and how Moonshot works.">
      <TakeProfileView profile={takes} />
      <View style={styles.actions}>
        <Button label="Ways to express" onPress={() => router.push('/takes')} />
        <Button label="More calls" variant="secondary" onPress={() => router.push('/calls')} />
      </View>

      <Card>
        <Text variant="heading">Monthly moonshot budget</Text>
        <Text tone="muted">
          Money you could lose without it changing your life. Each bet is capped at{' '}
          {formatMoney(maxStakePerBet(profile))}.
        </Text>
        <View style={styles.chips}>
          {BUDGET_OPTIONS.map((amount) => (
            <Chip
              key={amount}
              label={formatMoney(amount)}
              selected={profile.monthlyBudget === amount}
              onPress={() => dispatch({ type: 'setMonthlyBudget', monthlyBudget: amount })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="heading">Why asymmetry</Text>
        <ConvexityCurve />
        {PRINCIPLES.map((p) => (
          <View key={p.title} style={styles.principle}>
            <Text variant="label">{p.title}</Text>
            <Text tone="muted">{p.body}</Text>
          </View>
        ))}
      </Card>

      <Disclaimer />
      <Button label="Reset demo" variant="secondary" onPress={() => dispatch({ type: 'reset' })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { gap: spacing.sm },
  principle: { gap: spacing.xs },
});
