import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { spacing } from '@/theme/tokens';

/** Entry point for the guided "reason your way to a thesis" flow. */
export default function ThesesScreen() {
  const { theses } = useAppState();
  const themes = catalog.listThemes();

  return (
    <Screen title="Build a thesis" subtitle="Start with what you believe. The bets follow.">
      {themes.map((theme) => (
        <Card
          key={theme.id}
          onPress={() => router.push({ pathname: '/thesis/[themeId]', params: { themeId: theme.id } })}
          style={styles.theme}>
          <Text style={styles.emoji}>{theme.emoji}</Text>
          <View style={styles.themeText}>
            <Text variant="heading">{theme.hook}</Text>
            <Text variant="caption" tone="faint">
              {theme.title} · {theme.steps.length} questions
            </Text>
          </View>
        </Card>
      ))}

      {theses.length > 0 ? (
        <View style={styles.saved}>
          <Text variant="label" tone="muted">
            Your theses
          </Text>
          {theses.map((thesis) => (
            <Card key={thesis.id}>
              <Text variant="caption" tone="faint">
                {catalog.getTheme(thesis.themeId)?.title}
              </Text>
              <Text>“{thesis.statement}”</Text>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  theme: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32, lineHeight: 40 },
  themeText: { flex: 1, gap: spacing.xs },
  saved: { gap: spacing.md },
});
