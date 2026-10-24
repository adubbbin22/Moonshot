import { createProxyProvider } from './proxy';
import { createSampleProvider } from './sample';
import type { PredictionMarketProvider } from './types';
import { demoServerUrl } from '@/services/demoServer';

export type { PredictionMarketProvider } from './types';

const offProvider: PredictionMarketProvider = {
  id: 'off',
  label: 'Off',
  async getQuotes() {
    return [];
  },
};

/**
 * Picks the source from EXPO_PUBLIC_PREDICTION_MARKETS (see .env.example):
 * - "sample" (default): made-up quotes, labelled as such.
 * - "proxy": our backend at EXPO_PUBLIC_PREDICTION_MARKETS_URL, or the local demo server.
 * - "off": no odds shown.
 */
function createProvider(): PredictionMarketProvider {
  const choice = process.env.EXPO_PUBLIC_PREDICTION_MARKETS ?? 'sample';
  if (choice === 'proxy') return createProxyProvider(process.env.EXPO_PUBLIC_PREDICTION_MARKETS_URL || demoServerUrl());
  if (choice === 'off') return offProvider;
  return createSampleProvider();
}

export const predictionMarkets: PredictionMarketProvider = createProvider();
