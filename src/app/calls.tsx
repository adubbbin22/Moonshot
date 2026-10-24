import { router, useLocalSearchParams } from 'expo-router';

import { CallDeck } from '@/components/calls/CallDeck';
import { Screen } from '@/components/ui';

/** More calls for returning users, optionally starting from a specific question. */
export default function CallsScreen() {
  const { questionId } = useLocalSearchParams<{ questionId?: string }>();
  return (
    <Screen edges={[]}>
      <CallDeck
        target={5}
        startWith={questionId}
        finishLabel="Done"
        onFinish={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
    </Screen>
  );
}
