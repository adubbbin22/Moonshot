import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { betDirection, catalystsAgainst, catalystsRidden } from '@/domain/catalysts';
import type { Bet } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { colors, spacing } from '@/theme/tokens';

/**
 * On the bet screen: the framework behind the security. Which catalysts the
 * bet rides, which it bets against, and the ways to lose even if the world
 * goes your way.
 */
export function WhatMovesIt({ bet }: { bet: Bet }) {
  const symbol = bet.strategy.underlying;
  const profile = catalog.getUnderlying(symbol);
  if (!profile) return null;
  const direction = betDirection(bet);
  const ridden = catalystsRidden(bet, profile);
  const against = catalystsAgainst(bet, profile);

  return (
    <Card>
      <Text variant="label" tone="muted">
        What moves {symbol}
      </Text>
      <Text tone="muted">{profile.whatItIs}</Text>
      <Text variant="caption" tone="faint">
        Moves on: {profile.movesOn}
      </Text>

      <View style={styles.block}>
        <Text variant="caption" tone="faint">
          This bet rides
        </Text>
        {ridden.map((c) => (
          <View key={c.id} style={styles.catalyst}>
            <Text variant="label" style={{ color: direction === 'up' ? colors.upside : colors.downside }}>
              {direction === 'up' ? '▲' : '▼'} {c.label}
            </Text>
            <Text tone="muted">{c.why}</Text>
          </View>
        ))}
      </View>

      {against.length > 0 ? (
        <View style={styles.block}>
          <Text variant="caption" tone="faint">
            And bets against
          </Text>
          <Text tone="muted">{against.map((c) => c.label).join(' · ')}</Text>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text variant="caption" tone="faint">
          Ways to lose even if you’re right about the world
        </Text>
        {profile.risks.map((risk) => (
          <Text key={risk} tone="muted">
            • {risk}
          </Text>
        ))}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol } })}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}>
        <Text variant="label" tone="accent">
          See the full catalyst map for {symbol} ›
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.xs },
  catalyst: { gap: 2 },
  link: { paddingVertical: spacing.xs },
  linkPressed: { opacity: 0.7 },
});
