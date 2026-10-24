import { Text } from '@/components/ui';

export const DISCLAIMER =
  'Moonshot is a prototype. All bets are simulated (paper trading) and use sample data. ' +
  'Nothing here is investment advice. Options and small companies can lose 100% of their value.';

export function Disclaimer() {
  return (
    <Text variant="caption" tone="faint">
      {DISCLAIMER}
    </Text>
  );
}
