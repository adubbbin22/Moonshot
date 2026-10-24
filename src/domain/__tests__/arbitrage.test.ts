import { edgeOverCrowd, eventVsOptions, sideProbability, venueArbitrage, venueSpread } from '../arbitrage';

describe('venue arbitrage', () => {
  it('finds a guaranteed edge when YES here plus NO there costs under a dollar', () => {
    const arb = venueArbitrage([
      { venue: 'kalshi', yes: 0.71 },
      { venue: 'polymarket', yes: 0.66 },
    ]);
    expect(arb).toEqual({
      buyYesAt: 'polymarket',
      yesPrice: 0.66,
      buyNoAt: 'kalshi',
      noPrice: expect.closeTo(0.29, 6),
      cost: expect.closeTo(0.95, 6),
      edge: expect.closeTo(0.05, 6),
      netEdge: expect.closeTo(0.02, 6),
    });
    expect(venueSpread([{ yes: 0.71 }, { yes: 0.66 }])).toBeCloseTo(0.05);
  });

  it('calls a small gap an edge that fees eat, and finds nothing with one venue or equal prices', () => {
    const arb = venueArbitrage([
      { venue: 'kalshi', yes: 0.7 },
      { venue: 'polymarket', yes: 0.72 },
    ]);
    expect(arb?.edge).toBeCloseTo(0.02);
    expect(arb?.netEdge).toBeCloseTo(-0.01);
    expect(venueArbitrage([{ venue: 'kalshi', yes: 0.7 }])).toBeNull();
    expect(venueArbitrage([{ venue: 'kalshi', yes: 0.7 }, { venue: 'polymarket', yes: 0.7 }])).toBeNull();
    expect(venueSpread([{ yes: 0.7 }])).toBeNull();
  });
});

describe('event vs options', () => {
  it('turns the pair into the link the options price assumes', () => {
    expect(sideProbability(0.7, 'yes')).toBe(0.7);
    expect(sideProbability(0.7, 'no')).toBeCloseTo(0.3);
    const cheap = eventVsOptions(0.7, 0.26);
    expect(cheap.breakEvenLink).toBeCloseTo(0.371);
    expect(cheap.verdict).toBe('options-cheaper');
    expect(eventVsOptions(0.2, 0.26).verdict).toBe('move-priced-above-event');
    expect(eventVsOptions(0.28, 0.26).verdict).toBe('close');
    expect(edgeOverCrowd(0.9, 0.7)).toBeCloseTo(0.2);
  });
});
