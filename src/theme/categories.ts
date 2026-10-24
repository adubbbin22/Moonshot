import type { Category, StructureKind } from '@/domain/types';

export const CATEGORY_LABELS: Record<Category, string> = {
  tech: 'Tech',
  energy: 'Energy',
  geopolitics: 'Geopolitics',
  macro: 'Macro',
  health: 'Health',
  space: 'Space',
};

export const STRUCTURE_LABELS: Record<StructureKind, string> = {
  long_call: 'Call option',
  long_put: 'Put option',
  call_debit_spread: 'Call spread',
  put_debit_spread: 'Put spread',
};

/** One-line, plain-English explainer shown on the bet screen. */
export const STRUCTURE_EXPLAINERS: Record<StructureKind, string> = {
  long_call:
    'You buy the right to buy the stock at the strike price. It pays if the stock finishes above the strike plus what you paid. No cap on the upside.',
  long_put:
    'You buy the right to sell the stock at the strike price. It pays if the stock finishes below the strike minus what you paid.',
  call_debit_spread:
    'You buy a call and sell a higher one to make it cheaper. It pays if the stock rises, up to a fixed maximum.',
  put_debit_spread:
    'You buy a put and sell a lower one to make it cheaper. It pays if the stock falls, up to a fixed maximum.',
};
