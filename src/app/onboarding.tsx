import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConvexityCurve } from '@/components/ConvexityCurve';
import { DISCLAIMER } from '@/components/Disclaimer';
import { Button, Chip, Screen, Text } from '@/components/ui';
import { barbellSplit, BUDGET_OPTIONS } from '@/domain/sizing';
import { formatMoney } from '@/lib/format';
import { useAppDispatch } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

const STEPS = ['intro', 'how', 'budget', 'terms'] as const;

const HOW_IT_WORKS = [
  { n: '1', title: 'Pick a belief', body: 'Answer a question about the world, or build a thesis.' },
  { n: '2', title: 'Get an asymmetric bet', body: 'We show bets where being right pays far more than being wrong costs.' },
  { n: '3', title: 'Bet small', body: 'Fixed amounts from a monthly budget. The most you can lose is what you put in.' },
];

export default function OnboardingScreen() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(100);
  const [accepted, setAccepted] = useState(false);

  const current = STEPS[step];
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () =>
    dispatch({ type: 'completeOnboarding', monthlyBudget: budget, acceptedAt: new Date().toISOString() });

  const footer =
    current === 'terms' ? (
      <Button label="Start" disabled={!accepted} onPress={finish} />
    ) : (
      <Button label={current === 'intro' ? 'Show me' : 'Continue'} onPress={next} />
    );

  return (
    <Screen footer={footer} edges={['top', 'bottom']}>
      <View style={styles.dots}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      {current === 'intro' ? (
        <View style={styles.section}>
          <Text variant="display">Moonshot</Text>
          <Text variant="heading">
            Index funds bet on average. Moonshot is for when you think you know something.
          </Text>
          <ConvexityCurve />
          <Text tone="muted">
            Small bets with a capped downside and a big upside, each one tied to a view about where
            the world is going.
          </Text>
        </View>
      ) : null}

      {current === 'how' ? (
        <View style={styles.section}>
          <Text variant="title">How it works</Text>
          {HOW_IT_WORKS.map((item) => (
            <View key={item.n} style={styles.howRow}>
              <View style={styles.howNumber}>
                <Text variant="label" tone="onAccent">
                  {item.n}
                </Text>
              </View>
              <View style={styles.howText}>
                <Text variant="heading">{item.title}</Text>
                <Text tone="muted">{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {current === 'budget' ? (
        <View style={styles.section}>
          <Text variant="title">Set your moonshot budget</Text>
          <Text tone="muted">
            How much could you lose each month without it changing your life? That’s your budget.
            Most of these bets will go to zero. A few might not.
          </Text>
          <View style={styles.chips}>
            {BUDGET_OPTIONS.map((amount) => (
              <Chip
                key={amount}
                label={`${formatMoney(amount)}/mo`}
                selected={budget === amount}
                onPress={() => setBudget(amount)}
              />
            ))}
          </View>
          <BarbellExample />
        </View>
      ) : null}

      {current === 'terms' ? (
        <View style={styles.section}>
          <Text variant="title">Before you start</Text>
          <Text tone="muted">{DISCLAIMER}</Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => setAccepted((a) => !a)}
            style={styles.checkRow}>
            <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
              {accepted ? (
                <Text variant="caption" tone="onAccent">
                  ✓
                </Text>
              ) : null}
            </View>
            <Text style={styles.checkLabel}>
              I understand these bets can go to zero and that Moonshot is not giving me financial
              advice.
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

/** Shows the barbell split on a round example so the budget feels concrete. */
function BarbellExample() {
  const { safe, moonshot } = barbellSplit(10_000);
  return (
    <View style={styles.barbell}>
      <Text variant="label">The barbell, on $10,000 of savings</Text>
      <View style={styles.barbellBar}>
        <View style={[styles.barbellSafe, { flex: safe }]} />
        <View style={[styles.barbellMoon, { flex: moonshot }]} />
      </View>
      <View style={styles.barbellLabels}>
        <Text variant="caption" tone="muted">
          {formatMoney(safe)} very safe
        </Text>
        <Text variant="caption" tone="upside">
          {formatMoney(moonshot)} moonshots
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
  dotActive: { backgroundColor: colors.accent },
  section: { gap: spacing.lg, paddingTop: spacing.lg },
  howRow: { flexDirection: 'row', gap: spacing.md },
  howNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howText: { flex: 1, gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  barbell: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  barbellBar: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  barbellSafe: { backgroundColor: colors.textFaint },
  barbellMoon: { backgroundColor: colors.upside },
  barbellLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { flex: 1 },
});
