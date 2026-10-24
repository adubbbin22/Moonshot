import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import { checkStake } from '@/domain/sizing';
import type { Position, PositionSource, Profile, SavedThesis } from '@/domain/types';
import { createId, paperBroker, type Broker } from '@/services/broker';

/**
 * App state: the user's profile, open bets and saved theses.
 *
 * Held in memory for now. Persisting it (device storage, then the backend
 * once accounts exist) is a drop-in change inside this module.
 */

export interface AppState {
  profile: Profile;
  positions: Position[];
  theses: SavedThesis[];
}

export type Action =
  | { type: 'completeOnboarding'; monthlyBudget: number; acceptedAt: string }
  | { type: 'setMonthlyBudget'; monthlyBudget: number }
  | { type: 'addPosition'; position: Position }
  | { type: 'saveThesis'; thesis: SavedThesis }
  | { type: 'reset' };

export const initialState: AppState = {
  profile: { onboarded: false, monthlyBudget: 100, maxPerBetPct: 0.25 },
  positions: [],
  theses: [],
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'completeOnboarding':
      return {
        ...state,
        profile: {
          ...state.profile,
          onboarded: true,
          monthlyBudget: action.monthlyBudget,
          acceptedDisclaimerAt: action.acceptedAt,
        },
      };
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
  stake: number;
  thesis: string;
  source: PositionSource;
}

export type PlaceBetResult = { ok: true; position: Position } | { ok: false; reason: string };

/** Validates a stake against the user's budget, sends it to the broker and records it. */
export function usePlaceBet(broker: Broker = paperBroker) {
  const { profile, positions } = useAppState();
  const dispatch = useAppDispatch();

  return useCallback(
    async (input: PlaceBetInput): Promise<PlaceBetResult> => {
      const check = checkStake(input.stake, profile, positions, new Date());
      if (!check.ok) return check;

      const result = await broker.placeOrder({ betId: input.betId, stake: input.stake });
      if (result.status === 'rejected') return { ok: false, reason: result.reason };

      const position: Position = {
        id: result.orderId,
        betId: input.betId,
        stake: input.stake,
        placedAt: result.filledAt,
        thesis: input.thesis.trim(),
        source: input.source,
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
