import type { Mechanism } from '@/domain/types';

/**
 * THE MECHANISM LIBRARY. Each entry is a curated link from something
 * happening in the world to the bets that pay if it does. It's the only way
 * a thesis (curated or LLM-drafted) reaches a bet: a step names mechanisms
 * by id, and code resolves them to bets. The descriptions are what an LLM
 * reads when it picks one, so they describe the world, not the trade.
 *
 * Bet whys are human-written and may name the security; they're the last
 * link from world to market. Prices, strikes and odds still come from code.
 * src/data/__tests__/integrity.test.ts checks every bet is reachable.
 */
export const MECHANISMS: Mechanism[] = [
  {
    id: 'ai-chip-demand',
    label: 'Demand for AI chips keeps compounding',
    description: 'Labs and big tech keep raising their spending on the chips that train and run AI models.',
    bets: [
      {
        betId: 'ai-compute-calls',
        why: 'NVIDIA sells most of the chips AI runs on. If compute spending keeps compounding, its sales and its stock have room to run.',
      },
      {
        betId: 'semis-basket',
        why: 'Spreads the bet across the whole chip industry, so you don’t have to pick the single winner. Pays if chip stocks as a group rise well past today’s prices.',
      },
    ],
  },
  {
    id: 'power-scarcity',
    label: 'Reliable electricity becomes scarce',
    description: 'Data centers and other new demand outrun the grid, so owners of always-on power plants can sign long contracts at high prices.',
    bets: [
      {
        betId: 'ai-power-calls',
        why: 'The largest US nuclear operator owns plants that already exist and run around the clock. That’s the scarce thing in this story, and data centers are signing long contracts for it.',
      },
    ],
  },
  {
    id: 'gas-for-power',
    label: 'Natural gas fills the power gap',
    description: 'New electricity demand is met by burning more natural gas, because gas plants are the fastest reliable power to build.',
    bets: [
      {
        betId: 'natgas-calls',
        why: 'One of the largest US gas producers. More gas burned for power means more demand for what it sells.',
      },
    ],
  },
  {
    id: 'nuclear-buildout',
    label: 'Nuclear gets built again',
    description: 'Reactors are restarted and new designs licensed and ordered, which needs fuel that mines can’t supply quickly.',
    bets: [
      {
        betId: 'smr-nuclear',
        why: 'A small-reactor company with no revenue yet. If regulators approve its design and customers sign, the stock could rerate a long way.',
      },
      {
        betId: 'uranium-calls',
        why: 'More reactors need more fuel, and new uranium mines take years to open. Tight supply tends to move prices fast.',
      },
    ],
  },
  {
    id: 'humanoid-robots',
    label: 'Humanoid robots reach real deployments',
    description: 'AI moves into the physical world: robots start doing paid work outside the lab, and the market prices that in.',
    bets: [
      {
        betId: 'robotics-calls',
        why: 'Tesla is the loudest humanoid-robot bet among big companies. Pays if the market starts pricing robots into the stock.',
      },
    ],
  },
  {
    id: 'ai-capex-bust',
    label: 'AI spending outruns what it earns',
    description: 'Big tech’s data-center spending stops looking like an investment, and the stocks priced for AI growth fall hard.',
    bets: [
      {
        betId: 'ai-bubble-puts',
        why: 'The Nasdaq-100 is dominated by the companies doing the spending. This put spread pays if the index falls hard by expiry.',
      },
    ],
  },
  {
    id: 'defense-budgets',
    label: 'Defense budgets rise for years',
    description: 'Governments re-arm, and multi-year weapons contracts turn budget increases into a long order backlog.',
    bets: [
      {
        betId: 'defense-calls',
        why: 'Lockheed builds the fighter jets and missiles allies are ordering. Rising budgets become a long order backlog.',
      },
    ],
  },
  {
    id: 'tanker-rates',
    label: 'Tanker day rates stay high',
    description: 'Ships avoid a major route or pay steep war-risk insurance, so each voyage takes longer and tankers earn more per day.',
    bets: [
      {
        betId: 'tanker-calls',
        why: 'Longer voyages mean each tanker is busy for longer, so day rates rise and tanker owners earn more.',
      },
    ],
  },
  {
    id: 'oil-spike',
    label: 'Oil prices spike',
    description: 'A real cut in oil supply that spare capacity can’t cover pushes crude sharply higher.',
    bets: [{ betId: 'oil-calls', why: 'Tracks the price of oil. Pays if crude rises sharply by expiry.' }],
  },
  {
    id: 'gold-higher',
    label: 'Gold climbs',
    description: 'Money moves into gold: because of fear, because rates fall and holding it gets cheaper, or because cash is losing value.',
    bets: [
      {
        betId: 'gold-calls',
        why: 'Tracks the price of gold. Pays if gold climbs well past today’s price by expiry.',
      },
    ],
  },
  {
    id: 'cheap-fuel-airlines',
    label: 'Cheap fuel lifts airlines',
    description: 'Oil falls, and airlines, whose biggest variable cost is fuel, see margins jump.',
    bets: [
      {
        betId: 'airlines-calls',
        why: 'Fuel is an airline’s biggest variable cost. Cheaper oil goes almost straight to airline profits.',
      },
    ],
  },
  {
    id: 'rate-relief-small-caps',
    label: 'Lower rates relieve small companies',
    description: 'Interest rates fall without a deep recession, and small companies that carry floating-rate debt benefit most.',
    bets: [
      {
        betId: 'small-caps-calls',
        why: 'Tracks the Russell 2000 index of small US companies. Pays if they rally well past today’s level by expiry.',
      },
    ],
  },
  {
    id: 'biotech-funding',
    label: 'Biotech gets funded again',
    description: 'Cheaper money and big-pharma deals bring investors back to companies that burn cash for years before they have a product.',
    bets: [
      {
        betId: 'biotech-calls',
        why: 'Tracks small and mid-size biotech stocks, which tend to move the most when funding gets easier.',
      },
    ],
  },
  {
    id: 'direct-to-phone',
    label: 'Phones connect straight to satellites',
    description: 'Carriers pay to fill coverage gaps from orbit, and the satellites to do it launch on schedule.',
    bets: [
      {
        betId: 'satellite-phone',
        why: 'AST SpaceMobile is building cell towers in orbit with carrier partners. If launches stay on schedule, revenue could arrive fast.',
      },
    ],
  },
  {
    id: 'second-launcher',
    label: 'A second launch company gets big',
    description: 'Launch demand grows and customers want a reliable alternative to the leader, so the number-two launcher wins real share.',
    bets: [
      {
        betId: 'launch-calls',
        why: 'Rocket Lab flies more often than any US launcher but one, and it’s building a bigger rocket. Pays if the market starts pricing it as the clear number two.',
      },
    ],
  },
];
