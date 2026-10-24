import { Text } from '@/components/ui';

export const DISCLAIMER =
  'Moonshot is a prototype. All trades are simulated (paper trading), and prices may be synthetic or delayed. ' +
  'Nothing here is investment advice. Options are risky and often expire worthless: you can lose everything you pay.';

export function Disclaimer() {
  return (
    <Text variant="caption" tone="faint">
      {DISCLAIMER}
    </Text>
  );
}
