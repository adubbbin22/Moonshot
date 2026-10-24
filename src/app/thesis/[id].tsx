import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LikelihoodPicker } from '@/components/LikelihoodPicker';
import { BuiltBeliefCard } from '@/components/thesis/BuiltBeliefCard';
import { ClaimCard } from '@/components/thesis/ClaimCard';
import { OutsideViewCard } from '@/components/thesis/OutsideViewCard';
import { Premortem } from '@/components/thesis/Premortem';
import { BranchSection } from '@/components/thesis/StepTree';
import { Button, Card, Screen, Text } from '@/components/ui';
import { leaningBranch } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { useThesis } from '@/hooks/useThesis';
import { useThesisWork } from '@/hooks/useThesisWork';
import { formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

type Stage = 'gut' | 'parts' | 'premortem' | 'follows';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'gut', label: 'Gut check' },
  { id: 'parts', label: 'Break it down' },
  { id: 'premortem', label: 'Pre-mortem' },
  { id: 'follows', label: 'What follows' },
];

/**
 * A thesis tree, as structured thinking:
 * 1. Gut check, then the outside view: how past cases like this went.
 * 2. Break it down: the parts the belief depends on, rated and multiplied.
 * 3. Pre-mortem: assume it turned out wrong; the stories that could happen
 *    become kill criteria.
 * 4. What follows: "which means…" steps, each with its "then what?", down
 *    to the bets that pay if the chain holds.
 */
export default function ThesisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tree = useThesis(id);
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
    premortem: work.belief !== undefined,
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
        {tree.provenance ? <DraftedNote provenance={tree.provenance} /> : null}
        <Text variant="caption" tone="faint">
          {tree.emoji} {tree.hook}
        </Text>
        <Text variant="title">{tree.belief}</Text>
        <Text tone="muted">
          Start with your gut. Then see how past cases like this went, and break it into the parts it depends on.
        </Text>
        <Card>
          <LikelihoodPicker prompt="How likely is it?" value={work.gut} onChange={work.setGut} />
        </Card>
        {work.gut !== undefined ? (
          <OutsideViewCard view={tree.outsideView} rate={work.outside} gut={work.gut} drafted={Boolean(tree.provenance)} />
        ) : null}
      </Screen>
    );
  }

  if (stage === 'parts' || work.belief === undefined) {
    const total = tree.premises.length;
    return (
      <Screen
        key="parts"
        edges={['bottom']}
        footer={<Button label="Run a pre-mortem" disabled={!reached.premortem} onPress={() => setStage('premortem')} />}>
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
        <BuiltBeliefCard
          tree={tree}
          ratings={work.ratings}
          gut={work.gut}
          outside={work.outside}
          blend={work.blend}
          onBlend={work.setBlend}
        />
      </Screen>
    );
  }

  if (stage === 'premortem') {
    return (
      <Screen
        key="premortem"
        edges={['bottom']}
        footer={<Button label="See what follows" onPress={() => setStage('follows')} />}>
        {stageBar}
        <Text variant="caption" tone="faint">
          {tree.emoji} {tree.belief}
        </Text>
        <Text variant="title">Pre-mortem</Text>
        <Text tone="muted">
          It’s {tree.settledBy}, and you were wrong. Which of these is how it happened? Mark any that could, and
          re-rate the part each one breaks.
        </Text>
        <Premortem
          tree={tree}
          ratings={work.ratings}
          marked={work.marked}
          killCriteria={work.killCriteria}
          belief={work.belief}
          onToggle={work.toggleFailure}
          onRate={work.rate}
        />
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
    lasts: work.lasts,
    onRate: work.rate,
    onRateLasts: work.rateLasts,
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
            {work.blend
              ? `your ${tree.premises.length} parts blended with past cases`
              : `built from ${tree.premises.length} parts`}
          </Text>
        </View>
        {work.killCriteria.length > 0 ? (
          <Text variant="caption" tone="muted">
            {work.killCriteria.length} kill {work.killCriteria.length === 1 ? 'criterion' : 'criteria'} from your
            pre-mortem
          </Text>
        ) : null}
        <Button label="Revisit the parts" variant="secondary" onPress={() => setStage('parts')} />
      </Card>
      <Text tone="muted">
        Now follow what it means. Rate each step assuming the one above it holds; your chain multiplies them. Where
        a step has bets, ask “then what?”: every effect provokes a response, and the effect has to outlast it until
        the bets expire.
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

/** Where a drafted tree came from, and what that means for trusting it. */
function DraftedNote({ provenance }: { provenance: NonNullable<ThesisTree['provenance']> }) {
  const { review } = provenance;
  return (
    <Card style={styles.drafted}>
      <Text variant="label" tone="muted">
        Drafted by AI from your belief
      </Text>
      <Text variant="caption" tone="faint">
        “{provenance.prompt}”
      </Text>
      <Text variant="caption" tone="muted">
        The reasoning and the past cases were written by a model, not reviewed by a person. Check the sources before
        trusting the numbers.
        {review
          ? ` A second pass dropped ${review.droppedCases} ${review.droppedCases === 1 ? 'case' : 'cases'} it disputed.`
          : ''}
      </Text>
      {review?.notes.map((note) => (
        <Text key={note} variant="caption" tone="muted">
          • {note}
        </Text>
      ))}
    </Card>
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
  drafted: { borderColor: colors.no },
  beliefNumber: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
});
