import type { EventQuestion } from '@/domain/types';

/**
 * SAMPLE QUESTIONS. Hand-written stand-ins for the editorial pipeline in
 * docs/STRATEGY.md (LLM draft → rules-lawyer check → human approval). Each
 * resolves on a named public source by a fixed date. Thresholds and context
 * need an editor's review before anyone outside the team sees them.
 *
 * Order matters: within a topic, earlier questions are shown to new users first.
 */
export const EVENTS: EventQuestion[] = [
  {
    id: 'hormuz-transits-2027',
    question: 'Will shipping through the Strait of Hormuz be back to normal by June 2027?',
    context:
      'Conflict in the Gulf has pushed tankers onto longer routes and raised insurance costs. ' +
      'About a fifth of the world’s oil passes through the strait.',
    category: 'geopolitics',
    resolution: {
      rule:
        'Resolves YES if IMF PortWatch’s 7-day average of daily transits through the Strait of Hormuz ' +
        'reaches at least 80% of its 2025 daily average on any day through June 30, 2027.',
      source: 'IMF PortWatch',
      sourceUrl: 'https://portwatch.imf.org',
      resolvesOn: '2027-06-30',
    },
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
    id: 'ai-time-horizon-2027',
    question: 'Will an AI model handle week-long software tasks by the end of 2027?',
    context:
      'AI agents finish longer tasks every few months. METR measures the length of task, in human ' +
      'working hours, that a model can complete half the time.',
    category: 'tech',
    resolution: {
      rule:
        'Resolves YES if METR publishes a measured 50%-success time horizon of at least 40 hours for ' +
        'any AI model on or before December 15, 2027.',
      source: 'METR',
      sourceUrl: 'https://metr.org',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'AI keeps accelerating',
        rationale: 'More capable AI means more compute and more power. Those are the bottlenecks.',
        betIds: ['ai-compute-calls', 'ai-power-calls', 'semis-basket'],
      },
      {
        side: 'no',
        label: 'Progress stalls',
        rationale: 'If capabilities plateau, prices assume a future that won’t arrive on time.',
        betIds: ['ai-bubble-puts'],
      },
    ],
  },
  {
    id: 'fed-below-3-2027',
    question: 'Will the Fed cut interest rates below 3% by the end of 2027?',
    context: 'Lower rates help borrowers and long-shot companies most. Sticky inflation keeps them high.',
    category: 'macro',
    resolution: {
      rule:
        'Resolves YES if the upper bound of the federal funds target range is below 3.00% in the ' +
        'statement released after the Federal Reserve’s last scheduled meeting of 2027.',
      source: 'Federal Reserve FOMC statements',
      sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      resolvesOn: '2027-12-16',
    },
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
    id: 'brent-100-2027',
    question: 'Will oil average more than $100 a barrel in any month of 2027?',
    context: 'Supply shocks move oil fast. Spare capacity and slowing demand pull the other way.',
    category: 'energy',
    resolution: {
      rule:
        'Resolves YES if the EIA’s monthly average Brent spot price is above $100.00 per barrel for any ' +
        'month from January through November 2027.',
      source: 'US Energy Information Administration',
      sourceUrl: 'https://www.eia.gov/dnav/pet/hist/rbrteM.htm',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Oil spikes',
        rationale: 'A supply shock lifts oil and the tanker owners who move it.',
        betIds: ['oil-calls', 'tanker-calls'],
      },
      {
        side: 'no',
        label: 'Oil stays tame',
        rationale: 'Fuel is an airline’s biggest variable cost. Tame oil helps their margins.',
        betIds: ['airlines-calls'],
      },
    ],
  },
  {
    id: 'smr-grid-2028',
    question: 'Will a small modular reactor send power to a US grid by the end of 2028?',
    context:
      'Tech companies have signed deals for future nuclear power, but no small modular reactor has ' +
      'delivered electricity commercially in the US yet.',
    category: 'energy',
    resolution: {
      rule:
        'Resolves YES if a reactor of 300 MWe or less (not a research reactor) is connected to a US grid ' +
        'and delivers power, as announced by its operator or the NRC, on or before December 15, 2028.',
      source: 'NRC and operator announcements',
      sourceUrl: 'https://www.nrc.gov',
      resolvesOn: '2028-12-15',
    },
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
    id: 'fda-novel-drugs-2027',
    question: 'Will the FDA approve at least 55 new drugs in 2027?',
    context:
      'The FDA’s count of novel drug approvals is a pulse check on biotech: more approvals mean more ' +
      'products, more deals, and more funding.',
    category: 'health',
    resolution: {
      rule:
        'Resolves YES if the FDA’s Novel Drug Approvals page lists at least 55 novel drugs approved by ' +
        'the Center for Drug Evaluation and Research in 2027, as of December 15, 2027.',
      source: 'FDA Novel Drug Approvals',
      sourceUrl: 'https://www.fda.gov/drugs/development-approval-process-drugs/novel-drug-approvals-fda',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Biotech wakes up',
        rationale: 'More approvals bring more deals and more money back into biotech.',
        betIds: ['biotech-calls'],
      },
      {
        side: 'no',
        label: 'Biotech stays stuck',
        rationale: 'No obvious asymmetric bet on this side. Your call still counts.',
        betIds: [],
      },
    ],
  },
  {
    id: 'asts-satellites-2027',
    question: 'Will AST SpaceMobile have 60 satellites in orbit by the end of 2027?',
    context:
      'AST SpaceMobile is building large satellites that talk directly to ordinary phones. Coverage ' +
      'depends on how many it gets up.',
    category: 'space',
    resolution: {
      rule:
        'Resolves YES if AST SpaceMobile reports at least 60 of its BlueBird satellites in orbit, in a ' +
        'press release or SEC filing dated on or before December 15, 2027.',
      source: 'AST SpaceMobile press releases and SEC filings',
      sourceUrl: 'https://ast-science.com',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Space goes mainstream',
        rationale: 'A working network needs satellites and launches. Both are small, fast-growing markets.',
        betIds: ['satellite-phone', 'launch-calls'],
      },
      {
        side: 'no',
        label: 'Launches slip',
        rationale: 'No obvious asymmetric bet on this side. Sometimes the right move is no bet at all.',
        betIds: [],
      },
    ],
  },
  {
    id: 'nvda-growth-2027',
    question: 'Will NVIDIA’s data-center sales still be growing 40% a year in late 2027?',
    context:
      'NVIDIA’s data-center revenue is the clearest read on AI spending. Growth slowing toward normal ' +
      'would mean the build-out is maturing.',
    category: 'tech',
    resolution: {
      rule:
        'Resolves YES if NVIDIA’s latest quarterly results released on or before December 15, 2027 show ' +
        'data-center revenue up at least 40% from the same quarter a year earlier.',
      source: 'NVIDIA quarterly results',
      sourceUrl: 'https://investor.nvidia.com',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'AI spending keeps compounding',
        rationale: 'If AI budgets keep growing, the chipmakers selling the compute keep winning.',
        betIds: ['ai-compute-calls', 'semis-basket'],
      },
      {
        side: 'no',
        label: 'The build-out matures',
        rationale: 'Slowing growth would reprice the stocks priced for endless growth.',
        betIds: ['ai-bubble-puts'],
      },
    ],
  },
  {
    id: 'gold-higher-2027',
    question: 'Will gold be higher on December 1, 2027 than on December 1, 2026?',
    context: 'Gold is where scared money goes when people stop trusting currencies or governments.',
    category: 'macro',
    resolution: {
      rule:
        'Resolves YES if the LBMA Gold Price PM in US dollars on December 1, 2027 is higher than on ' +
        'December 1, 2026. If either date has no fixing, the next fixing is used.',
      source: 'LBMA Gold Price',
      sourceUrl: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices',
      resolvesOn: '2027-12-02',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Gold keeps running',
        rationale: 'A rising gold price is exactly what a gold call spread pays for.',
        betIds: ['gold-calls'],
      },
      {
        side: 'no',
        label: 'Gold cools off',
        rationale: 'No obvious asymmetric bet on this side. Your call still counts.',
        betIds: [],
      },
    ],
  },
  {
    id: 'optimus-1000-2027',
    question: 'Will Tesla say it has built 1,000 humanoid robots by the end of 2027?',
    context: 'Tesla says its Optimus robot will be a bigger business than cars. Production numbers are the first real test.',
    category: 'tech',
    resolution: {
      rule:
        'Resolves YES if Tesla states in an earnings release, shareholder letter, SEC filing or earnings ' +
        'call on or before December 15, 2027 that it has produced at least 1,000 Optimus robots in total.',
      source: 'Tesla investor relations',
      sourceUrl: 'https://ir.tesla.com',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Robots leave the lab',
        rationale: 'Real production would make robots part of the story the stock trades on.',
        betIds: ['robotics-calls'],
      },
      {
        side: 'no',
        label: 'Robots stay in the lab',
        rationale: 'No obvious asymmetric bet on this side. Your call still counts.',
        betIds: [],
      },
    ],
  },
  {
    id: 'nato-spending-2027',
    question: 'Will at least 10 NATO allies spend 3.5% of GDP on defense in 2027?',
    context:
      'NATO allies agreed in 2025 to raise core defense spending toward 3.5% of GDP. How fast they get ' +
      'there sets defense budgets for years.',
    category: 'geopolitics',
    resolution: {
      rule:
        'Resolves YES if NATO’s defence expenditure report published on or before December 15, 2027 ' +
        'estimates that at least 10 allies spend 3.5% of GDP or more on defense in 2027.',
      source: 'NATO defence expenditure reports',
      sourceUrl: 'https://www.nato.int/cps/en/natohq/topics_49198.htm',
      resolvesOn: '2027-12-15',
    },
    outcomes: [
      {
        side: 'yes',
        label: 'Re-arming accelerates',
        rationale: 'Faster spending growth flows straight to defense contractors’ order books.',
        betIds: ['defense-calls'],
      },
      {
        side: 'no',
        label: 'Budgets lag the promises',
        rationale: 'No obvious asymmetric bet on this side. Your call still counts.',
        betIds: [],
      },
    ],
  },
];
