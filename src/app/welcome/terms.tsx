import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DISCLAIMER } from '@/components/Disclaimer';
import { Button, Chip, Screen, Text } from '@/components/ui';
import { BUDGET_OPTIONS, maxStakePerBet } from '@/domain/sizing';
import { formatMoney } from '@/lib/format';
import { initialState, useAppDispatch } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Before any bet is shown: a monthly budget and the risk disclosure. */
export default function WelcomeTermsScreen() {
  const dispatch = useAppDispatch();
  const [budget, setBudget] = useState(initialState.profile.monthlyBudget);
  const [accepted, setAccepted] = useState(false);
  const cap = maxStakePerBet({ ...initialState.profile, monthlyBudget: budget });

  const finish = () =>
    dispatch({
      type: 'completeOnboarding',
      monthlyBudget: budget,
      acceptedAt: new Date().toISOString(),
      landing: 'takes',
    });

  return (
    <Screen
      title="Before you see bets"
      subtitle="Calls are free. Bets cost money, even on paper, so set your limits first."
      edges={['top', 'bottom']}
      footer={<Button label="Show me" disabled={!accepted} onPress={finish} />}>
      <View style={styles.section}>
        <Text variant="heading">Monthly moonshot budget</Text>
        <Text tone="muted">
          Money you could lose without it changing your life. Options trade in contracts of 100 shares, so one
          bet usually costs $50–$250. Each bet is capped at {formatMoney(cap)}.
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
      </View>

      <View style={styles.section}>
        <Text variant="heading">The risk</Text>
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
            I understand these bets can go to zero and that Moonshot is not giving me financial advice.
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
