import { isBullish, isSpread } from './options';
import type { Bet, ShapeId, StrategyTemplate } from './types';

/**
 * One idea, several shapes. A base template says what the bet is about and
 * where it starts (the bought strike relative to spot). From that, three
 * shapes are derived, so a view always offers more than one way in:
 *
 * - capped: buy one option, sell a further one. Cheapest, fixed maximum.
 * - aggressive: the same spread moved further out. Cheaper, bigger multiple,
 *   lower odds.
 * - uncapped: just the bought option. Costs more, no ceiling.
 *
 * Shapes are priced and filtered like any bet (asymmetry, budget, horizon),
 * so a shape that doesn't pay 3x today simply isn't shown.
 */

export interface Shape {
  id: ShapeId;
  label: string;
  description: string;
}

export const SHAPES: Shape[] = [
  { id: 'capped', label: 'Capped', description: 'Buy one option, sell a further one. Cheapest; pays up to a fixed maximum.' },
  { id: 'aggressive', label: 'Aggressive', description: 'The same spread, further out. Cheaper, a bigger multiple, lower odds.' },
  { id: 'uncapped', label: 'No cap', description: 'Just the bought option. Costs more; no ceiling on what it can be worth.' },
];

export const SHAPE_LABELS: Record<ShapeId, string> = Object.fromEntries(SHAPES.map((s) => [s.id, s.label])) as Record<ShapeId, string>;

/** Separates a base id from a shape in a derived bet's id: "oil-calls~aggressive". */
export const SHAPE_SEPARATOR = '~';

/** How much further out (as a fraction of spot) the aggressive shape starts. */
export const AGGRESSIVE_STEP = 0.12;
/** Spread width when the base is a long option and has none. */
export const DEFAULT_WIDTH = 0.05;

/** The shape a template is already written in. */
export function shapeOf(template: Pick<StrategyTemplate, 'kind'>): ShapeId {
  return isSpread(template.kind) ? 'capped' : 'uncapped';
}

const round = (x: number) => Math.round(x * 1000) / 1000;

/** The template for a shape, derived from the base's direction, bought strike and width. */
export function shapeTemplate(base: StrategyTemplate, shape: ShapeId): StrategyTemplate {
  const up = isBullish(base.kind);
  const sign = up ? 1 : -1;
  const buy = base.buyStrike;
  const width = base.sellStrike !== undefined ? Math.abs(base.sellStrike - buy) : DEFAULT_WIDTH;
  const common = { underlying: base.underlying, underlyingName: base.underlyingName, minDays: base.minDays };
  switch (shape) {
    case 'uncapped':
      return { ...common, kind: up ? 'long_call' : 'long_put', buyStrike: buy };
    case 'capped':
      return { ...common, kind: up ? 'call_debit_spread' : 'put_debit_spread', buyStrike: buy, sellStrike: round(buy + sign * width) };
    case 'aggressive': {
      const far = round(buy + sign * AGGRESSIVE_STEP);
      return { ...common, kind: up ? 'call_debit_spread' : 'put_debit_spread', buyStrike: far, sellStrike: round(far + sign * width) };
    }
  }
}

export function parseShapeId(id: string): { baseId: string; shape?: ShapeId } {
  const at = id.lastIndexOf(SHAPE_SEPARATOR);
  if (at < 0) return { baseId: id };
  const shape = id.slice(at + 1);
  return SHAPES.some((s) => s.id === shape) ? { baseId: id.slice(0, at), shape: shape as ShapeId } : { baseId: id };
}

/** The base bet in a given shape. The base's own shape is the base itself (same id). */
export function shapedBet(base: Bet, shape: ShapeId): Bet {
  if (shape === shapeOf(base.strategy)) return base;
  return {
    ...base,
    id: `${base.id}${SHAPE_SEPARATOR}${shape}`,
    shape: { id: shape, baseId: base.id },
    strategy: shapeTemplate(base.strategy, shape),
  };
}

/** Every shape of an idea, the base's own first. */
export function ladder(base: Bet): Bet[] {
  const own = shapeOf(base.strategy);
  return [base, ...SHAPES.filter((s) => s.id !== own).map((s) => shapedBet(base, s.id))];
}
