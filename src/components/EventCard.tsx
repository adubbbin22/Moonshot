import { Pressable, StyleSheet, View } from 'react-native';

import { CrowdBar } from '@/components/CrowdBar';
import { Card, Chip, Text } from '@/components/ui';
import type { EventQuestion, Side } from '@/domain/types';
import { CATEGORY_LABELS } from '@/theme/categories';
import { colors, radius, spacing } from '@/theme/tokens';

export interface EventCardProps {
  event: EventQuestion;
  onAnswer: (side: Side) => void;
}

/** Feed card: a question about the world. Answering it leads to bets. */
export function EventCard({ event, onAnswer }: EventCardProps) {
  return (
    <Card>
      <View style={styles.meta}>
        <Chip label={CATEGORY_LABELS[event.category]} />
        <Text variant="caption" tone="faint">
          Resolves {event.resolvesBy}
        </Text>
      </View>
      <Text variant="heading">{event.question}</Text>
      <Text tone="muted" numberOfLines={3}>
        {event.context}
      </Text>
      <CrowdBar yes={event.crowdYes} />
      <View style={styles.answers}>
        <AnswerButton label="Yes" color={colors.yes} onPress={() => onAnswer('yes')} />
        <AnswerButton label="No" color={colors.no} onPress={() => onAnswer('no')} />
      </View>
    </Card>
  );
}

function AnswerButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.answer, { borderColor: color }, pressed && { backgroundColor: color }]}>
      {({ pressed }) => (
        <Text variant="label" style={{ color: pressed ? colors.onAccent : color }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answers: { flexDirection: 'row', gap: spacing.md },
  answer: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
