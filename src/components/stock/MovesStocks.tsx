import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { catalystsCheckedBy } from '@/domain/catalysts';
import { catalog } from '@/services/catalog';
import { colors, spacing } from '@/theme/tokens';

/** On a question: the securities whose catalyst maps this question tests. */
export function MovesStocks({ questionId }: { questionId: string }) {
  const matches = catalystsCheckedBy(catalog.listUnderlyings(), questionId);
  if (matches.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text variant="caption" tone="faint">
        Stocks this question moves
      </Text>
      <View style={styles.chips}>
        {matches.map(({ profile, catalyst }) => {
          const check = catalyst.checks?.find((c) => c.questionId === questionId);
          const up = (check?.side === 'yes') === (catalyst.direction === 'up');
          return (
            <Chip
              key={`${profile.symbol}:${catalyst.id}`}
              label={`${profile.symbol} ${up ? '▲' : '▼'} if Yes · ${catalyst.label}`}
              color={up ? colors.upside : colors.downside}
              onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: profile.symbol } })}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
