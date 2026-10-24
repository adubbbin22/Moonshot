import type { Mechanism } from '@/domain/types';

/**
 * THE MECHANISM LIBRARY. Each entry is something happening in the world and
 * the catalysts (underlyings.ts) it sets off. It is the only way a thesis
 * (curated or LLM-drafted) reaches a bet: a step names mechanisms by id,
 * code follows each catalyst's direction to the bets that express it. The
 * descriptions are what an LLM reads when it picks one, so they describe
 * the world, not the trade.
 *
 * src/data/__tests__/integrity.test.ts checks every catalyst here exists and
 * every bet is reachable.
 */
export const MECHANISMS: Mechanism[] = [
  {
    id: 'ai-chip-demand',
    label: 'Demand for AI chips keeps compounding',
    description: 'Labs and big tech keep raising their spending on the chips that train and run AI models.',
    catalysts: [
      { symbol: 'NVDA', catalyst: 'ai-capex' },
      { symbol: 'SMH', catalyst: 'ai-capex' },
    ],
  },
  {
    id: 'power-scarcity',
    label: 'Reliable electricity becomes scarce',
    description: 'Data centers and other new demand outrun the grid, so owners of always-on power plants can sign long contracts at high prices.',
    catalysts: [{ symbol: 'CEG', catalyst: 'power-prices' }],
  },
  {
    id: 'gas-for-power',
    label: 'Natural gas fills the power gap',
    description: 'New electricity demand is met by burning more natural gas, because gas plants are the fastest reliable power to build.',
    catalysts: [{ symbol: 'EQT', catalyst: 'gas-demand' }],
  },
  {
    id: 'nuclear-buildout',
    label: 'Nuclear gets built again',
    description: 'Reactors are restarted and new designs licensed and ordered, which needs fuel that mines can’t supply quickly.',
    catalysts: [
      { symbol: 'OKLO', catalyst: 'licensing' },
      { symbol: 'URA', catalyst: 'reactor-demand' },
    ],
  },
  {
    id: 'humanoid-robots',
    label: 'Humanoid robots reach real deployments',
    description: 'AI moves into the physical world: robots start doing paid work outside the lab, and the market prices that in.',
    catalysts: [{ symbol: 'TSLA', catalyst: 'robots' }],
  },
  {
    id: 'ai-capex-bust',
    label: 'AI spending outruns what it earns',
    description: 'Big tech’s data-center spending stops looking like an investment, and the stocks priced for AI growth fall hard.',
    catalysts: [{ symbol: 'QQQ', catalyst: 'ai-capex-cut' }],
  },
  {
    id: 'defense-budgets',
    label: 'Defense budgets rise for years',
    description: 'Governments re-arm, and multi-year weapons contracts turn budget increases into a long order backlog.',
    catalysts: [{ symbol: 'LMT', catalyst: 'budgets' }],
  },
  {
    id: 'tanker-rates',
    label: 'Tanker day rates stay high',
    description: 'Ships avoid a major route or pay steep war-risk insurance, so each voyage takes longer and tankers earn more per day.',
    catalysts: [{ symbol: 'FRO', catalyst: 'day-rates' }],
  },
  {
    id: 'oil-spike',
    label: 'Oil prices spike',
    description: 'A real cut in oil supply that spare capacity can’t cover pushes crude sharply higher.',
    catalysts: [{ symbol: 'USO', catalyst: 'supply-shock' }],
  },
  {
    id: 'gold-higher',
    label: 'Gold climbs',
    description: 'Money moves into gold: because of fear, because rates fall and holding it gets cheaper, or because cash is losing value.',
    catalysts: [
      { symbol: 'GLD', catalyst: 'fear-flows' },
      { symbol: 'GLD', catalyst: 'real-rates' },
    ],
  },
  {
    id: 'cheap-fuel-airlines',
    label: 'Cheap fuel lifts airlines',
    description: 'Oil falls, and airlines, whose biggest variable cost is fuel, see margins jump.',
    catalysts: [{ symbol: 'JETS', catalyst: 'fuel-costs' }],
  },
  {
    id: 'rate-relief-small-caps',
    label: 'Lower rates relieve small companies',
    description: 'Interest rates fall without a deep recession, and small companies that carry floating-rate debt benefit most.',
    catalysts: [{ symbol: 'IWM', catalyst: 'rate-cuts' }],
  },
  {
    id: 'biotech-funding',
    label: 'Biotech gets funded again',
    description: 'Cheaper money and big-pharma deals bring investors back to companies that burn cash for years before they have a product.',
    catalysts: [{ symbol: 'XBI', catalyst: 'funding' }],
  },
  {
    id: 'direct-to-phone',
    label: 'Phones connect straight to satellites',
    description: 'Carriers pay to fill coverage gaps from orbit, and the satellites to do it launch on schedule.',
    catalysts: [{ symbol: 'ASTS', catalyst: 'launches' }],
  },
  {
    id: 'second-launcher',
    label: 'A second launch company gets big',
    description: 'Launch demand grows and customers want a reliable alternative to the leader, so the number-two launcher wins real share.',
    catalysts: [{ symbol: 'RKLB', catalyst: 'neutron' }],
  },
];
