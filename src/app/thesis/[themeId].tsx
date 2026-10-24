import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BetCard } from '@/components/BetCard';
import { Button, Card, Screen, Text } from '@/components/ui';
import { buildThesis, matchBets, type ThesisAnswers } from '@/domain/thesisEngine';
import { catalog } from '@/services/catalog';
import { useSaveThesis } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Guided thesis builder: one question at a time, then a plain-English thesis
 * and the bets that follow from it.
 */
export default function ThesisBuilderScreen() {
  const { themeId } = useLocalSearchParams<{ themeId: string }>();
  const theme = catalog.getTheme(themeId);
  const saveThesis = useSaveThesis();
  const [answers, setAnswers] = useState<ThesisAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!theme) {
    return (
      <Screen edges={[]}>
        <Text>This theme is no longer available.</Text>
      </Screen>
    );
  }

  const thesis = buildThesis(theme, answers);
  const step = stepIndex < theme.steps.length ? theme.steps[stepIndex] : undefined;

  const choose = (stepId: string, optionId: string) => {
    setAnswers((a) => ({ ...a, [stepId]: optionId }));
    setStepIndex((i) => i + 1);
  };

  const restart = () => {
    setAnswers({});
    setStepIndex(0);
    setSaved(false);
  };

  if (step) {
    return (
      <Screen edges={[]}>
        <Progress current={stepIndex} total={theme.steps.length} />
        <Text variant="caption" tone="faint">
          {theme.emoji} {theme.hook}
        </Text>
        <Text variant="title">{step.prompt}</Text>
        <View style={styles.options}>
          {step.options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => choose(step.id, option.id)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
              <Text variant="heading">{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {stepIndex > 0 ? (
          <Button label="Back" variant="ghost" onPress={() => setStepIndex((i) => i - 1)} />
        ) : null}
      </Screen>
    );
  }

  const matches = matchBets(thesis.tags, catalog.listBets());

  return (
    <Screen edges={[]}>
      <Progress current={theme.steps.length} total={theme.steps.length} />
      <Text variant="caption" tone="faint">
        {theme.emoji} Your thesis
      </Text>
      <Card style={styles.thesisCard}>
        <Text variant="heading">“{thesis.statement}”</Text>
      </Card>
      <View style={styles.actions}>
        <Button
          label={saved ? 'Saved' : 'Save thesis'}
          variant="secondary"
          disabled={saved}
          onPress={() => {
            saveThesis({ themeId: theme.id, statement: thesis.statement, answerIds: thesis.answerIds });
            setSaved(true);
          }}
          style={styles.action}
        />
        <Button label="Start over" variant="ghost" onPress={restart} style={styles.action} />
      </View>

      <Text variant="heading">Bets that follow from this</Text>
      {matches.map(({ bet }) => (
        <BetCard
          key={bet.id}
          bet={bet}
          onPress={() =>
            router.push({
              pathname: '/bet/[id]',
              params: { id: bet.id, themeId: theme.id, thesis: thesis.statement },
            })
          }
        />
      ))}
    </Screen>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progress} accessibilityLabel={`Step ${Math.min(current + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.progressSegment, i < current && styles.progressDone]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.md },
  option: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionPressed: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  thesisCard: { borderColor: colors.violet },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  progress: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
  progressDone: { backgroundColor: colors.accent },
});
