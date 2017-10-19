import {
  Action,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  Reducer,
  Store,
  createStore as originalCreateStore,
} from 'redux';
import { Runtime } from './runtime';
import { CmdType, TeaReducer } from './types';

export const install = <S, A extends Action>(
  providedRuntime?: Runtime<S, A>
): { runtime: Runtime<S, A>; enhancer: StoreEnhancer<S> } => {
  const runtime: Runtime<S, A> = providedRuntime
    ? providedRuntime
    : new Runtime();
  return {
    runtime,
    enhancer: (next: StoreEnhancerStoreCreator<S>) => (
      reducer: Reducer<S>,
      preloadedState?: S | [S, CmdType<A>[]]
    ): Store<S> => {
      let initialModel: S | undefined = undefined;
      let initialCmds: CmdType<A>[] = [];

      if (preloadedState) {
        if (preloadedState['length'] === 2) {
          initialModel = preloadedState[0];
          initialCmds = preloadedState[1];
        } else {
          initialModel = preloadedState as S;
        }
      }

      const store = next(runtime.liftReducer(reducer), initialModel);

      const dispatch = (action: A) => {
        store.dispatch(action);
        return runtime.runAll(runtime.dequeueAll());
      };

      const replaceReducer = (reducer: Reducer<S>) => {
        return store.replaceReducer(runtime.liftReducer(reducer));
      };

      runtime.init(dispatch, { cmds: initialCmds });

      return {
        ...store,
        dispatch,
        replaceReducer,
      } as any;
    },
  };
};

export function createStore<S, A extends Action>(
  reducer: TeaReducer<S, A>,
  preloadedState: S,
  enhancer?: StoreEnhancer<S>
): Store<S> {
  return originalCreateStore(reducer as any, preloadedState, enhancer);
}
