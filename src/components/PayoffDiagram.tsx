import { StyleSheet, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui';
import { isBullish } from '@/domain/options';
import { payoffPoints, type PricedStrategy } from '@/domain/strategy';
import { formatMoney, formatPrice } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const WIDTH = 320;
const HEIGHT = 170;
const PAD = 10;

/** The price range worth drawing: from well before the bought strike to past the max payout. */
function priceRange(priced: PricedStrategy): [number, number] {
  const top = priced.outcomes.at(-1)!;
  const strikes = priced.legs.map((l) => l.strike);
  if (isBullish(priced.kind)) {
    const far = Math.max(top.lower ?? 0, priced.breakeven, priced.spot, ...strikes);
    return [Math.min(priced.spot, ...strikes) * 0.75, far * 1.2];
  }
  const far = Math.min(top.upper ?? priced.spot, priced.breakeven, priced.spot, ...strikes);
  return [Math.max(0, far * 0.8), Math.max(priced.spot, ...strikes) * 1.25];
}

/** Profit or loss at expiry versus the underlying's price, with today's price marked. */
export function PayoffDiagram({ priced, contracts }: { priced: PricedStrategy; contracts: number }) {
  const [lo, hi] = priceRange(priced);
  const points = payoffPoints(priced, lo, hi).map((p) => ({ ...p, pnl: p.pnl * contracts }));
  const minPnl = Math.min(0, ...points.map((p) => p.pnl));
  const maxPnl = Math.max(0, ...points.map((p) => p.pnl));

  const x = (price: number) => PAD + ((price - lo) / (hi - lo)) * (WIDTH - 2 * PAD);
  const y = (pnl: number) => PAD + ((maxPnl - pnl) / (maxPnl - minPnl || 1)) * (HEIGHT - 2 * PAD);

  const segments = points.slice(1).map((p, i) => {
    const prev = points[i];
    return {
      key: `${prev.price}-${p.price}`,
      coords: `${x(prev.price)},${y(prev.pnl)} ${x(p.price)},${y(p.pnl)}`,
      color: prev.pnl + p.pnl >= 0 ? colors.upside : colors.downside,
    };
  });

  const top = priced.outcomes.at(-1)!;
  const bestPnl = Math.max(...points.map((p) => p.pnl));

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityLabel={`Payoff at expiry: lose up to ${formatMoney(-minPnl)}, gain up to ${formatMoney(bestPnl)}${priced.maxValuePerContract === null ? ' or more' : ''}.`}>
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Line x1={PAD} y1={y(0)} x2={WIDTH - PAD} y2={y(0)} stroke={colors.border} strokeWidth={1} />
          <Line
            x1={x(priced.spot)}
            y1={PAD}
            x2={x(priced.spot)}
            y2={HEIGHT - PAD}
            stroke={colors.textFaint}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {segments.map((s) => (
            <Polyline key={s.key} points={s.coords} stroke={s.color} strokeWidth={3.5} fill="none" />
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        <Text variant="caption" tone="faint">
          ┆ Today {formatPrice(priced.spot)}
        </Text>
        <Text variant="caption" tone="faint">
          Breakeven {formatPrice(Math.round(priced.breakeven * 100) / 100)}
        </Text>
      </View>
      <View style={styles.legend}>
        <Text variant="caption" tone="downside">
          Worst: −{formatMoney(-minPnl)}
        </Text>
        <Text variant="caption" tone="upside">
          {priced.maxValuePerContract === null
            ? `+${formatMoney(bestPnl)} at ${formatPrice(Math.round(hi))}, and rising`
            : `Best: +${formatMoney(bestPnl)} ${isBullish(priced.kind) ? 'above' : 'below'} ${formatPrice(
                (isBullish(priced.kind) ? top.lower : top.upper) ?? 0,
              )}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
});
