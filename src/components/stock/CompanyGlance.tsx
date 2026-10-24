import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { change, money, pct } from './figures';
import { Card, Chip, Stat, StatRow, Text } from '@/components/ui';
import type { CompanyState } from '@/hooks/useCompany';
import { formatDate, formatPercentExact } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

/**
 * On the bet screen: the company in three numbers, and the way to the full
 * information and financials. Quiet while loading; the stock screen has the
 * full view with its own loading state.
 */
export function CompanyGlance({ symbol, state }: { symbol: string; state: CompanyState }) {
  if (state.status !== 'ready' || !state.company) return null;
  const { company } = state;
  const f = company.financials;
  const fund = company.fund;

  return (
    <Card
      onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol } })}
      accessibilityLabel={`Company information and financials for ${symbol}`}>
      <View style={styles.titleRow}>
        <Text variant="label" tone="muted">
          {company.name} at a glance
        </Text>
        {company.basis === 'sample' ? <Chip label="Sample figures" color={colors.violet} /> : null}
      </View>
      {f ? (
        <StatRow>
          <Stat label="Market cap" value={money(f.marketCap)} />
          <Stat
            label="Sales growth"
            value={change(f.revenueGrowth)}
            tone={f.revenueGrowth === undefined ? 'default' : f.revenueGrowth >= 0 ? 'upside' : 'downside'}
          />
          <Stat label="Operating margin" value={pct(f.operatingMargin)} />
        </StatRow>
      ) : null}
      {fund ? (
        <StatRow>
          <Stat label="Expense ratio" value={fund.expenseRatio === undefined ? '—' : formatPercentExact(fund.expenseRatio)} />
          <Stat label="Net assets" value={money(fund.netAssets)} />
          <Stat label="Top holding" value={fund.topHoldings[0]?.symbol ?? '—'} />
        </StatRow>
      ) : null}
      <Text variant="label" tone="accent">
        {f?.nextEarnings ? `Next earnings ${formatDate(f.nextEarnings)} · ` : ''}Company information and financials ›
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
