import { createAlpacaProvider } from './alpaca';
import { createProxyProvider } from './proxy';
import { createSyntheticProvider } from './synthetic';
import type { MarketDataProvider } from './types';

export type { MarketDataProvider } from './types';

/**
 * Picks the market data source from EXPO_PUBLIC_MARKET_DATA (see .env.example):
 * - "synthetic" (default): made-up chains, no keys needed.
 * - "proxy": our backend at EXPO_PUBLIC_MARKET_DATA_URL. The production path.
 * - "alpaca": straight to Alpaca with keys from the env. Development only,
 *   because EXPO_PUBLIC_ values are compiled into the app bundle.
 */
function createProvider(): MarketDataProvider {
  const choice = process.env.EXPO_PUBLIC_MARKET_DATA ?? 'synthetic';

  if (choice === 'proxy') {
    const url = process.env.EXPO_PUBLIC_MARKET_DATA_URL;
    if (url) return createProxyProvider(url);
    console.warn('EXPO_PUBLIC_MARKET_DATA=proxy but EXPO_PUBLIC_MARKET_DATA_URL is not set. Using synthetic data.');
  }

  if (choice === 'alpaca') {
    const keyId = process.env.EXPO_PUBLIC_ALPACA_KEY_ID;
    const secretKey = process.env.EXPO_PUBLIC_ALPACA_SECRET_KEY;
    if (!__DEV__) {
      console.warn('Direct Alpaca access is disabled outside development builds. Using synthetic data.');
    } else if (keyId && secretKey) {
      const feed = process.env.EXPO_PUBLIC_ALPACA_FEED === 'opra' ? 'opra' : 'indicative';
      return createAlpacaProvider({ keyId, secretKey, feed });
    } else {
      console.warn('EXPO_PUBLIC_MARKET_DATA=alpaca but Alpaca keys are missing. Using synthetic data.');
    }
  }

  return createSyntheticProvider();
}

export const marketData: MarketDataProvider = createProvider();
