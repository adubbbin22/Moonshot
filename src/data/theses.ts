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
    settledBy: 'the end of 2028',
    outsideView: {
      question: 'When a new technology was hailed as about to change how people work, did it within about five years?',
      cases: [
        { label: 'Spreadsheets, 1979', happened: true, note: 'Within a few years, PC spreadsheets were standard in finance and accounting.' },
        { label: 'Expert systems, early 1980s', happened: false, note: 'A boom in corporate AI that fizzled into the “AI winter” by the end of the decade.' },
        { label: 'Video calls, 1970', happened: false, note: 'AT&T’s Picturephone flopped. Video calls became normal at work only decades later.' },
        { label: 'Email and the web, mid-1990s', happened: true, note: 'Standard office tools within about five years.' },
        { label: 'Dictation software, late 1990s', happened: false, note: 'Arrived in the late 1990s and stayed niche for more than a decade.' },
        { label: 'Smartphones, 2007', happened: true, note: 'Everyday work tools within about five years of the iPhone.' },
        { label: 'Self-driving cars, promised for 2020', happened: false, note: 'Years later, robotaxis ran in only a handful of cities.' },
      ],
    },
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
    premortem: [
      {
        id: 'stall',
        story: 'Progress stalled. New models were only a little better than the last ones, and labs quietly cut their training budgets.',
        breaks: 'capable',
        signal: 'Two major model releases in a row that barely beat the last generation',
      },
      {
        id: 'pricey',
        story: 'It stayed expensive. The models good enough for real work cost too much to run at scale, so companies kept them for a few tasks.',
        breaks: 'cheap',
        signal: 'The price of using top models stops falling for a year',
      },
      {
        id: 'pilots',
        story: 'Companies tried it and stalled. Pilots never became how work gets done, because of errors, liability and messy data.',
        breaks: 'adopted',
        signal: 'Surveys show most companies’ AI pilots aren’t reaching everyday use',
      },
    ],
    ifTrue: [
      {
        id: 'compute',
        claim: 'Labs and big tech need far more computing power',
        because: 'Training better models and serving more users both run on chips. More use means more chips, even as each chip gets faster.',
        against: 'Efficiency could outrun demand. If models get much cheaper to run, the world may need fewer chips than today’s spending plans assume.',
        thenWhat: 'High chip profits pull in competitors, and the biggest customers design their own chips. Margins can fall even while demand grows.',
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
        thenWhat: 'Power that scarce draws in new supply, and political pressure to cap what generators can charge.',
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
            thenWhat: 'More demand for gas brings more drilling, which can keep gas prices down.',
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
            thenWhat: 'A rush of reactor projects invites scrutiny. One costly delay can sour investors on the whole group.',
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
        thenWhat: 'If humanoid robots start working, rivals race in, many of them cheaper, and prices fall fast.',
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
        thenWhat: 'Falling stocks bring rate cuts and buybacks, which can cushion the drop before it gets deep.',
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
    settledBy: 'the end of 2030',
    outsideView: {
      question: 'When forecasters predicted a surge in US electricity demand, did it arrive?',
      cases: [
        { label: 'Postwar boom, 1950s–60s', happened: true, note: 'Demand grew around 7% a year for two decades, as utilities expected.' },
        { label: 'Nuclear buildout, early 1970s', happened: false, note: 'Growth slowed sharply after 1973, and over a hundred ordered reactors were cancelled.' },
        { label: 'The internet, 1999', happened: false, note: 'Claims that computers would eat a big share of US power turned out wildly too high.' },
        { label: 'Data centers, 2007', happened: false, note: 'Data-center power use grew, but far less than the government projected.' },
      ],
    },
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
    premortem: [
      {
        id: 'ai-slows',
        story: 'AI spending slowed, and data-center projects were shelved or delayed.',
        breaks: 'datacenters',
        signal: 'Big tech cuts its capital spending plans',
      },
      {
        id: 'subsidies',
        story: 'Electric cars and new factories lost their subsidies and stalled.',
        breaks: 'electrify',
        signal: 'Government incentives for EVs and factories are scaled back',
      },
      {
        id: 'supply-caught-up',
        story: 'Solar, batteries and gas plants went up faster than anyone expected, so supply kept pace.',
        breaks: 'slow-supply',
        signal: 'Queues of new power projects waiting to connect start clearing faster',
      },
    ],
    ifTrue: [
      {
        id: 'incumbents',
        claim: 'Owners of always-on power plants win',
        because: 'When buyers need reliable power badly, whoever already runs working plants can sign long contracts at high prices.',
        against: 'Regulators may cap prices or make utilities share the gains with households.',
        thenWhat: 'Scarce power invites regulators to cap prices and new plants to compete for the same contracts.',
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
        thenWhat: 'More demand brings more drilling, which can keep gas prices in check.',
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
        thenWhat: 'Enthusiasm can run ahead of reality. Delays and cost overruns can deflate the whole group.',
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
    settledBy: 'the end of 2028',
    outsideView: {
      question: 'When conflict disrupted a major shipping route, did the disruption last more than two years?',
      cases: [
        { label: 'Suez Crisis, 1956', happened: false, note: 'The canal reopened about five months after it closed.' },
        { label: 'Six-Day War, 1967', happened: true, note: 'The Suez Canal stayed closed for eight years.' },
        { label: 'Iran–Iraq Tanker War, 1984', happened: true, note: 'Attacks on Gulf shipping went on for about four years.' },
        { label: 'Black Sea, 2022', happened: false, note: 'Ukraine’s ports were blockaded for about five months before a deal reopened grain shipments.' },
      ],
    },
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
    premortem: [
      {
        id: 'gulf-deal',
        story: 'A deal in the Gulf reopened shipping within months.',
        breaks: 'gulf',
        signal: 'War-risk insurance for Gulf transits falls back toward normal',
      },
      {
        id: 'detente',
        story: 'The big powers made deals instead: trade agreements and arms talks cooled things down.',
        breaks: 'rivalry',
        signal: 'A major US–China trade or arms agreement',
      },
      {
        id: 'budgets-slip',
        story: 'Budgets got tight, and defense promises slipped as voters chose pensions and healthcare.',
        breaks: 'voters',
        signal: 'Allies miss or delay their announced defense spending targets',
      },
    ],
    ifTrue: [
      {
        id: 'defense',
        claim: 'Defense budgets rise for years',
        because: 'Weapons programs run on multi-year contracts. Once a budget increase passes, orders keep flowing for a long time.',
        against: 'Governments may spend the money at home or on cheap drones rather than on big US defense contractors.',
        thenWhat: 'Bigger budgets bring more competition for contracts and pressure to buy cheaper weapons, like drones.',
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
        thenWhat: 'High day rates pull in more ships and keep old tankers sailing longer, which pushes rates back down.',
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
            thenWhat: 'High prices cut demand and bring more drilling and emergency reserve releases, which pull prices back.',
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
        thenWhat: 'If the scare fades or rates rise, the money that rushed into gold can leave just as fast.',
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
        thenWhat: 'Cheap fuel brings more flights, and fare wars can eat the savings.',
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
    settledBy: 'the end of 2027',
    outsideView: {
      question: 'When markets priced where Fed rates would be a year out, did rates end up lower than priced?',
      cases: [
        { label: '2001', happened: true, note: 'The Fed cut from 6.5% to 1.75% in one year, far more than markets expected.' },
        { label: '2008', happened: true, note: 'Rates went to near zero by December as the financial crisis hit.' },
        { label: '2016', happened: true, note: 'The Fed signaled four hikes and made one.' },
        { label: '2019', happened: true, note: 'Markets expected little change; the Fed cut three times.' },
        { label: '2022', happened: false, note: 'Markets priced a few hikes; the Fed raised rates by more than four points.' },
        { label: '2024', happened: false, note: 'Markets priced about six quarter-point cuts; the Fed delivered the equivalent of four.' },
      ],
    },
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
    premortem: [
      {
        id: 'inflation-back',
        story: 'Inflation came back. Tariffs, energy and deficits pushed prices up again.',
        breaks: 'inflation',
        signal: 'Core inflation rises three months in a row',
      },
      {
        id: 'no-slowdown',
        story: 'The economy kept humming, so there was no reason to cut much.',
        breaks: 'slowdown',
        signal: 'Unemployment stays low and wage growth stays strong',
      },
      {
        id: 'fed-holds',
        story: 'The Fed held back, worried about a new inflation scare or its own credibility.',
        breaks: 'fed',
        signal: 'Fed officials push back on the cuts markets expect',
      },
    ],
    ifTrue: [
      {
        id: 'small-caps',
        claim: 'Small companies that borrow get relief',
        because: 'Small companies carry more floating-rate debt than big ones, so lower rates feed straight into their profits.',
        against: 'Rates usually fall because the economy is weak, and small companies suffer most in a recession.',
        thenWhat: 'If cuts come because the economy is weak, falling profits can outweigh cheaper borrowing.',
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
        thenWhat: 'Cheap money brings a wave of new share sales, which can weigh on biotech stock prices.',
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
        thenWhat: 'If cuts revive growth and inflation fears fade, there’s less reason to hold gold.',
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
        thenWhat: 'If inflation sticks, rates may rise further, and higher rates make gold costlier to hold.',
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
    settledBy: '2030',
    outsideView: {
      question: 'When a space business was pitched as the next big consumer market, did it get there within about a decade?',
      cases: [
        { label: 'Iridium satellite phones, 1998', happened: false, note: 'Went bankrupt within a year of launch.' },
        { label: 'Satellite TV, 1994', happened: true, note: 'Tens of millions of US subscribers within about a decade.' },
        { label: 'Satellite internet (Teledesic), 1990s', happened: false, note: 'Abandoned in 2002 before it launched a service.' },
        { label: 'GPS in consumer devices, 2000', happened: true, note: 'In most phones and new cars within about a decade.' },
        { label: 'Virgin Galactic space tourism, 2004', happened: false, note: 'Promised flights by about 2007; commercial flights began only in 2023 and are still rare.' },
        { label: 'Starlink, 2020', happened: true, note: 'Millions of paying customers within about five years.' },
      ],
    },
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
    premortem: [
      {
        id: 'leader-stumbles',
        story: 'The leading launcher stumbled or kept its rockets for its own satellites, and costs stopped falling for everyone else.',
        breaks: 'launch-cost',
        signal: 'Launch prices for outside customers stop falling',
      },
      {
        id: 'niche',
        story: 'Customers didn’t pay up. Satellite services stayed a niche next to cheap ground networks.',
        breaks: 'demand',
        signal: 'Growth in satellite service subscribers stalls',
      },
      {
        id: 'winner-takes-all',
        story: 'One company took the whole market. Challengers lived on government contracts or folded.',
        breaks: 'competition',
        signal: 'A challenger’s key rocket or satellite program slips a year or more',
      },
    ],
    ifTrue: [
      {
        id: 'direct-to-phone',
        claim: 'Phones connect straight to satellites',
        because: 'Most of the planet has no cell coverage. Carriers would pay to fill those gaps without building towers.',
        against: 'Getting enough bandwidth from orbit to an ordinary phone is hard, and bigger rivals are racing to do it.',
        thenWhat: 'If it works, bigger players with more satellites and spectrum can copy it.',
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
        thenWhat: 'If launch demand booms, the leader cuts prices and new rivals appear.',
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
