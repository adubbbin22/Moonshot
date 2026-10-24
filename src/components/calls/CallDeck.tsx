import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CallCard } from './CallCard';
import { RevealCard } from './RevealCard';
import { Button, Card, Text } from '@/components/ui';
import { nextQuestion } from '@/domain/questionSelector';
import type { Side } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { useAppDispatch, useAppState } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

/** Calls after which the user may stop early and see their profile. */
const EARLY_EXIT_AFTER = 3;

export interface CallDeckProps {
  /** Calls to make in this session before finishing. */
  target: number;
  /** Start with this question if it hasn't been called yet. */
  startWith?: string;
  finishLabel: string;
  onFinish: () => void;
}

/**
 * Rapid-fire calls: one question at a time, chosen by the question selector,
 * each followed by a reveal.
 */
export function CallDeck({ target, startWith, finishLabel, onFinish }: CallDeckProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const questions = catalog.listEvents();

  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    const called = state.calls.some((c) => c.questionId === startWith);
    return startWith && !called ? startWith : nextQuestion(questions, state)?.id;
  });
  const [phase, setPhase] = useState<'call' | 'reveal'>('call');
  const [made, setMade] = useState(0);

  const question = currentId ? catalog.getEvent(currentId) : undefined;
  const call = state.calls.find((c) => c.questionId === currentId);
  const done = made >= target;

  const lock = (side: Side, probability: number) => {
    if (!currentId) return;
    dispatch({ type: 'makeCall', call: { questionId: currentId, side, probability, madeAt: new Date().toISOString() } });
    setMade((m) => m + 1);
    setPhase('reveal');
  };

  const skip = () => {
    if (!currentId) return;
    dispatch({ type: 'skipQuestion', questionId: currentId });
    // The store updates after this render, so include the skip by hand.
    setCurrentId(nextQuestion(questions, { ...state, skips: [...state.skips, currentId] })?.id);
  };

  const next = () => {
    if (done) return onFinish();
    setCurrentId(nextQuestion(questions, state)?.id);
    setPhase('call');
  };

  if (!question) {
    return (
      <Card>
        <Text variant="heading">You’ve called everything we have</Text>
        <Text tone="muted">New questions arrive every week. Your record starts now.</Text>
        <Button label={finishLabel} onPress={onFinish} />
      </Card>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.progress} accessibilityLabel={`${made} of ${target} calls made`}>
        {Array.from({ length: target }, (_, i) => (
          <View key={i} style={[styles.dot, i < made && styles.dotDone]} />
        ))}
      </View>

      {phase === 'reveal' && call ? (
        <RevealCard question={question} call={call} nextLabel={done ? finishLabel : 'Next question'} onNext={next} />
      ) : (
        <CallCard key={question.id} question={question} onLock={lock} onSkip={skip} />
      )}

      {!done && made >= EARLY_EXIT_AFTER ? (
        <Button label={`${finishLabel} now`} variant="ghost" onPress={onFinish} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  progress: { flexDirection: 'row', gap: spacing.sm },
  dot: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
  dotDone: { backgroundColor: colors.accent },
});
