import { router } from 'expo-router';

import { CallDeck } from '@/components/calls/CallDeck';
import { Screen } from '@/components/ui';

/** Calls a new user makes before seeing their take profile. */
const FIRST_SESSION_CALLS = 6;

export default function WelcomeCallsScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <CallDeck
        target={FIRST_SESSION_CALLS}
        finishLabel="See your take profile"
        onFinish={() => router.push('/welcome/profile')}
      />
    </Screen>
  );
}
