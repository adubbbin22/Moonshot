import type { Theme } from '@/domain/types';

/**
 * Guided thesis builders. Each answer adds tags (used to match bets) and a
 * sentence to the user's thesis. Every tag must map to at least one bet;
 * src/data/__tests__/integrity.test.ts enforces that.
 */
export const THEMES: Theme[] = [
  {
    id: 'ai',
    title: 'Artificial intelligence',
    hook: 'Do you believe in AI?',
    emoji: '🤖',
    category: 'tech',
    steps: [
      {
        id: 'scale',
        prompt: 'How big is AI over the next five years?',
        options: [
          {
            id: 'huge',
            label: 'Bigger than the internet',
            tags: ['ai-bull', 'ai-fast'],
            fragment: 'AI will reshape the economy faster than most people expect.',
          },
          {
            id: 'real-slow',
            label: 'Real, but slower than the hype',
            tags: ['ai-bull', 'ai-slow'],
            fragment: 'AI is real, but it will take longer to pay off than the market thinks.',
          },
          {
            id: 'hype',
            label: 'Mostly hype',
            tags: ['ai-bear'],
            fragment: 'AI is overhyped, and prices assume a future that won’t arrive on time.',
          },
        ],
      },
      {
        id: 'winners',
        prompt: 'If AI wins, where does the money end up?',
        options: [
          {
            id: 'chips',
            label: 'Chips and data centers',
            tags: ['ai-compute'],
            fragment: 'The biggest winners are the companies selling the compute.',
          },
          {
            id: 'power',
            label: 'Whoever powers it',
            tags: ['ai-power', 'nuclear'],
            fragment: 'The real bottleneck is electricity, so power producers win.',
          },
          {
            id: 'robots',
            label: 'Robots and the physical world',
            tags: ['ai-robotics'],
            fragment: 'The next leg is AI moving into the physical world through robots.',
          },
          {
            id: 'nowhere',
            label: 'Nowhere. It’s a bubble',
            tags: ['ai-bear'],
            fragment: 'Most of today’s AI spending won’t earn a return.',
          },
        ],
      },
      {
        id: 'risk',
        prompt: 'What’s most likely to go wrong?',
        options: [
          {
            id: 'power-shortage',
            label: 'We run out of power',
            tags: ['ai-power', 'natgas'],
            fragment: 'The grid can’t keep up, which makes energy scarce and valuable.',
          },
          {
            id: 'expensive-money',
            label: 'Money gets expensive',
            tags: ['ai-bear', 'ai-slow'],
            fragment: 'If money gets expensive, the hype trade unwinds first.',
          },
          {
            id: 'nothing',
            label: 'Honestly, not much',
            tags: ['ai-bull', 'ai-compute', 'ai-fast'],
            fragment: 'The trend is strong enough to push through the bumps.',
          },
        ],
      },
    ],
  },
  {
    id: 'energy',
    title: 'Energy',
    hook: 'Who powers the next decade?',
    emoji: '⚡',
    category: 'energy',
    steps: [
      {
        id: 'demand',
        prompt: 'Does US electricity demand grow fast this decade?',
        options: [
          {
            id: 'surge',
            label: 'Yes, AI and EVs need it',
            tags: ['ai-power', 'grid'],
            fragment: 'Electricity demand is about to grow faster than it has in decades.',
          },
          {
            id: 'steady',
            label: 'Steadily, not explosively',
            tags: ['grid'],
            fragment: 'Power demand grows steadily, and the grid is the constraint.',
          },
        ],
      },
      {
        id: 'source',
        prompt: 'What fills the gap?',
        options: [
          {
            id: 'nuclear',
            label: 'Nuclear',
            tags: ['nuclear', 'uranium'],
            fragment: 'Nuclear makes a comeback because nothing else is clean and always-on.',
          },
          {
            id: 'gas',
            label: 'Natural gas',
            tags: ['natgas'],
            fragment: 'Natural gas fills the gap because it’s the fastest thing to build.',
          },
          {
            id: 'oil',
            label: 'Oil stays king',
            tags: ['oil-up'],
            fragment: 'The world stays more dependent on oil than people want to admit.',
          },
        ],
      },
      {
        id: 'wildcard',
        prompt: 'What’s the biggest wildcard?',
        options: [
          {
            id: 'gulf',
            label: 'Conflict in the Gulf',
            tags: ['oil-up', 'hormuz-disruption'],
            fragment: 'A supply shock from the Gulf is the risk nobody is priced for.',
          },
          {
            id: 'regulators',
            label: 'Regulators fast-track nuclear',
            tags: ['nuclear'],
            fragment: 'Faster reactor approvals could unlock a wave of new builds.',
          },
          {
            id: 'uranium',
            label: 'A uranium shortage',
            tags: ['uranium'],
            fragment: 'Uranium supply can’t keep up with reactors coming back online.',
          },
        ],
      },
    ],
  },
  {
    id: 'geopolitics',
    title: 'Geopolitics',
    hook: 'Is the world getting more dangerous?',
    emoji: '🌍',
    category: 'geopolitics',
    steps: [
      {
        id: 'direction',
        prompt: 'Over the next two years, the world gets…',
        options: [
          {
            id: 'worse',
            label: 'More dangerous',
            tags: ['defense', 'hormuz-disruption'],
            fragment: 'The world is getting more dangerous, and markets underprice it.',
          },
          {
            id: 'same',
            label: 'About the same',
            tags: ['defense'],
            fragment: 'Tensions stay high, which keeps defense budgets rising.',
          },
          {
            id: 'calmer',
            label: 'Calmer',
            tags: ['deescalation', 'oil-down'],
            fragment: 'Tensions ease more than people expect.',
          },
        ],
      },
      {
        id: 'flashpoint',
        prompt: 'Which flashpoint matters most for markets?',
        options: [
          {
            id: 'gulf',
            label: 'The Gulf and its shipping lanes',
            tags: ['hormuz-disruption', 'shipping', 'oil-up'],
            fragment: 'The Gulf’s shipping lanes are the pressure point for the global economy.',
          },
          {
            id: 'arms-race',
            label: 'A broad arms race',
            tags: ['defense'],
            fragment: 'A broad re-arming cycle lasts years once it starts.',
          },
          {
            id: 'peace',
            label: 'Peace deals that surprise everyone',
            tags: ['deescalation'],
            fragment: 'A surprise peace deal would catch markets offside.',
          },
        ],
      },
      {
        id: 'haven',
        prompt: 'Where does scared money go?',
        options: [
          {
            id: 'gold',
            label: 'Gold',
            tags: ['gold'],
            fragment: 'When people get scared, they buy gold.',
          },
          {
            id: 'energy',
            label: 'Energy',
            tags: ['oil-up'],
            fragment: 'Energy is the real safe haven when supply is at risk.',
          },
        ],
      },
    ],
  },
  {
    id: 'money',
    title: 'Money & rates',
    hook: 'What happens to money?',
    emoji: '💵',
    category: 'macro',
    steps: [
      {
        id: 'rates',
        prompt: 'Where do interest rates go by 2028?',
        options: [
          {
            id: 'down',
            label: 'Way down',
            tags: ['rate-cuts'],
            fragment: 'Interest rates fall a lot further than the market expects.',
          },
          {
            id: 'sticky',
            label: 'They stay high',
            tags: ['inflation'],
            fragment: 'Inflation is stickier than people think, so rates stay high.',
          },
        ],
      },
      {
        id: 'dollar',
        prompt: 'Does the dollar lose value?',
        options: [
          {
            id: 'weaker',
            label: 'Yes, slowly',
            tags: ['dollar-down', 'gold'],
            fragment: 'The dollar slowly loses purchasing power.',
          },
          {
            id: 'holds',
            label: 'No, it holds up',
            tags: ['small-caps'],
            fragment: 'The dollar holds up, so US companies stay the place to be.',
          },
        ],
      },
      {
        id: 'winners',
        prompt: 'Who benefits most from your view?',
        options: [
          {
            id: 'small',
            label: 'Small companies that borrow',
            tags: ['small-caps', 'rate-cuts'],
            fragment: 'Small companies that rely on borrowing benefit the most.',
          },
          {
            id: 'hard-assets',
            label: 'Hard assets',
            tags: ['gold', 'inflation'],
            fragment: 'Hard assets win when money loses value.',
          },
          {
            id: 'innovators',
            label: 'Biotech and long-shot innovators',
            tags: ['biotech', 'rate-cuts'],
            fragment: 'Long-shot innovators like biotech come back when money is cheap.',
          },
        ],
      },
    ],
  },
];
