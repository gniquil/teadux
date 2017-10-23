import { Action } from 'redux';

export interface TeaReducer<S, A extends Action> {
  (state: S | undefined, action: A, dispatch: Dispatch<A>): [
    S,
    CmdType<A, any>[]
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

export type CmdType<A extends Action, R> = ActionCmd<A> | RunCmd<A, R>;

export type ActionCmd<A extends Action> = {
  type: 'ACTION';
  actionToDispatch: A;
  name: string;
};

export type RunCmd<A extends Action, R> = {
  type: 'RUN';
  name: string;
  effect: Effect<R>;
  fail?: ActionCreator<A, any>;
  success?: ActionCreator<A, R>;
};

export type Dispatch<A> = (action: A) => void;
