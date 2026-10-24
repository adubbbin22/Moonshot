import { StyleSheet, View } from 'react-native';

import { Card, Stat, StatRow, Text } from '@/components/ui';
import type { CallStyle, TakeProfile } from '@/domain/takeProfile';
import { useNarrative } from '@/hooks/useNarrative';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/theme/categories';
import { colors, radius, spacing } from '@/theme/tokens';

const STYLE_LABELS: Record<CallStyle, string> = {
  measured: 'Measured',
  confident: 'Confident',
  bold: 'Bold',
};

/** What the app has learned from your calls: summary, strongest takes, and topics. */
export function TakeProfileView({ profile }: { profile: TakeProfile }) {
  const narrative = useNarrative();
  const topTakes = profile.views.slice(0, 3);
  const engaged = profile.topics.filter((t) => t.calls > 0 || t.skips > 0);
  const maxCalls = Math.max(1, ...engaged.map((t) => t.calls));

  return (
    <View style={styles.wrap}>
      <Card>
        <Text variant="heading">{narrative ?? ' '}</Text>
        <StatRow>
          <Stat label="Calls" value={String(profile.totalCalls)} />
          <Stat label="Topics" value={String(profile.topics.filter((t) => t.calls > 0).length)} />
          <Stat label="Style" value={profile.style ? STYLE_LABELS[profile.style] : '—'} />
        </StatRow>
      </Card>

      {topTakes.length > 0 ? (
        <Card>
          <Text variant="label" tone="muted">
            Your strongest takes
          </Text>
          {topTakes.map((view) => (
            <View key={view.questionId} style={styles.take}>
              <Text variant="caption" tone="faint">
                {catalog.getEvent(view.questionId)?.question}
              </Text>
              <Text variant="label" style={{ color: view.side === 'yes' ? colors.yes : colors.no }}>
                {formatPercent(view.probability)} {view.side === 'yes' ? 'Yes' : 'No'} · {view.stance}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {engaged.length > 0 ? (
        <Card>
          <Text variant="label" tone="muted">
            What you have takes on
          </Text>
          {engaged.map((topic) => (
            <View key={topic.category} style={styles.topic}>
              <View style={styles.topicLabel}>
                <Text variant="label">
                  {CATEGORY_EMOJI[topic.category]} {CATEGORY_LABELS[topic.category]}
                </Text>
                <Text variant="caption" tone="faint">
                  {topic.calls} {topic.calls === 1 ? 'call' : 'calls'}
                  {topic.skips > 0 ? ` · ${topic.skips} skipped` : ''}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(4, (topic.calls / maxCalls) * 100)}%` }]} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  take: { gap: 2 },
  topic: { gap: spacing.xs },
  topicLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.violet },
});
