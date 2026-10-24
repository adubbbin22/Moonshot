import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Screen } from '@/components/ui';
import { CATEGORY_ORDER } from '@/domain/questionSelector';
import type { Category } from '@/domain/types';
import { useAppDispatch, useAppState } from '@/state/store';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/theme/categories';
import { spacing } from '@/theme/tokens';

/** Optional seed: which topics to ask about first. Behaviour takes over from here. */
export default function TopicsScreen() {
  const dispatch = useAppDispatch();
  const { seedTopics } = useAppState();
  const [selected, setSelected] = useState<Category[]>(seedTopics);

  const toggle = (category: Category) =>
    setSelected((s) => (s.includes(category) ? s.filter((c) => c !== category) : [...s, category]));

  const next = () => {
    dispatch({ type: 'setSeedTopics', topics: selected });
    router.push('/welcome/calls');
  };

  return (
    <Screen
      title="What do you have takes on?"
      subtitle="Pick any. We’ll start there, then follow what you actually answer."
      edges={['top', 'bottom']}
      footer={<Button label={selected.length > 0 ? 'Continue' : 'Skip'} onPress={next} />}>
      <View style={styles.chips}>
        {CATEGORY_ORDER.map((category) => (
          <Chip
            key={category}
            label={`${CATEGORY_EMOJI[category]} ${CATEGORY_LABELS[category]}`}
            selected={selected.includes(category)}
            onPress={() => toggle(category)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
