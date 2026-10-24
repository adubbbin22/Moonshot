import { Pressable, StyleSheet, View } from 'react-native';

import { LikelihoodPicker } from '@/components/LikelihoodPicker';
import { Card, Text } from '@/components/ui';
import type { Ratings } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

export interface PremortemProps {
  tree: ThesisTree;
  ratings: Ratings;
  marked: string[];
  killCriteria: string[];
  /** The carried belief, so re-rating a part shows its effect. */
  belief?: number;
  onToggle: (storyId: string) => void;
  onRate: (claimId: string, probability: number) => void;
}

/**
 * Inversion: assume the belief turned out wrong and pick the stories of how.
 * Each marked story puts its part up for re-rating and adds its early
 * warning to the user's kill criteria.
 */
export function Premortem({ tree, ratings, marked, killCriteria, belief, onToggle, onRate }: PremortemProps) {
  return (
    <>
      {tree.premortem.map((story) => {
        const index = tree.premises.findIndex((p) => p.id === story.breaks);
        const premise = tree.premises[index];
        const checked = marked.includes(story.id);
        return (
          <Card key={story.id} style={checked && styles.marked}>
            <Text>{story.story}</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => onToggle(story.id)}
              style={[styles.toggle, checked && styles.toggleOn]}>
              <View style={[styles.box, checked && styles.boxOn]} />
              <Text variant="label" tone={checked ? 'default' : 'muted'}>
                This could happen
              </Text>
            </Pressable>
            {checked && premise ? (
              <View style={styles.followUp}>
                <Text variant="caption" tone="faint">
                  It breaks part {index + 1}: {premise.claim}
                </Text>
                <LikelihoodPicker
                  prompt="Knowing this could happen, re-rate that part"
                  value={ratings[premise.id]}
                  onChange={(p) => onRate(premise.id, p)}
                />
                <Text variant="caption" tone="muted">
                  Early warning: {story.signal}
                </Text>
              </View>
            ) : null}
          </Card>
        );
      })}

      <Card style={styles.summary}>
        <Text variant="label" tone="muted">
          Your kill criteria
        </Text>
        {killCriteria.length === 0 ? (
          <Text tone="muted">
            Mark the stories that could happen. Their early warnings become your kill criteria.
          </Text>
        ) : (
          <>
            {killCriteria.map((signal) => (
              <Text key={signal}>• {signal}</Text>
            ))}
            <Text variant="caption" tone="faint">
              Saved with any bet you place from this thesis. If one shows up, your reasoning is breaking.
            </Text>
          </>
        )}
        {belief !== undefined ? (
          <Text variant="label" style={styles.yours}>
            Your belief now: {formatPercent(belief)}
          </Text>
        ) : null}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  marked: { borderColor: colors.no },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOn: { borderColor: colors.no },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: colors.textFaint },
  boxOn: { backgroundColor: colors.no, borderColor: colors.no },
  followUp: { gap: spacing.sm },
  summary: { borderColor: colors.violet },
  yours: { color: colors.violet },
});
