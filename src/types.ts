import { Action, StoreEnhancerStoreCreator, Reducer } from 'redux';

export interface TeaReducer<S, A extends Action, D = {}> {
  (state: S | undefined, action: A, dependencies: D, dispatch: Dispatch<A>): [
    S,
    Command<A, any>[]
  ];
}

export type ActionCreator<A, R> = {
  name: string;
  func: (result: R, ...args: any[]) => A;
  args: any[];
  nested?: ActionCreator<R, any>;
};

export type Effect<R> = {
  name: string;
  func: (...args: any[]) => Promise<R>;
  args: any[];
};

export type Command<A extends Action, R> = ActionCommand<A> | RunCommand<A, R>;
export type Commands<A extends Action, R> = Command<A, R>[];

export type ActionCommand<A extends Action> = {
  type: 'ACTION';
  actionToDispatch: A;
  name: string;
};

export type RunCommand<A extends Action, R> = {
  type: 'RUN';
  name: string;
  effect: Effect<R>;
  fail?: ActionCreator<A, any>;
  success?: ActionCreator<A, R>;
};

export type Dispatch<A> = (action: A) => void;

export interface Store<S, A extends Action> {
  dispatch: Dispatch<A>;
  getState(): S;
  subscribe(listener: () => void): () => void;
  replaceReducer(nextReducer: Reducer<S>): void;
}
export type TeaStoreEnhancer<S, A extends Action, D> = (
  next: StoreEnhancerStoreCreator<S>
) => TeaStoreEnhancerStoreCreator<S, A, D>;

export type TeaStoreEnhancerStoreCreator<S, A extends Action, D> = (
  reducer: TeaReducer<S, A, D>,
  preloadedState: [S, Command<A, any>[]]
) => Store<S, A>;
