import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import { CONTRACT_MULTIPLIER, isBullish } from '@/domain/options';
import { checkStake } from '@/domain/sizing';
import type { PricedStrategy } from '@/domain/strategy';
import type { Call, Category, Position, PositionSource, Profile, SavedThesis } from '@/domain/types';
import { createId, paperBroker, type Broker } from '@/services/broker';

/**
 * App state: the user's profile, calls, open bets and saved theses.
 *
 * Held in memory for now. Persisting it (device storage, then the backend
 * once accounts exist) is a drop-in change inside this module.
 */

export interface AppState {
  profile: Profile;
  /** One call per question; a new call on the same question replaces the old one. */
  calls: Call[];
  /** Questions the user skipped ("no take"). */
  skips: string[];
  /** Topics picked on the welcome screen, used to seed the first questions. */
  seedTopics: Category[];
  positions: Position[];
  theses: SavedThesis[];
  /** Screen to open once onboarding completes (the navigator lands on the feed first). */
  pendingLanding?: 'takes';
}

export type Action =
  | { type: 'setSeedTopics'; topics: Category[] }
  | { type: 'makeCall'; call: Call }
  | { type: 'skipQuestion'; questionId: string }
  | { type: 'completeOnboarding'; monthlyBudget: number; acceptedAt: string; landing?: 'takes' }
  | { type: 'clearLanding' }
  | { type: 'setMonthlyBudget'; monthlyBudget: number }
  | { type: 'addPosition'; position: Position }
  | { type: 'saveThesis'; thesis: SavedThesis }
  | { type: 'reset' };

export const initialState: AppState = {
  profile: { onboarded: false, monthlyBudget: 500, maxPerBetPct: 0.3 },
  calls: [],
  skips: [],
  seedTopics: [],
  positions: [],
  theses: [],
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setSeedTopics':
      return { ...state, seedTopics: action.topics };
    case 'makeCall':
      return {
        ...state,
        calls: [...state.calls.filter((c) => c.questionId !== action.call.questionId), action.call],
        skips: state.skips.filter((id) => id !== action.call.questionId),
      };
    case 'skipQuestion':
      return state.skips.includes(action.questionId)
        ? state
        : { ...state, skips: [...state.skips, action.questionId] };
    case 'completeOnboarding':
      return {
        ...state,
        pendingLanding: action.landing,
        profile: {
          ...state.profile,
          onboarded: true,
          monthlyBudget: action.monthlyBudget,
          acceptedDisclaimerAt: action.acceptedAt,
        },
      };
    case 'clearLanding':
      return { ...state, pendingLanding: undefined };
    case 'setMonthlyBudget':
      return { ...state, profile: { ...state.profile, monthlyBudget: action.monthlyBudget } };
    case 'addPosition':
      return { ...state, positions: [action.position, ...state.positions] };
    case 'saveThesis':
      return { ...state, theses: [action.thesis, ...state.theses] };
    case 'reset':
      return initialState;
  }
}

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(StateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}

export function useAppDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('useAppDispatch must be used inside AppStateProvider');
  return dispatch;
}

export interface PlaceBetInput {
  betId: string;
  priced: PricedStrategy;
  contracts: number;
  thesis: string;
  source: PositionSource;
}

export type PlaceBetResult = { ok: true; position: Position } | { ok: false; reason: string };

/** Validates the cost against the user's budget, sends a limit order to the broker and records it. */
export function usePlaceBet(broker: Broker = paperBroker) {
  const { profile, positions } = useAppState();
  const dispatch = useAppDispatch();

  return useCallback(
    async ({ betId, priced, contracts, thesis, source }: PlaceBetInput): Promise<PlaceBetResult> => {
      const check = checkStake(priced.costPerContract * contracts, profile, positions, new Date());
      if (!check.ok) return check;

      const result = await broker.placeOrder({
        betId,
        contracts,
        limitDebit: priced.debit,
        legs: priced.legs.map((l) => ({ symbol: l.symbol, action: l.action, ratio: 1 })),
      });
      if (result.status === 'rejected') return { ok: false, reason: result.reason };

      const buyStrike = priced.legs.find((l) => l.action === 'buy')!.strike;
      const position: Position = {
        id: result.orderId,
        betId,
        underlying: priced.underlying,
        kind: priced.kind,
        expiration: priced.expiration,
        legs: priced.legs.map(({ action, type, strike, symbol }) => ({ action, type, strike, symbol })),
        contracts,
        costPerContract: result.fillDebit * CONTRACT_MULTIPLIER,
        maxValuePerContract: priced.maxValuePerContract,
        breakeven: isBullish(priced.kind) ? buyStrike + result.fillDebit : buyStrike - result.fillDebit,
        placedAt: result.filledAt,
        thesis: thesis.trim(),
        source,
        status: 'open',
      };
      dispatch({ type: 'addPosition', position });
      return { ok: true, position };
    },
    [broker, profile, positions, dispatch],
  );
}

export function useSaveThesis() {
  const dispatch = useAppDispatch();
  return useCallback(
    (thesis: Omit<SavedThesis, 'id' | 'createdAt'>): SavedThesis => {
      const saved: SavedThesis = {
        ...thesis,
        id: createId('thesis'),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'saveThesis', thesis: saved });
      return saved;
    },
    [dispatch],
  );
}
