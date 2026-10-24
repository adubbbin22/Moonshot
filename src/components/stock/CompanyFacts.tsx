import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { change, money, pct, ratio } from './figures';
import { Card, Chip, Stat, StatRow, Text } from '@/components/ui';
import { financialNotes } from '@/domain/fundamentals';
import type { CompanyFinancials, CompanySnapshot, FundFacts } from '@/domain/types';
import { useCompany } from '@/hooks/useCompany';
import { formatCount, formatDate, formatPercent, formatPercentExact } from '@/lib/format';
import { fundamentals } from '@/services/fundamentals';
import { colors, spacing } from '@/theme/tokens';

/**
 * Company information and financials on the stock screen: what the business
 * does, how it's doing (or what a fund holds), with where the figures came
 * from and when.
 */
export function CompanyFacts({ symbol }: { symbol: string }) {
  const state = useCompany(symbol);
  if (fundamentals.id === 'off') return null;

  if (state.status === 'loading') {
    return (
      <Card style={styles.center}>
        <ActivityIndicator color={colors.textMuted} />
        <Text variant="caption" tone="faint">
          Getting company information from {fundamentals.label}…
        </Text>
      </Card>
    );
  }
  if (state.status === 'error') {
    return (
      <Card>
        <Text variant="heading">Couldn’t load company information</Text>
        <Text tone="muted">{state.message}</Text>
      </Card>
    );
  }
  const { company } = state;
  if (!company) return null;

  return (
    <>
      <AboutCard company={company} />
      {company.financials ? <FinancialsCard company={company} financials={company.financials} /> : null}
      {company.fund ? <FundCard company={company} fund={company.fund} /> : null}
    </>
  );
}

function AboutCard({ company }: { company: CompanySnapshot }) {
  const { about } = company;
  const rows: [string, string | undefined][] = [
    ['Sector', about.sector],
    ['Industry', about.industry],
    ['Headquarters', about.headquarters],
    ['Employees', about.employees === undefined ? undefined : formatCount(about.employees)],
  ];
  const host = about.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return (
    <Card>
      <Text variant="label" tone="muted">
        About {company.name}
      </Text>
      {about.description ? <Text tone="muted">{about.description}</Text> : null}
      {rows.map(([label, value]) =>
        value ? (
          <View key={label} style={styles.row}>
            <Text variant="caption" tone="faint">
              {label}
            </Text>
            <Text variant="caption" style={styles.value}>
              {value}
            </Text>
          </View>
        ) : null,
      )}
      {about.website && host ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(about.website!)} style={styles.row}>
          <Text variant="caption" tone="faint">
            Website
          </Text>
          <Text variant="caption" tone="accent" style={styles.value}>
            {host} ↗
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function FinancialsCard({ company, financials: f }: { company: CompanySnapshot; financials: CompanyFinancials }) {
  const growthTone = f.revenueGrowth === undefined ? 'default' : f.revenueGrowth >= 0 ? 'upside' : 'downside';
  return (
    <Card>
      <TitleRow title="Financials" company={company} />
      <StatRow>
        <Stat label="Market cap" value={money(f.marketCap)} />
        <Stat label="Sales, 12 months" value={money(f.revenue)} />
        <Stat label="Sales growth" value={change(f.revenueGrowth)} tone={growthTone} />
      </StatRow>
      <StatRow>
        <Stat label="Gross margin" value={pct(f.grossMargin)} />
        <Stat label="Operating margin" value={pct(f.operatingMargin)} />
        <Stat label="Net income" value={money(f.netIncome)} tone={f.netIncome !== undefined && f.netIncome < 0 ? 'downside' : 'default'} />
      </StatRow>
      <StatRow>
        <Stat label="Free cash flow" value={money(f.freeCashFlow)} tone={f.freeCashFlow !== undefined && f.freeCashFlow < 0 ? 'downside' : 'default'} />
        <Stat label="Cash" value={money(f.cash)} />
        <Stat label="Debt" value={money(f.debt)} />
      </StatRow>
      <StatRow>
        <Stat label="Forward P/E" value={ratio(f.forwardPe)} />
        <Stat label="Trailing P/E" value={ratio(f.trailingPe)} />
        <Stat label="Price to sales" value={ratio(f.priceToSales)} />
      </StatRow>
      {f.nextEarnings ? (
        <Text tone="muted">
          Next earnings report: {formatDate(f.nextEarnings)}
          {f.nextEarningsEstimated ? ' (estimated)' : ''}.
        </Text>
      ) : null}
      {financialNotes(f).map((note) => (
        <Text key={note} variant="caption" tone="muted">
          • {note}
        </Text>
      ))}
      <SourceLine company={company} />
    </Card>
  );
}

function FundCard({ company, fund }: { company: CompanySnapshot; fund: FundFacts }) {
  return (
    <Card>
      <TitleRow title="Fund facts" company={company} />
      <Text tone="muted">{[fund.family, fund.category].filter(Boolean).join(' · ')}</Text>
      <StatRow>
        <Stat label="Expense ratio" value={fund.expenseRatio === undefined ? '—' : formatPercentExact(fund.expenseRatio)} />
        <Stat label="Net assets" value={money(fund.netAssets)} />
        <Stat label="Top holding" value={fund.topHoldings[0]?.symbol ?? '—'} />
      </StatRow>
      {fund.holds ? <Text tone="muted">Holds: {fund.holds}</Text> : null}
      {fund.topHoldings.length > 0 ? (
        <View style={styles.holdings}>
          <Text variant="caption" tone="faint">
            Largest holdings
          </Text>
          {fund.topHoldings.map((h) => (
            <View key={h.symbol} style={styles.row}>
              <Text variant="caption">
                {h.symbol} · {h.name}
              </Text>
              <Text variant="caption" tone="muted">
                {formatPercent(h.weight)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <SourceLine company={company} />
    </Card>
  );
}

function TitleRow({ title, company }: { title: string; company: CompanySnapshot }) {
  return (
    <View style={styles.titleRow}>
      <Text variant="label" tone="muted">
        {title}
      </Text>
      {company.basis === 'sample' ? <Chip label="Sample figures, not live" color={colors.violet} /> : null}
    </View>
  );
}

function SourceLine({ company }: { company: CompanySnapshot }) {
  return (
    <Text variant="caption" tone="faint">
      {company.source} · as of {formatDate(company.asOf)}
      {company.basis === 'sample' ? ' · rounded figures for the demo, not a data feed' : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  value: { flex: 1, textAlign: 'right' },
  holdings: { gap: spacing.xs },
});
