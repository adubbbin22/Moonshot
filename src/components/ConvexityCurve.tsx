import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

const WIDTH = 300;
const HEIGHT = 160;
const BASELINE = 120;
const KINK = 130;

/**
 * The shape Moonshot is built around: a small, fixed loss when you're wrong
 * and an upside that keeps growing the more right you are.
 */
export function ConvexityCurve() {
  const lossY = BASELINE + 18;
  const payoff = `M ${KINK} ${lossY} C ${KINK + 70} ${lossY}, ${WIDTH - 50} 60, ${WIDTH} 6`;

  return (
    <View style={styles.wrap} accessible accessibilityLabel="Payoff curve: small fixed loss, open-ended upside">
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Line x1={0} y1={BASELINE} x2={WIDTH} y2={BASELINE} stroke={colors.border} strokeWidth={1} />
        <Path d={`M 0 ${lossY} L ${KINK} ${lossY}`} stroke={colors.downside} strokeWidth={4} fill="none" />
        <Path d={payoff} stroke={colors.upside} strokeWidth={4} fill="none" />
      </Svg>
      <View style={styles.legend}>
        <Text variant="caption" tone="downside">
          Wrong: lose what you paid
        </Text>
        <Text variant="caption" tone="upside">
          Right: several times that
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
