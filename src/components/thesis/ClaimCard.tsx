import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LikelihoodPicker } from '@/components/LikelihoodPicker';
import { Card, Text } from '@/components/ui';
import type { ClaimCheck } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

export interface ClaimCardProps {
  /** Small line above the claim: "Part 1 of 3", "Which means…". */
  eyebrow: string;
  claim: string;
  forLabel: string;
  forText: string;
  against: string;
  check?: ClaimCheck;
  prompt: string;
  value?: number;
  /** Where a rating the user didn't pick here came from. */
  note?: string;
  onRate: (probability: number) => void;
  /** Rendered under the rating: the chain, bets. */
  children?: ReactNode;
}

/** One claim to weigh: the case for, the case against, what would test it, and your rating. */
export function ClaimCard({
  eyebrow,
  claim,
  forLabel,
  forText,
  against,
  check,
  prompt,
  value,
  note,
  onRate,
  children,
}: ClaimCardProps) {
  return (
    <Card>
      <Text variant="caption" tone="faint">
        {eyebrow}
      </Text>
      <Text variant="heading">{claim}</Text>
      <View style={styles.argument}>
        <Text variant="caption" tone="faint">
          {forLabel}
        </Text>
        <Text tone="muted">{forText}</Text>
      </View>
      <View style={styles.argument}>
        <Text variant="caption" tone="faint">
          The case against
        </Text>
        <Text tone="muted">{against}</Text>
      </View>
      {check ? <CheckLink check={check} /> : null}
      <LikelihoodPicker prompt={prompt} value={value} note={note} onChange={onRate} />
      {children}
    </Card>
  );
}

function CheckLink({ check }: { check: ClaimCheck }) {
  const question = catalog.getEvent(check.questionId);
  if (!question) return null;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: question.id } })}
      style={({ pressed }) => [styles.check, pressed && styles.checkPressed]}>
      <Text variant="caption" tone="faint">
        Tested by a question · resolves {formatDate(question.resolution.resolvesOn)} ·{' '}
        {check.side === 'yes' ? 'Yes' : 'No'} means this holds
      </Text>
      <Text variant="label">{question.question} ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  argument: { gap: 2 },
  check: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  checkPressed: { backgroundColor: colors.surfaceRaised },
});
