import type { ThesisTree } from '@/domain/types';

/**
 * SAMPLE THESIS TREES. Each one breaks a big belief into the parts it
 * depends on, then follows "which means…" steps to the bets that pay if the
 * chain holds. This is the human-written stand-in for the mechanism library
 * in docs/STRATEGY.md: an LLM may later propose steps, but people approve
 * them, and the links to bets stay curated.
 *
 * Writing rules:
 * - A belief's parts should add up to the belief: if every part holds, so
 *   does the belief.
 * - Every claim gets its strongest case against, written in good faith.
 * - No numbers in bet whys. Prices, strikes and odds come from code.
 * - `check` points at a feed question whose answer tests the claim, and
 *   which side of it means the claim is true.
 *
 * src/data/__tests__/integrity.test.ts checks references and that every bet
 * in the catalog is reachable from at least one tree.
 */
export const THESES: ThesisTree[] = [
  {
    id: 'ai',
    title: 'Artificial intelligence',
    hook: 'Do you believe in AI?',
    emoji: '🤖',
    category: 'tech',
    belief: 'By the end of 2028, AI does a real share of the world’s knowledge work.',
    premises: [
      {
        id: 'capable',
        claim: 'Models keep getting better at long, real tasks',
        why: 'The length of task an AI can finish on its own has been doubling every several months for years, and labs keep finding new ways to scale.',
        against: 'Progress could stall. Good training data is running out, and each step up in scale costs more for a smaller gain.',
        check: { questionId: 'ai-time-horizon-2027', side: 'yes' },
      },
      {
        id: 'cheap',
        claim: 'It gets cheap enough to use everywhere',
        why: 'The cost of running a model of a given quality has fallen several times over each year as chips and software improve.',
        against: 'The best models cost far more to run than last year’s, and the cheap ones may not be good enough for real work.',
      },
      {
        id: 'adopted',
        claim: 'Companies rebuild how they work around it',
        why: 'When a tool does a task for a fraction of the cost of a person, the companies that use it can undercut the ones that don’t. Competition forces adoption.',
        against: 'Big organizations change slowly. Electricity took decades to change how factories worked, and liability and messy data could slow AI the same way.',
      },
    ],
    ifTrue: [
      {
        id: 'compute',
        claim: 'Labs and big tech need far more computing power',
        because: 'Training better models and serving more users both run on chips. More use means more chips, even as each chip gets faster.',
        against: 'Efficiency could outrun demand. If models get much cheaper to run, the world may need fewer chips than today’s spending plans assume.',
        check: { questionId: 'nvda-growth-2027', side: 'yes' },
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
        id: 'power',
        claim: 'Electricity becomes the bottleneck',
        because: 'A large new data center can draw as much power as a small city. Chips arrive in months; power plants and grid lines take years.',
        against: 'The power may turn up faster than expected: on-site generation, more efficient chips, or building where there’s spare capacity.',
        bets: [
          {
            betId: 'ai-power-calls',
            why: 'The largest US nuclear operator sells always-on, carbon-free power, which is exactly what data centers are signing long contracts for.',
          },
        ],
        next: [
          {
            id: 'power-gas',
            claim: 'Gas fills the gap first',
            because: 'A gas plant can be running in a couple of years; a reactor takes about a decade. Whoever needs power soon burns gas.',
            against: 'Turbine makers are booked up for years, and gas could stay cheap anyway if production keeps rising.',
            bets: [
              {
                betId: 'natgas-calls',
                why: 'One of the largest US gas producers. More gas burned for power means more demand for what it sells.',
              },
            ],
          },
          {
            id: 'power-nuclear',
            claim: 'Nuclear gets built again',
            because: 'Big tech wants power that is clean and always on. Only nuclear does both at scale, so they are funding restarts and new reactor designs.',
            against: 'New reactors have a long record of delays and cost overruns, and licensing moves slowly.',
            check: { questionId: 'smr-grid-2028', side: 'yes' },
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
        ],
      },
      {
        id: 'robots',
        claim: 'AI moves into the physical world',
        because: 'The same kind of models that write code are learning to control robot arms and legs, and physical labor is a far bigger market than software.',
        against: 'Robots have to work safely in messy places, and hardware improves much more slowly than software. Demos aren’t deployments.',
        check: { questionId: 'optimus-1000-2027', side: 'yes' },
        bets: [
          {
            betId: 'robotics-calls',
            why: 'Tesla is the loudest humanoid-robot bet among big companies. Pays if the market starts pricing robots into the stock.',
          },
        ],
      },
    ],
    ifFalse: [
      {
        id: 'bust',
        claim: 'AI spending outruns what it earns',
        because: 'Big tech is spending enormous sums on data centers. If adoption is slow, that spending stops looking like an investment, and stocks priced for AI growth fall.',
        against: 'The biggest spenders can fund this from cash flow for years, and investors may stay patient for the payoff.',
        bets: [
          {
            betId: 'ai-bubble-puts',
            why: 'The Nasdaq-100 is dominated by the companies doing the spending. This put spread pays if the index falls hard by expiry.',
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
    belief: 'US electricity demand grows fast enough this decade to strain the grid.',
    premises: [
      {
        id: 'datacenters',
        claim: 'Data centers keep multiplying',
        why: 'Every AI query and training run needs power, and big tech’s data-center plans keep getting bigger.',
        against: 'If AI spending slows, so does the power demand. Each chip generation also does more work per watt.',
      },
      {
        id: 'electrify',
        claim: 'Factories, homes and cars move onto the grid',
        why: 'New factories, heat pumps and electric cars all swap fuel burned on site for electricity from the grid.',
        against: 'Electric car sales have grown more slowly than forecast in the US, and factory building leans on subsidies that change with politics.',
      },
      {
        id: 'slow-supply',
        claim: 'New supply can’t keep up quickly',
        why: 'New power plants and transmission lines take years to permit and build. New demand can show up in two.',
        against: 'Solar and batteries go up in a year or two, and grid operators can squeeze more out of the lines they have.',
      },
    ],
    ifTrue: [
      {
        id: 'incumbents',
        claim: 'Owners of always-on power plants win',
        because: 'When buyers need reliable power badly, whoever already runs working plants can sign long contracts at high prices.',
        against: 'Regulators may cap prices or make utilities share the gains with households.',
        bets: [
          {
            betId: 'ai-power-calls',
            why: 'Owns the largest US nuclear fleet: plants that already exist and run around the clock. That’s the scarce thing in this story.',
          },
        ],
      },
      {
        id: 'gas',
        claim: 'Gas fills the gap first',
        because: 'Gas plants are the fastest reliable power to build, so they take most of the near-term demand.',
        against: 'Turbines are back-ordered for years, and more gas burned might not mean higher prices if production keeps rising.',
        bets: [
          {
            betId: 'natgas-calls',
            why: 'A large US gas producer. More gas burned for power means more demand for its product.',
          },
        ],
      },
      {
        id: 'nuclear',
        claim: 'Nuclear makes a comeback',
        because: 'Nothing else is carbon-free and always on at scale, so utilities and big tech are backing restarts and new designs.',
        against: 'Nuclear projects run late and over budget far more often than not.',
        check: { questionId: 'smr-grid-2028', side: 'yes' },
        bets: [
          {
            betId: 'smr-nuclear',
            why: 'If small reactors get licensed and win contracts, the companies building them get valued on future power sales.',
          },
          {
            betId: 'uranium-calls',
            why: 'Restarted and new reactors all need fuel, and mine supply can’t respond quickly.',
          },
        ],
      },
    ],
    ifFalse: [
      {
        id: 'plentiful',
        claim: 'Power stays plentiful',
        because: 'If demand grows slowly, the existing grid copes, and power prices stay flat.',
        against: 'Even modest growth can strain the regions where data centers cluster.',
      },
    ],
  },
  {
    id: 'geopolitics',
    title: 'Geopolitics',
    hook: 'Is the world getting more dangerous?',
    emoji: '🌍',
    category: 'geopolitics',
    belief: 'Through 2028, conflict keeps disrupting trade and pushing governments to re-arm.',
    premises: [
      {
        id: 'gulf',
        claim: 'The Gulf doesn’t settle down',
        why: 'Tankers are still taking longer routes and paying more for insurance, and the disputes behind the conflict are unresolved.',
        against: 'Conflicts that hurt everyone’s trade create strong pressure for a deal. Shipping can normalize within weeks of one.',
        check: { questionId: 'hormuz-transits-2027', side: 'no' },
      },
      {
        id: 'rivalry',
        claim: 'Big powers keep competing, not cooperating',
        why: 'The US, China and Russia are all building up their militaries, and alliances are being redrawn. Rivalries like this tend to last decades.',
        against: 'Trade ties are a strong brake. The big powers have a lot to lose from open conflict.',
      },
      {
        id: 'voters',
        claim: 'Voters accept paying for defense',
        why: 'After Russia invaded Ukraine, European governments raised defense budgets with broad public support.',
        against: 'Defense competes with pensions and healthcare. When budgets get tight, promises slip.',
      },
    ],
    ifTrue: [
      {
        id: 'defense',
        claim: 'Defense budgets rise for years',
        because: 'Weapons programs run on multi-year contracts. Once a budget increase passes, orders keep flowing for a long time.',
        against: 'Governments may spend the money at home or on cheap drones rather than on big US defense contractors.',
        check: { questionId: 'nato-spending-2027', side: 'yes' },
        bets: [
          {
            betId: 'defense-calls',
            why: 'Lockheed builds the fighter jets and missiles allies are ordering. Rising budgets become a long order backlog.',
          },
        ],
      },
      {
        id: 'shipping',
        claim: 'Gulf shipping stays disrupted',
        because: 'Ships avoid the strait or pay steep war-risk insurance, and longer routes tie up more tankers for every barrel moved.',
        against: 'Naval escorts or a ceasefire could reopen the route quickly.',
        check: { questionId: 'hormuz-transits-2027', side: 'no' },
        bets: [
          {
            betId: 'tanker-calls',
            why: 'Longer voyages mean each tanker is busy for longer, so day rates rise and tanker owners earn more.',
          },
        ],
        next: [
          {
            id: 'oil',
            claim: 'Oil prices spike',
            because: 'About a fifth of the world’s oil passes through the strait. Any real cut in flow moves prices fast.',
            against: 'Spare capacity elsewhere and emergency reserves can cover a lot of disruption.',
            check: { questionId: 'brent-100-2027', side: 'yes' },
            bets: [
              {
                betId: 'oil-calls',
                why: 'Tracks the price of oil. Pays if crude rises sharply by expiry.',
              },
            ],
          },
        ],
      },
      {
        id: 'haven',
        claim: 'Scared money moves into gold',
        because: 'When people trust governments and currencies less, they buy what no government can print.',
        against: 'Gold pays no interest. If rates stay high, holding it is expensive, and the fear may already be in the price.',
        check: { questionId: 'gold-higher-2027', side: 'yes' },
        bets: [
          {
            betId: 'gold-calls',
            why: 'Tracks the price of gold. Pays if gold climbs well past today’s price by expiry.',
          },
        ],
      },
    ],
    ifFalse: [
      {
        id: 'calm',
        claim: 'Tensions ease and oil gets cheaper',
        because: 'A settlement in the Gulf reopens shipping and takes the risk premium out of oil.',
        against: 'Peace deals often break down, and oil producers can cut supply to hold prices up.',
        check: { questionId: 'hormuz-transits-2027', side: 'yes' },
        bets: [
          {
            betId: 'airlines-calls',
            why: 'Fuel is an airline’s biggest variable cost. Cheaper oil goes almost straight to airline profits.',
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
    belief: 'Interest rates fall further by the end of 2027 than markets expect today.',
    premises: [
      {
        id: 'inflation',
        claim: 'Inflation keeps cooling',
        why: 'Prices rise when demand outruns supply. As wage growth and rents slow, the stickiest parts of inflation come down.',
        against: 'Tariffs, an energy shock or big government deficits can push prices back up.',
      },
      {
        id: 'slowdown',
        claim: 'The economy slows enough to need help',
        why: 'High rates work with a lag. As borrowers refinance at higher rates, they spend less and companies hire less.',
        against: 'If the economy stays strong, there’s no reason to cut much.',
      },
      {
        id: 'fed',
        claim: 'The Fed acts on it',
        why: 'The Fed’s job is stable prices and full employment. With inflation near target and hiring weak, cutting is its standard move.',
        against: 'A new inflation scare, or worries about its independence, could make the Fed cautious.',
        check: { questionId: 'fed-below-3-2027', side: 'yes' },
      },
    ],
    ifTrue: [
      {
        id: 'small-caps',
        claim: 'Small companies that borrow get relief',
        because: 'Small companies carry more floating-rate debt than big ones, so lower rates feed straight into their profits.',
        against: 'Rates usually fall because the economy is weak, and small companies suffer most in a recession.',
        bets: [
          {
            betId: 'small-caps-calls',
            why: 'Tracks the Russell 2000 index of small US companies. Pays if they rally well past today’s level by expiry.',
          },
        ],
      },
      {
        id: 'innovators',
        claim: 'Long-shot innovators get funded again',
        because: 'Biotechs burn cash for years before they have a product. Cheap money makes that funding easier and makes future profits worth more today.',
        against: 'Biotech also lives or dies on drug approvals and pricing rules, which have nothing to do with rates.',
        bets: [
          {
            betId: 'biotech-calls',
            why: 'Tracks small and mid-size biotech stocks, which tend to move the most when funding gets easier.',
          },
        ],
      },
      {
        id: 'gold-cheap',
        claim: 'Gold gets cheaper to hold',
        because: 'Gold pays no interest. When rates fall, giving up interest to hold it costs less, so more people do.',
        against: 'If rates fall because inflation is beaten, there’s less reason to own an inflation hedge.',
        check: { questionId: 'gold-higher-2027', side: 'yes' },
        bets: [
          {
            betId: 'gold-calls',
            why: 'Tracks the price of gold. Pays if gold climbs well past today’s price by expiry.',
          },
        ],
      },
    ],
    ifFalse: [
      {
        id: 'sticky',
        claim: 'Inflation sticks and money loses value',
        because: 'If rates stay high because prices keep rising, cash buys less every year.',
        against: 'High rates also pay savers well, which makes holding cash less painful.',
        bets: [
          {
            betId: 'gold-calls',
            why: 'Gold has held its value through long stretches of inflation. It’s what people buy when cash loses purchasing power.',
          },
        ],
      },
    ],
  },
  {
    id: 'space',
    title: 'Space',
    hook: 'Is space the next big industry?',
    emoji: '🚀',
    category: 'space',
    belief: 'By 2030, space is a mainstream business, not a science project.',
    premises: [
      {
        id: 'launch-cost',
        claim: 'Getting to orbit keeps getting cheaper',
        why: 'Reusable rockets have cut the cost of reaching orbit many times over, and launch counts keep setting records.',
        against: 'Most of that progress comes from one company. If it stumbles or keeps its rockets for itself, costs could stop falling for everyone else.',
      },
      {
        id: 'demand',
        claim: 'Customers pay for space services',
        why: 'Satellite internet already has millions of paying customers. Phone service, Earth imaging and defense are next.',
        against: 'Plenty of space companies have raised money on promises and gone bust. Customers pay for service, not for space.',
      },
      {
        id: 'competition',
        claim: 'There’s room for more than one winner',
        why: 'Governments and big customers want a second supplier for anything critical, so they fund challengers.',
        against: 'The leader’s cost advantage is huge. Challengers may only survive on government contracts.',
      },
    ],
    ifTrue: [
      {
        id: 'direct-to-phone',
        claim: 'Phones connect straight to satellites',
        because: 'Most of the planet has no cell coverage. Carriers would pay to fill those gaps without building towers.',
        against: 'Getting enough bandwidth from orbit to an ordinary phone is hard, and bigger rivals are racing to do it.',
        check: { questionId: 'asts-satellites-2027', side: 'yes' },
        bets: [
          {
            betId: 'satellite-phone',
            why: 'AST SpaceMobile is building cell towers in orbit with carrier partners. If launches stay on schedule, revenue could arrive fast.',
          },
        ],
      },
      {
        id: 'second-launcher',
        claim: 'A second launch company gets big',
        because: 'As launch demand grows, customers want a reliable alternative to the leader.',
        against: 'New rockets often fail early or slip for years.',
        bets: [
          {
            betId: 'launch-calls',
            why: 'Rocket Lab flies more often than any US launcher but one, and it’s building a bigger rocket. Pays if the market starts pricing it as the clear number two.',
          },
        ],
      },
    ],
    ifFalse: [
      {
        id: 'one-company',
        claim: 'Space stays a one-company show',
        because: 'If the leader keeps its cost advantage and builds its own satellite services, everyone else struggles to make money.',
        against: 'Governments are unlikely to let one company control critical infrastructure.',
      },
    ],
  },
];
