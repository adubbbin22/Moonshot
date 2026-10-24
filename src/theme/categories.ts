import type { Category, InstrumentKind } from '@/domain/types';

export const CATEGORY_LABELS: Record<Category, string> = {
  tech: 'Tech',
  energy: 'Energy',
  geopolitics: 'Geopolitics',
  macro: 'Macro',
  health: 'Health',
  space: 'Space',
};

export const INSTRUMENT_LABELS: Record<InstrumentKind, string> = {
  stock: 'Stock',
  etf: 'Fund',
  call_option: 'Call option',
  put_option: 'Put option',
};
