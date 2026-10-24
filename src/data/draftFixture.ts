import type { ThesisDraft } from '@/domain/thesisDraft';

/**
 * A canned draft in the exact shape the model returns, for tests and for the
 * demo drafter (EXPO_PUBLIC_INTELLIGENCE=fixture). It goes through the same
 * validation as a real draft, so it also documents what a good draft looks
 * like: mechanisms by id, sources on every case, no prices, no securities.
 */
export const DRAFT_FIXTURE: ThesisDraft = {
  title: 'AI agents at work',
  hook: 'Do AI agents take over customer support?',
  category: 'tech',
  belief: 'By the end of 2028, AI agents handle most customer-support conversations at large US companies.',
  settledBy: 'the end of 2028',
  outsideView: {
    question: 'When a technology was expected to replace most of a service job within five years, did it?',
    cases: [
      {
        label: 'ATMs and bank tellers, 1990s',
        happened: false,
        note: 'ATMs spread fast, but the number of tellers kept growing for two decades as branches got cheaper to open.',
        source: 'James Bessen, “Learning by Doing”, 2015',
      },
      {
        label: 'Phone menus (IVR), 1990s',
        happened: false,
        note: 'Automated menus took over routing, but most calls still ended with a person.',
        source: 'Industry surveys collected by Contact Babel',
      },
      {
        label: 'Online self-service, 2000s',
        happened: true,
        note: 'Web self-service became the main channel for routine tasks at banks and airlines within about five years.',
        source: 'Forrester customer-service channel surveys',
      },
      {
        label: 'First-generation chatbots, 2016',
        happened: false,
        note: 'Widely launched, then quietly scaled back after they frustrated customers.',
        source: 'Gartner, 2019',
      },
    ],
  },
  premises: [
    {
      id: 'capable',
      claim: 'Agents resolve real support cases, not just answer questions',
      why: 'Models can now read account data, follow policies and take actions through tools, which is most of what a support agent does.',
      against: 'The hard cases are the ones with missing information and angry customers, where models still fail in ways that cost trust.',
      check: { questionId: 'ai-time-horizon-2027', side: 'yes' },
    },
    {
      id: 'cheaper',
      claim: 'An agent conversation costs far less than a human one',
      why: 'The cost of running a model keeps falling while wages rise, and an agent can handle many conversations at once.',
      against: 'Supervision, escalations and mistakes add costs that don’t show up in the per-conversation price.',
      check: null,
    },
    {
      id: 'trusted',
      claim: 'Companies let agents act without a human in the loop',
      why: 'Once agents resolve routine cases more consistently than people, keeping a human on every case stops making sense.',
      against: 'One public failure, a lawsuit or a regulator can push companies back to human review for years.',
      check: null,
    },
  ],
  premortem: [
    {
      id: 'trust-collapse',
      story: 'A string of embarrassing agent failures went viral, and big companies put humans back on every case.',
      breaks: 'trusted',
      signal: 'A large company publicly rolls back an AI support rollout',
    },
    {
      id: 'hard-cases',
      story: 'Agents handled the easy half of cases, and the hard half still needed people, so headcount barely moved.',
      breaks: 'capable',
      signal: 'Support headcount at large companies stays flat through two years of agent rollouts',
    },
    {
      id: 'hidden-costs',
      story: 'Supervision and escalation costs ate the savings, and the business case fell apart.',
      breaks: 'cheaper',
      signal: 'Companies report flat support costs despite agent rollouts',
    },
  ],
  ifTrue: [
    {
      id: 'inference-demand',
      claim: 'Serving agents needs far more computing power',
      because: 'Every support conversation becomes model usage, around the clock, at every large company.',
      against: 'Smaller, cheaper models may handle support fine, so the compute per conversation could fall faster than usage rises.',
      thenWhat: 'High chip profits pull in competitors, and the biggest buyers design their own chips.',
      mechanisms: ['ai-chip-demand'],
      check: { questionId: 'nvda-growth-2027', side: 'yes' },
      next: [
        {
          id: 'power',
          claim: 'Electricity becomes the constraint',
          because: 'Round-the-clock agent traffic means data centers that never idle, and power plants take years to build.',
          against: 'Efficiency gains and new supply could arrive faster than expected.',
          thenWhat: 'Scarce power invites new supply and political pressure to cap prices.',
          mechanisms: ['power-scarcity'],
          check: null,
        },
      ],
    },
  ],
  ifFalse: [
    {
      id: 'bust',
      claim: 'AI spending outruns what it earns',
      because: 'Support was supposed to be the easy win. If it doesn’t pay, the spending behind it looks harder to justify.',
      against: 'Other uses, like coding, could carry the spending even if support disappoints.',
      thenWhat: 'Falling stocks bring rate cuts and buybacks that cushion the drop.',
      mechanisms: ['ai-capex-bust'],
      check: null,
      next: [],
    },
  ],
};
