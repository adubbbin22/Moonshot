import type { LegAction } from '@/domain/types';

/**
 * Order execution. Every bet goes through a Broker so real-money execution
 * can be added later without touching screens.
 *
 * Orders are multi-leg limit orders for a net debit, which maps directly to
 * broker APIs that support spreads (e.g. Alpaca's "mleg" order class). Today
 * only the paper broker exists: it fills immediately at the limit. A live
 * broker must only be enabled once the regulatory setup is in place.
 */

export interface OrderLeg {
  /** OCC option symbol. */
  symbol: string;
  action: LegAction;
  /** Contracts of this leg per unit of the spread (1 for everything Moonshot builds). */
  ratio: number;
}

export interface OrderRequest {
  betId: string;
  legs: OrderLeg[];
  contracts: number;
  /** Most you'll pay per share for the whole structure. Max loss = limit x 100 x contracts. */
  limitDebit: number;
}

export type OrderResult =
  | { status: 'filled'; orderId: string; filledAt: string; fillDebit: number }
  | { status: 'rejected'; reason: string };

export interface Broker {
  readonly mode: 'paper' | 'live';
  placeOrder(order: OrderRequest): Promise<OrderResult>;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const paperBroker: Broker = {
  mode: 'paper',
  async placeOrder(order) {
    if (!Number.isInteger(order.contracts) || order.contracts < 1) {
      return { status: 'rejected', reason: 'Buy at least one contract.' };
    }
    if (!(order.limitDebit > 0)) return { status: 'rejected', reason: 'Moonshot only places debit orders.' };
    return {
      status: 'filled',
      orderId: createId('paper'),
      filledAt: new Date().toISOString(),
      fillDebit: order.limitDebit,
    };
  },
};
