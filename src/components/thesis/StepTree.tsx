import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BetExpressions } from '@/components/BetExpressions';
import { ClaimCard } from '@/components/thesis/ClaimCard';
import { Text } from '@/components/ui';
import {
  branchProbability,
  chainProbability,
  reasoningLines,
  type Branch,
  type Ratings,
} from '@/domain/thesisTree';
import type { Bet, ThesisStep, ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

export interface StepTreeProps {
  tree: ThesisTree;
  ratings: Ratings;
  fromCalls: Set<string>;
  onRate: (claimId: string, probability: number) => void;
  onOpenBet: (bet: Bet, step: ThesisStep) => void;
}

const BRANCH_TITLES: Record<Branch, string> = {
  ifTrue: 'If it happens',
  ifFalse: 'If it doesn’t happen',
};

/** One side of the tree: what follows if the belief holds, or if it fails. */
export function BranchSection({
  branch,
  belief,
  startOpen,
  ...props
}: StepTreeProps & { branch: Branch; belief: number; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Text variant="heading">{BRANCH_TITLES[branch]}</Text>
          <Text variant="caption" tone="faint">
            You give this {formatPercent(branchProbability(belief, branch))}
          </Text>
        </View>
        <Text variant="label" tone="accent">
          {open ? 'Hide' : 'Show'}
        </Text>
      </Pressable>
      {open ? props.tree[branch].map((step) => <StepNode key={step.id} {...props} step={step} branch={branch} depth={0} />) : null}
    </View>
  );
}

function StepNode({
  step,
  branch,
  depth,
  ...props
}: StepTreeProps & { step: ThesisStep; branch: Branch; depth: number }) {
  const { tree, ratings, fromCalls, onRate, onOpenBet } = props;
  const value = ratings[step.id];
  const chain = chainProbability(tree, ratings, step.id);
  const items = (step.bets ?? []).flatMap((link) => {
    const bet = catalog.getBet(link.betId);
    return bet ? [{ bet, why: link.why }] : [];
  });
  const prompt =
    depth > 0
      ? 'If the step above holds, how likely is this?'
      : branch === 'ifTrue'
        ? 'If your belief holds, how likely is this?'
        : 'If your belief fails, how likely is this?';

  return (
    <View style={styles.node}>
      <ClaimCard
        eyebrow="Which means…"
        claim={step.claim}
        forLabel="Because"
        forText={step.because}
        against={step.against}
        check={step.check}
        prompt={prompt}
        value={value}
        note={fromCalls.has(step.id) ? 'from your call' : undefined}
        onRate={(p) => onRate(step.id, p)}>
        {chain === undefined ? (
          <Text variant="caption" tone="faint">
            Rate it to see your chain{items.length > 0 ? ' and the bets that follow from it' : ''}.
          </Text>
        ) : (
          <>
            <Text variant="label" style={styles.chain}>
              Your chain to here:{' '}
              {reasoningLines(tree, ratings, step.id)
                .map((line) => formatPercent(line.probability ?? 0))
                .join(' × ')}{' '}
              = {formatPercent(chain)}
            </Text>
            {items.length > 0 ? (
              <View style={styles.bets}>
                <Text variant="caption" tone="faint">
                  Bets that pay if the chain to here holds
                </Text>
                <BetExpressions
                  items={items}
                  chain={chain}
                  noFitText="No bet fits right now. Your reasoning still counts."
                  onOpen={(bet) => onOpenBet(bet, step)}
                />
              </View>
            ) : step.next ? null : (
              <Text tone="muted">No obvious asymmetric bet for this step. Your reasoning still counts.</Text>
            )}
          </>
        )}
      </ClaimCard>
      {value !== undefined && step.next ? (
        <View style={styles.children}>
          {step.next.map((child) => (
            <StepNode key={child.id} {...props} step={child} branch={branch} depth={depth + 1} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  sectionTitle: { flex: 1, gap: 2 },
  node: { gap: spacing.md },
  children: {
    gap: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    borderRadius: radius.sm,
  },
  chain: { color: colors.violet },
  bets: { gap: spacing.sm },
});
