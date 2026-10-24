import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { treesCheckedBy } from '@/domain/thesisTree';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

/** Links a question to the thesis trees it checks, so a quick call can turn into reasoning. */
export function ReasonItThrough({ questionId }: { questionId: string }) {
  const trees = treesCheckedBy(catalog.listTheses(), questionId);
  return trees.map((tree) => (
    <Pressable
      key={tree.id}
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/thesis/[id]', params: { id: tree.id } })}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <Text variant="caption" tone="muted">
        Part of a bigger belief
      </Text>
      <Text variant="label" tone="accent">
        {tree.emoji} Break down “{tree.hook}” ›
      </Text>
    </Pressable>
  ));
}

const styles = StyleSheet.create({
  link: {
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
});
