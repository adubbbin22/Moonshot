import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BetExpressions } from '@/components/BetExpressions';
import { LikelihoodPicker } from '@/components/LikelihoodPicker';
import { ClaimCard } from '@/components/thesis/ClaimCard';
import { Text } from '@/components/ui';
import {
  betChain,
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
  /** The carried belief every chain starts from. */
  belief: number;
  ratings: Ratings;
  fromCalls: Set<string>;
  /** Step id -> chance its effect outlasts the response it provokes. */
  lasts: Ratings;
  onRate: (claimId: string, probability: number) => void;
  onRateLasts: (stepId: string, probability: number) => void;
  onOpenBet: (bet: Bet, step: ThesisStep) => void;
}

const BRANCH_TITLES: Record<Branch, string> = {
  ifTrue: 'If it happens',
  ifFalse: 'If it doesn’t happen',
};

/** One side of the tree: what follows if the belief holds, or if it fails. */
export function BranchSection({ branch, startOpen, ...props }: StepTreeProps & { branch: Branch; startOpen: boolean }) {
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
            You give this {formatPercent(branchProbability(props.belief, branch))}
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
  const { tree, belief, ratings, fromCalls, lasts, onRate, onRateLasts, onOpenBet } = props;
  const value = ratings[step.id];
  const chain = chainProbability(tree, ratings, step.id, belief);
  const forBets = betChain(tree, ratings, lasts, step.id, belief);
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
              {reasoningLines(tree, ratings, step.id, { belief })
                .map((line) => formatPercent(line.probability ?? 0))
                .join(' × ')}{' '}
              = {formatPercent(chain)}
            </Text>
            {items.length > 0 && step.thenWhat ? (
              <View style={styles.thenWhat}>
                <Text variant="caption" tone="faint">
                  Then what?
                </Text>
                <Text tone="muted">{step.thenWhat}</Text>
                <LikelihoodPicker
                  prompt="How likely is it to last until the bets expire anyway?"
                  value={lasts[step.id]}
                  onChange={(p) => onRateLasts(step.id, p)}
                />
              </View>
            ) : null}
            {items.length > 0 && forBets === undefined ? (
              <Text variant="caption" tone="faint">
                Rate how long it lasts to see the bets.
              </Text>
            ) : null}
            {items.length > 0 && forBets !== undefined ? (
              <View style={styles.bets}>
                {step.thenWhat ? (
                  <Text variant="label" style={styles.chain}>
                    For these bets: {formatPercent(chain)} × {formatPercent(lasts[step.id])} lasts ={' '}
                    {formatPercent(forBets)}
                  </Text>
                ) : null}
                <Text variant="caption" tone="faint">
                  {step.thenWhat
                    ? 'Bets that pay if the chain holds through expiry'
                    : 'Bets that pay if the chain to here holds'}
                </Text>
                <BetExpressions
                  items={items}
                  chain={forBets}
                  noFitText="No bet fits right now. Your reasoning still counts."
                  onOpen={(bet) => onOpenBet(bet, step)}
                />
              </View>
            ) : null}
            {items.length === 0 && !step.next ? (
              <Text tone="muted">No obvious asymmetric bet for this step. Your reasoning still counts.</Text>
            ) : null}
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
  thenWhat: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
});
