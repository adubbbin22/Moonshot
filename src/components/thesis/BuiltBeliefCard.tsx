import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { builtBelief, carriedBelief, gutCheck, weakestLink, type OutsideViewRate, type Ratings } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const VERDICTS = {
  lower:
    'Every part has to hold, so the whole is less likely than it feels. People do this all the time: a story with several parts feels more likely than any one part, but it’s less likely.',
  higher: 'Your parts add up to more than your gut. Either a part is rated too high, or your gut is missing something.',
  close: 'Your parts agree with your gut.',
} as const;

export interface BuiltBeliefCardProps {
  tree: ThesisTree;
  ratings: Ratings;
  gut?: number;
  outside: OutsideViewRate;
  blend: boolean;
  onBlend: (blend: boolean) => void;
}

/** What the parts multiply out to, set against the gut and the outside view, and which number carries forward. */
export function BuiltBeliefCard({ tree, ratings, gut, outside, blend, onBlend }: BuiltBeliefCardProps) {
  const parts = builtBelief(tree, ratings);
  const total = tree.premises.length;

  if (parts === undefined) {
    const rated = tree.premises.filter((p) => ratings[p.id] !== undefined).length;
    return (
      <Card>
        <Text tone="muted">
          Rate all {total} parts to see what they add up to. {rated} of {total} done.
        </Text>
      </Card>
    );
  }

  const weakest = weakestLink(tree, ratings);
  const blended = carriedBelief(tree, ratings, true) ?? parts;
  const choices = [
    { blend: false, label: 'Your parts', value: parts },
    { blend: true, label: 'Blend with past cases', value: blended },
  ];

  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        Your belief, built from its parts
      </Text>
      <Text variant="display">{formatPercent(parts)}</Text>
      <Text variant="caption" tone="faint">
        {tree.premises.map((p) => formatPercent(ratings[p.id])).join(' × ')} = {formatPercent(parts)}
      </Text>
      {gut !== undefined ? (
        <Text>
          Your gut said {formatPercent(gut)}. {VERDICTS[gutCheck(gut, parts)]}
        </Text>
      ) : null}
      {weakest ? (
        <Text tone="muted">
          Weakest link: “{weakest.claim}” at {formatPercent(ratings[weakest.id])}. Your belief can’t be more likely
          than its weakest part.
        </Text>
      ) : null}

      <View style={styles.carry}>
        <Text variant="label" tone="muted">
          Which number do you carry forward?
        </Text>
        <Text variant="caption" tone="faint">
          Past cases put it at {formatPercent(outside.rate)}. Good forecasters start from how past cases went and
          adjust from there; blending meets halfway.
        </Text>
        <View style={styles.choices} accessibilityRole="radiogroup">
          {choices.map((choice) => {
            const selected = choice.blend === blend;
            return (
              <Pressable
                key={choice.label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onBlend(choice.blend)}
                style={[styles.choice, selected && styles.choiceSelected]}>
                <Text variant="caption" tone={selected ? 'onAccent' : 'muted'}>
                  {choice.label}
                </Text>
                <Text variant="heading" tone={selected ? 'onAccent' : 'default'}>
                  {formatPercent(choice.value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.violet },
  carry: { gap: spacing.sm, marginTop: spacing.sm },
  choices: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
});
