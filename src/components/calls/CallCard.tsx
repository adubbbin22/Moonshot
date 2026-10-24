import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ResolutionNote } from '@/components/ResolutionNote';
import { Button, Card, Chip, Text } from '@/components/ui';
import { CONFIDENCE_PRESETS, DEFAULT_CONFIDENCE } from '@/domain/calls';
import type { EventQuestion, Side } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/theme/categories';
import { colors, radius, spacing } from '@/theme/tokens';

export interface CallCardProps {
  question: EventQuestion;
  onLock: (side: Side, probability: number) => void;
  onSkip: () => void;
}

/** One question: pick a side, say how sure you are, lock it in. Nobody else's number is shown yet. */
export function CallCard({ question, onLock, onSkip }: CallCardProps) {
  const [side, setSide] = useState<Side | null>(null);
  const [probability, setProbability] = useState(DEFAULT_CONFIDENCE);

  return (
    <Card style={styles.card}>
      <View style={styles.meta}>
        <Chip label={`${CATEGORY_EMOJI[question.category]} ${CATEGORY_LABELS[question.category]}`} />
        <Text variant="caption" tone="faint">
          Resolves {formatDate(question.resolution.resolvesOn)}
        </Text>
      </View>
      <Text variant="title">{question.question}</Text>
      <Text tone="muted">{question.context}</Text>
      <ResolutionNote resolution={question.resolution} />

      <View style={styles.sides}>
        {(['yes', 'no'] as const).map((s) => {
          const selected = side === s;
          const color = s === 'yes' ? colors.yes : colors.no;
          return (
            <Pressable
              key={s}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setSide(s)}
              style={[styles.side, { borderColor: color }, selected && { backgroundColor: color }]}>
              <Text variant="heading" style={{ color: selected ? colors.onAccent : color }}>
                {s === 'yes' ? 'Yes' : 'No'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {side ? (
        <View style={styles.confidence}>
          <Text variant="label" tone="muted">
            How sure are you?
          </Text>
          <View style={styles.chips}>
            {CONFIDENCE_PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                label={`${preset.label} · ${Math.round(preset.probability * 100)}%`}
                selected={probability === preset.probability}
                onPress={() => setProbability(preset.probability)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button label="Lock it in" disabled={!side} onPress={() => side && onLock(side, probability)} />
      <Button label="Skip, no take" variant="ghost" onPress={onSkip} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sides: { flexDirection: 'row', gap: spacing.md },
  side: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidence: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
