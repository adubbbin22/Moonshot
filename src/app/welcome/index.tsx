import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

const STEPS = [
  { n: '1', title: 'Make the call', body: 'Say how likely you think something is. Questions resolve on public data.' },
  { n: '2', title: 'See the market’s odds', body: 'Compare your number with what option prices imply.' },
  {
    n: '3',
    title: 'Bet small, only when you disagree',
    body: 'Options bets with a fixed max loss, sized from a monthly budget. Paper first.',
  },
];

export default function WelcomeScreen() {
  return (
    <Screen
      edges={['top', 'bottom']}
      footer={<Button label="Make your first call" onPress={() => router.push('/welcome/topics')} />}>
      <View style={styles.hero}>
        <Text variant="display">Moonshot</Text>
        <Text variant="heading">Make the call. See the market’s odds. Bet small only when you disagree.</Text>
      </View>
      {STEPS.map((step) => (
        <View key={step.n} style={styles.row}>
          <View style={styles.number}>
            <Text variant="label" tone="onAccent">
              {step.n}
            </Text>
          </View>
          <View style={styles.text}>
            <Text variant="heading">{step.title}</Text>
            <Text tone="muted">{step.body}</Text>
          </View>
        </View>
      ))}
      <Text variant="caption" tone="faint">
        Free to play. No account needed to start.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  number: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xs },
});
