import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { DrafterError, thesisDrafter } from '@/services/intelligence/thesisDrafter';
import { useAppDispatch } from '@/state/store';
import { colors, radius, spacing, type as typeScale } from '@/theme/tokens';

const EXAMPLES = [
  'Robotaxis run in ten US cities by 2028.',
  'Europe builds its own AI chips by 2030.',
  'Weight-loss drugs cut US food spending by 2028.',
];

/**
 * Start from your own belief. A model drafts the tree on our backend, inside
 * the firewall; the user then reasons through it like a curated one.
 */
export default function DraftThesisScreen() {
  const dispatch = useAppDispatch();
  const [belief, setBelief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; problems: string[] } | null>(null);
  const ready = belief.trim().length >= 10;

  const draft = async () => {
    setBusy(true);
    setError(null);
    try {
      const tree = await thesisDrafter.draft(belief);
      dispatch({ type: 'addDraftedThesis', tree });
      router.replace({ pathname: '/thesis/[id]', params: { id: tree.id } });
    } catch (e) {
      setError({
        message: e instanceof Error ? e.message : String(e),
        problems: e instanceof DrafterError ? e.problems : [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          label={busy ? 'Drafting…' : 'Break it down'}
          loading={busy}
          disabled={!ready || busy}
          onPress={draft}
        />
      }>
      <Text variant="title">What do you believe?</Text>
      <Text tone="muted">
        One claim about the world that will be true or false by some date. A model drafts the parts it depends on,
        how cases like it went before, how it could fail, and what follows. You do the rating; code does the math.
      </Text>
      <Card>
        <TextInput
          value={belief}
          onChangeText={setBelief}
          placeholder="By the end of 2028, …"
          placeholderTextColor={colors.textFaint}
          multiline
          editable={!busy}
          style={styles.input}
          accessibilityLabel="Your belief"
        />
        <Text variant="caption" tone="faint">
          Try: {EXAMPLES.join(' · ')}
        </Text>
      </Card>
      {thesisDrafter.id === 'fixture' ? (
        <Text variant="caption" tone="faint">
          Demo mode: this shows a sample draft, whatever you type.
        </Text>
      ) : null}
      {busy ? (
        <Card>
          <Text tone="muted">
            Drafting takes a minute: the model writes the tree, then a second pass checks the past cases, then the
            rules are enforced.
          </Text>
        </Card>
      ) : null}
      {error ? (
        <Card style={styles.error}>
          <Text variant="label">Couldn’t draft that</Text>
          <Text tone="muted">{error.message}</Text>
          {error.problems.map((p) => (
            <Text key={p} variant="caption" tone="faint">
              • {p}
            </Text>
          ))}
        </Card>
      ) : null}
      <View style={styles.rules}>
        <Text variant="caption" tone="faint">
          The model never names a security, a price or a trade. Bets attach only through the curated mechanism
          library, and they’re the same for anyone whose reasoning reaches the same step.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    ...typeScale.body,
    color: colors.text,
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    textAlignVertical: 'top',
  },
  error: { borderColor: colors.no },
  rules: { paddingTop: spacing.sm },
});
