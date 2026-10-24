import type { EventQuestion } from '@/domain/types';

/**
 * SAMPLE DATA. In production the feed is generated from the news pipeline
 * (see docs/ARCHITECTURE.md); these are hand-written stand-ins.
 */
export const EVENTS: EventQuestion[] = [
  {
    id: 'hormuz-normal-2027',
    question: 'Will shipping through the Strait of Hormuz be back to normal by June 2027?',
    context:
      'Conflict in the Gulf has pushed tankers onto longer routes and sent insurance costs up. ' +
      'Roughly a fifth of the world’s oil passes through the strait.',
    category: 'geopolitics',
    resolvesBy: 'Jun 2027',
    crowdYes: 0.42,
    outcomes: [
      {
        side: 'yes',
        label: 'Things calm down',
        rationale: 'Calmer seas mean cheaper oil, and cheaper oil means cheaper jet fuel.',
        betIds: ['airlines-calls'],
      },
      {
        side: 'no',
        label: 'Disruption drags on',
        rationale: 'Longer routes and scarce supply favor tanker owners, oil, and defense.',
        betIds: ['tanker-calls', 'oil-calls', 'defense-calls'],
      },
    ],
  },
  {
    id: 'ai-week-long-task-2027',
    question: 'Will an AI system finish a week-long software project on its own by end of 2027?',
    context:
      'AI coding agents are handling longer tasks every few months. The open question is ' +
      'whether that curve keeps bending up or stalls.',
    category: 'tech',
    resolvesBy: 'Dec 2027',
    crowdYes: 0.58,
    outcomes: [
      {
        side: 'yes',
        label: 'AI keeps accelerating',
        rationale: 'More capable AI means more compute and more power. Own the bottlenecks.',
        betIds: ['ai-compute-calls', 'ai-power-calls', 'semis-basket'],
      },
      {
        side: 'no',
        label: 'Progress stalls',
        rationale: 'If capabilities plateau, the market has priced in a future that won’t come on time.',
        betIds: ['ai-bubble-puts'],
      },
    ],
  },
  {
    id: 'smr-grid-2028',
    question: 'Will a small modular reactor send power to a US grid by end of 2028?',
    context:
      'Tech companies have signed deals for future nuclear power, but no small reactor has ' +
      'delivered electricity commercially in the US yet.',
    category: 'energy',
    resolvesBy: 'Dec 2028',
    crowdYes: 0.31,
    outcomes: [
      {
        side: 'yes',
        label: 'Nuclear comes back',
        rationale: 'A first working reactor would unlock orders, and demand for uranium.',
        betIds: ['smr-nuclear', 'uranium-calls'],
      },
      {
        side: 'no',
        label: 'Gas fills the gap',
        rationale: 'If reactors slip, data centers still need power. Gas is the fastest to build.',
        betIds: ['natgas-calls'],
      },
    ],
  },
  {
    id: 'fed-below-3-2027',
    question: 'Will the Fed cut interest rates below 3% by end of 2027?',
    context:
      'Markets swing every month on inflation data. Lower rates help borrowers and ' +
      'long-shot companies most.',
    category: 'macro',
    resolvesBy: 'Dec 2027',
    crowdYes: 0.47,
    outcomes: [
      {
        side: 'yes',
        label: 'Money gets cheap',
        rationale: 'Cheap money lifts small companies, biotech, and gold the most.',
        betIds: ['small-caps-calls', 'biotech-calls', 'gold-calls'],
      },
      {
        side: 'no',
        label: 'Inflation sticks',
        rationale: 'Rates stay high when inflation won’t die, and energy is often the reason.',
        betIds: ['oil-calls'],
      },
    ],
  },
  {
    id: 'satellite-phones-2027',
    question: 'Will most US smartphones be able to text via satellite by end of 2027?',
    context:
      'Carriers are testing direct-to-phone satellite service. Whoever owns the network ' +
      'could own a new market.',
    category: 'space',
    resolvesBy: 'Dec 2027',
    crowdYes: 0.64,
    outcomes: [
      {
        side: 'yes',
        label: 'Space goes mainstream',
        rationale: 'Mass adoption needs satellites and launches. Both are small, fast-growing markets.',
        betIds: ['satellite-phone', 'launch-calls'],
      },
      {
        side: 'no',
        label: 'Still niche',
        rationale:
          'No obvious asymmetric bet on this side. Sometimes the right move is no bet at all.',
        betIds: [],
      },
    ],
  },
];
