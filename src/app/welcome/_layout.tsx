import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** First-run flow: intro → topics → calls → take profile → terms. No account needed until bets. */
export default function WelcomeLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
