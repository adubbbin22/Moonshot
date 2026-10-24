import { templateNarrator } from '../intelligence/narrator';
import { buildTakeProfile } from '@/domain/takeProfile';
import { makeQuestion } from '@/test/fixtures';

const questions = [makeQuestion('t1', 'tech'), makeQuestion('e1', 'energy'), makeQuestion('t2', 'tech')];
const call = (questionId: string, side: 'yes' | 'no', probability: number) => ({
  questionId,
  side,
  probability,
  madeAt: '2026-10-24T10:00:00Z',
});

describe('templateNarrator', () => {
  it('describes topics by calls made, not by interest score', async () => {
    const tied = buildTakeProfile(
      [call('t1', 'yes', 0.75), call('e1', 'no', 0.75)],
      ['t2'],
      ['energy'],
      questions,
    );
    await expect(templateNarrator.describe(tied)).resolves.toMatch(
      /^Your takes are spread across energy and tech\./,
    );
  });

  it('asks for calls when there are none', async () => {
    const profile = buildTakeProfile([], [], [], questions);
    await expect(templateNarrator.describe(profile)).resolves.toMatch(/Make a few calls/);
  });

  it('describes topics, strongest takes and style without any numbers', async () => {
    const profile = buildTakeProfile(
      [call('t1', 'yes', 0.9), call('e1', 'no', 0.75), call('t2', 'yes', 0.9)],
      [],
      [],
      questions,
    );
    const text = await templateNarrator.describe(profile);
    expect(text).toBe(
      'Most of your takes are about tech. Your strongest take is “t1 yes”. You also lean “t2 yes”. ' +
        'You make bold calls. That works if you turn out right as often as you say you will.',
    );
    // The narrator adds no numbers of its own (quoted stances come from content).
    expect(text.replace(/“[^”]*”/g, '')).not.toMatch(/\d/);
  });
});
