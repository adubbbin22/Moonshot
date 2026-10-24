import { createProxyProvider } from './proxy';
import { createSampleProvider } from './sample';
import type { FundamentalsProvider } from './types';
import { demoServerUrl } from '@/services/demoServer';

export type { FundamentalsProvider } from './types';

const offProvider: FundamentalsProvider = {
  id: 'off',
  label: 'Off',
  async getCompany() {
    return undefined;
  },
};

/**
 * Picks the source from EXPO_PUBLIC_FUNDAMENTALS (see .env.example):
 * - "sample" (default): rounded, made-up figures, labelled as such.
 * - "proxy": our backend at EXPO_PUBLIC_FUNDAMENTALS_URL, or the local demo server.
 * - "off": no company information shown.
 */
function createProvider(): FundamentalsProvider {
  const choice = process.env.EXPO_PUBLIC_FUNDAMENTALS ?? 'sample';
  if (choice === 'proxy') return createProxyProvider(process.env.EXPO_PUBLIC_FUNDAMENTALS_URL || demoServerUrl());
  if (choice === 'off') return offProvider;
  return createSampleProvider();
}

export const fundamentals: FundamentalsProvider = createProvider();
