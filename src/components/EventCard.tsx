import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Text } from '@/components/ui';
import type { Call, EventQuestion } from '@/domain/types';
import { formatDate, formatPercent } from '@/lib/format';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/theme/categories';
import { colors, spacing } from '@/theme/tokens';

export interface EventCardProps {
  event: EventQuestion;
  /** The user's call on this question, if they made one. */
  call?: Call;
  onCall: () => void;
  onOpen: () => void;
}

/** Feed card: a question about the world. Make the call, or browse the bets. */
export function EventCard({ event, call, onCall, onOpen }: EventCardProps) {
  const outcome = call ? event.outcomes.find((o) => o.side === call.side) : undefined;
  return (
    <Card>
      <View style={styles.meta}>
        <Chip label={`${CATEGORY_EMOJI[event.category]} ${CATEGORY_LABELS[event.category]}`} />
        <Text variant="caption" tone="faint">
          Resolves {formatDate(event.resolution.resolvesOn)}
        </Text>
      </View>
      <Text variant="heading">{event.question}</Text>
      <Text tone="muted" numberOfLines={3}>
        {event.context}
      </Text>
      {call ? (
        <Text variant="label" style={{ color: call.side === 'yes' ? colors.yes : colors.no }}>
          Your call: {formatPercent(call.probability)} {call.side === 'yes' ? 'Yes' : 'No'} · {outcome?.label}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {call ? null : <Button label="Make the call" onPress={onCall} style={styles.action} />}
        <Button label="See bets" variant="secondary" onPress={onOpen} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
