import { Action, AnyAction } from 'redux';

export interface TeaReducer<S, A extends Action> {
  (state: S | undefined, action: A, dispatch: Dispatch<A>): [S, CmdType<A>[]];
}

export type CmdType<A extends Action> =
  | ActionCmd<A>
  | RunCmd<A>
  | TagCmd<A, AnyAction>;

export type AppliedCmdType<A extends Action> = ActionCmd<A> | RunCmd<A>;

export interface ActionCmd<A extends Action> {
  type: 'ACTION';
  actionToDispatch: A;
  name: string;
}

export type Tagger<B extends Action, A extends Action> = (subAction: B) => A;

export interface TagCmd<A extends Action, B extends Action> {
  type: 'TAG';
  tagger: Tagger<B, A>;
  nestedCmd: CmdType<B>;
  name: string;
}

export interface RunCmd<A extends Action> {
  type: 'RUN';
  effect: Callable<any>;
  fail?: Callable<A>;
  success?: Callable<A>;
}

export type Dispatch<A> = (action: A) => void;

export type Callable<R> = {
  name: string;
  func: (...args: any[]) => R;
  args: any[];
};
