import type { FundamentalsProvider } from './types';
import { COMPANY_SAMPLES, SAMPLE_AS_OF } from '@/data/companySamples';
import { UNDERLYINGS } from '@/data/underlyings';

const names = new Map(UNDERLYINGS.map((u) => [u.symbol, u.name]));

/** Made-up, rounded figures for demos, labelled as such on every screen. */
export function createSampleProvider(): FundamentalsProvider {
  return {
    id: 'sample',
    label: 'Sample figures (not live)',
    async getCompany(symbol) {
      const sample = COMPANY_SAMPLES[symbol];
      if (!sample) return undefined;
      return {
        symbol,
        name: names.get(symbol) ?? symbol,
        asOf: `${SAMPLE_AS_OF}T00:00:00.000Z`,
        basis: 'sample',
        source: 'Sample figures',
        ...sample,
      };
    },
  };
}
