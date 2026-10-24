import { router } from 'expo-router';

import { BetExpressions } from '@/components/BetExpressions';
import { ReasonItThrough } from '@/components/thesis/ReasonItThrough';
import { Button, Card, Screen, Text } from '@/components/ui';
import { viewsWithBets, type ViewWithBets } from '@/domain/expression';
import { useTakeProfile } from '@/hooks/useTakeProfile';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { colors } from '@/theme/tokens';

/**
 * Ways to express your takes: for each call, the bets that pay if you're
 * right. Views are ordered by your own conviction; bets within a view are in
 * a fixed order and the same for anyone with that view.
 */
export default function TakesScreen() {
  const profile = useTakeProfile();
  const groups = viewsWithBets(profile.views, catalog.getEvent, catalog.getBet);

  return (
    <Screen
      edges={['bottom']}
      title="Ways to express your takes"
      subtitle="For each call: the bets that pay if you’re right. Anyone with the same take sees the same list.">
      {groups.length === 0 ? (
        <Card>
          <Text variant="heading">No calls yet</Text>
          <Text tone="muted">Make a few calls and your takes will show up here.</Text>
          <Button label="Make calls" onPress={() => router.push('/calls')} />
        </Card>
      ) : (
        groups.map((group) => <ViewExpressions key={group.question.id} group={group} />)
      )}
      {groups.length > 0 ? (
        <Button label="Make more calls" variant="secondary" onPress={() => router.push('/calls')} />
      ) : null}
    </Screen>
  );
}

function ViewExpressions({ group }: { group: ViewWithBets }) {
  const { view, question, bets, rationale } = group;
  const sideColor = view.side === 'yes' ? colors.yes : colors.no;

  return (
    <Card>
      <Text variant="caption" tone="faint">
        {question.question}
      </Text>
      <Text variant="heading" style={{ color: sideColor }}>
        {formatPercent(view.probability)} {view.side === 'yes' ? 'Yes' : 'No'} · {view.stance}
      </Text>
      {bets.length === 0 ? <Text tone="muted">{rationale}</Text> : null}
      <BetExpressions
        items={bets.map((bet) => ({ bet }))}
        question={question}
        noFitText="No bet fits right now. Your call still counts toward your record."
        onOpen={(bet) =>
          router.push({ pathname: '/bet/[id]', params: { id: bet.id, eventId: question.id, side: view.side } })
        }
      />
      <ReasonItThrough questionId={question.id} />
    </Card>
  );
}
