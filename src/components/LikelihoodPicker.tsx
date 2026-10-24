import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { LIKELIHOODS } from '@/domain/thesisTree';
import { formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

const WORDS: Record<(typeof LIKELIHOODS)[number], string> = {
  0.1: 'Very unlikely',
  0.3: 'Unlikely',
  0.5: 'Toss-up',
  0.7: 'Likely',
  0.9: 'Very likely',
};

export interface LikelihoodPickerProps {
  /** The question above the scale, e.g. "If that holds, how likely is this?" */
  prompt: string;
  value?: number;
  /** Where a value the user didn't pick came from, e.g. "from your call". */
  note?: string;
  onChange: (probability: number) => void;
}

/** Five coarse steps from very unlikely to very likely. */
export function LikelihoodPicker({ prompt, value, note, onChange }: LikelihoodPickerProps) {
  const picked = LIKELIHOODS.find((p) => p === value);
  const caption =
    value === undefined
      ? null
      : `${picked !== undefined ? WORDS[picked] : formatPercent(value)}${note ? ` · ${note}` : ''}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="label" tone="muted" style={styles.prompt}>
          {prompt}
        </Text>
        {caption ? (
          <Text variant="caption" tone="faint">
            {caption}
          </Text>
        ) : null}
      </View>
      <View style={styles.scale} accessibilityRole="radiogroup" accessibilityLabel={prompt}>
        {LIKELIHOODS.map((p) => {
          const selected = p === picked;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${WORDS[p]}, ${formatPercent(p)}`}
              onPress={() => onChange(p)}
              style={[styles.option, selected && styles.selected]}>
              <Text variant="label" tone={selected ? 'onAccent' : 'muted'}>
                {formatPercent(p)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  prompt: { flex: 1 },
  scale: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.accent },
});
