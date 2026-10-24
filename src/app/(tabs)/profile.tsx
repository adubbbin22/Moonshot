import { StyleSheet, View } from 'react-native';

import { ConvexityCurve } from '@/components/ConvexityCurve';
import { Disclaimer } from '@/components/Disclaimer';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { BUDGET_OPTIONS, maxStakePerBet } from '@/domain/sizing';
import { formatMoney } from '@/lib/format';
import { useAppDispatch, useAppState } from '@/state/store';
import { spacing } from '@/theme/tokens';

const PRINCIPLES = [
  {
    title: 'Capped downside',
    body: 'Every bet can lose at most what you put in. No leverage, no margin, no shorting.',
  },
  {
    title: 'Open-ended upside',
    body: 'We only show bets where being right pays many times what being wrong costs.',
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

  return (
    <Screen title="You" subtitle="Your moonshot budget and how Moonshot works.">
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
  principle: { gap: spacing.xs },
});
