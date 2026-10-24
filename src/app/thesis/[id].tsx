import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LikelihoodPicker } from '@/components/LikelihoodPicker';
import { BuiltBeliefCard } from '@/components/thesis/BuiltBeliefCard';
import { ClaimCard } from '@/components/thesis/ClaimCard';
import { BranchSection } from '@/components/thesis/StepTree';
import { Button, Card, Screen, Text } from '@/components/ui';
import { leaningBranch } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { useThesisWork } from '@/hooks/useThesisWork';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

type Stage = 'gut' | 'parts' | 'follows';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'gut', label: 'Gut check' },
  { id: 'parts', label: 'Break it down' },
  { id: 'follows', label: 'What follows' },
];

/**
 * A thesis tree: gut check, then break the belief into the parts it depends
 * on, then follow what it means, step by step, down to the bets that pay if
 * the chain holds.
 */
export default function ThesisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tree = catalog.getThesis(id);
  if (!tree) {
    return (
      <Screen edges={[]}>
        <Text>This thesis is no longer available.</Text>
      </Screen>
    );
  }
  return <ThesisFlow key={tree.id} tree={tree} />;
}

function ThesisFlow({ tree }: { tree: ThesisTree }) {
  const work = useThesisWork(tree);
  const [stage, setStage] = useState<Stage>(() =>
    work.gut === undefined ? 'gut' : work.belief === undefined ? 'parts' : 'follows',
  );
  const reached: Record<Stage, boolean> = {
    gut: true,
    parts: work.gut !== undefined,
    follows: work.belief !== undefined,
  };
  const stageBar = <StageBar stage={stage} reached={reached} onSelect={setStage} />;

  // Each stage's Screen has its own key so switching stages starts at the top.

  if (stage === 'gut') {
    return (
      <Screen
        key="gut"
        edges={['bottom']}
        footer={<Button label="Break it down" disabled={!reached.parts} onPress={() => setStage('parts')} />}>
        {stageBar}
        <Text variant="caption" tone="faint">
          {tree.emoji} {tree.hook}
        </Text>
        <Text variant="title">{tree.belief}</Text>
        <Text tone="muted">
          Start with your gut. Then break it into the parts it depends on and see whether they agree.
        </Text>
        <Card>
          <LikelihoodPicker prompt="How likely is it?" value={work.gut} onChange={work.setGut} />
        </Card>
      </Screen>
    );
  }

  if (stage === 'parts' || work.belief === undefined) {
    const total = tree.premises.length;
    return (
      <Screen
        key="parts"
        edges={['bottom']}
        footer={<Button label="See what follows" disabled={!reached.follows} onPress={() => setStage('follows')} />}>
        {stageBar}
        <Text variant="caption" tone="faint">
          {tree.emoji} {tree.belief}
        </Text>
        <Text variant="title">Break it down</Text>
        <Text tone="muted">
          For this to happen, all of these have to hold. Rate each one assuming the ones above it hold. Multiplied
          together, they give your belief.
        </Text>
        {tree.premises.map((premise, i) => (
          <ClaimCard
            key={premise.id}
            eyebrow={`Part ${i + 1} of ${total}`}
            claim={premise.claim}
            forLabel="Why it could hold"
            forText={premise.why}
            against={premise.against}
            check={premise.check}
            prompt={i === 0 ? 'How likely is this?' : 'If the parts above hold, how likely is this?'}
            value={work.ratings[premise.id]}
            note={work.fromCalls.has(premise.id) ? 'from your call' : undefined}
            onRate={(p) => work.rate(premise.id, p)}
          />
        ))}
        <BuiltBeliefCard tree={tree} ratings={work.ratings} gut={work.gut} />
      </Screen>
    );
  }

  const lean = leaningBranch(work.belief);
  const other = lean === 'ifTrue' ? 'ifFalse' : 'ifTrue';
  const treeProps = {
    tree,
    belief: work.belief,
    ratings: work.ratings,
    fromCalls: work.fromCalls,
    onRate: work.rate,
    onOpenBet: (bet: { id: string }, step: { id: string }) =>
      router.push({ pathname: '/bet/[id]', params: { id: bet.id, thesisId: tree.id, stepId: step.id } }),
  };

  return (
    <Screen key="follows" edges={['bottom']}>
      {stageBar}
      <Card style={styles.belief}>
        <Text variant="caption" tone="faint">
          {tree.emoji} Your belief
        </Text>
        <Text variant="heading">{tree.belief}</Text>
        <View style={styles.beliefNumber}>
          <Text variant="title">{formatPercent(work.belief)}</Text>
          <Text variant="caption" tone="faint">
            built from {tree.premises.length} parts
          </Text>
        </View>
        <Button label="Revisit the parts" variant="secondary" onPress={() => setStage('parts')} />
      </Card>
      <Text tone="muted">
        Now follow what it means. Rate each step assuming the one above it holds; your chain multiplies them. Under
        each step are the bets that pay if the chain to there holds, the same for anyone who gets there.
      </Text>
      <Text variant="caption" tone="faint">
        A bet’s market number is what its price implies about the stock. The bet pays on the stock price, not on your
        chain: your chain can come true and the stock can still miss.
      </Text>
      <BranchSection {...treeProps} branch={lean} startOpen />
      <BranchSection {...treeProps} branch={other} startOpen={false} />
      <Button
        label="Start over"
        variant="ghost"
        onPress={() => {
          work.reset();
          setStage('gut');
        }}
      />
    </Screen>
  );
}

function StageBar({
  stage,
  reached,
  onSelect,
}: {
  stage: Stage;
  reached: Record<Stage, boolean>;
  onSelect: (stage: Stage) => void;
}) {
  return (
    <View style={styles.stages} accessibilityRole="tablist">
      {STAGES.map(({ id, label }) => {
        const selected = id === stage;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: !reached[id] }}
            disabled={!reached[id]}
            onPress={() => onSelect(id)}
            style={styles.stage}>
            <View style={[styles.stageBar, reached[id] && styles.stageReached]} />
            <Text variant="caption" tone={selected ? 'default' : 'faint'}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stages: { flexDirection: 'row', gap: spacing.sm },
  stage: { flex: 1, gap: spacing.xs },
  stageBar: { height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
  stageReached: { backgroundColor: colors.accent },
  belief: { borderColor: colors.violet },
  beliefNumber: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
});
