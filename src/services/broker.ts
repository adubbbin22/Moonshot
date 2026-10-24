/**
 * Order execution. Every bet goes through a Broker so real-money execution
 * can be added later without touching screens.
 *
 * Today only the paper broker exists: orders are simulated and filled
 * immediately. A live implementation would wrap a brokerage API (see
 * docs/ARCHITECTURE.md) and must only be enabled once the regulatory setup
 * is in place.
 */

export interface OrderRequest {
  betId: string;
  /** Dollars to commit. Also the maximum possible loss. */
  stake: number;
}

export type OrderResult =
  | { status: 'filled'; orderId: string; filledAt: string }
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
    if (order.stake <= 0) return { status: 'rejected', reason: 'Stake must be positive.' };
    return { status: 'filled', orderId: createId('paper'), filledAt: new Date().toISOString() };
  },
};
