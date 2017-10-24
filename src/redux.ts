import {
  Action,
  createStore as originalCreateStore,
  StoreEnhancerStoreCreator,
} from 'redux';
import { Runtime } from './runtime';
import { Commands, TeaReducer, TeaStoreEnhancer, Store } from './types';

export function createEnhancer<S, A extends Action, D>(
  runtime: Runtime<S, A, D>
): TeaStoreEnhancer<S, A, D> {
  return (next: StoreEnhancerStoreCreator<S>) => (
    reducer: TeaReducer<S, A, D>,
    [initialModel, initialCmds]: [S, Commands<A, any>]
  ): Store<S, A> => {
    const store = next(runtime.liftReducer(reducer), initialModel);

    const dispatch = (action: A) => {
      store.dispatch(action);
      return runtime.runAll(runtime.dequeueAll());
    };

    const replaceReducer = (reducer: TeaReducer<S, A, D>) => {
      return store.replaceReducer(runtime.liftReducer(reducer));
    };

    runtime.init(dispatch, { cmds: initialCmds });

    return {
      ...store,
      dispatch,
      replaceReducer,
    } as any;
  };
}

export function createStore<S, A extends Action, D>(
  reducer: TeaReducer<S, A, D>,
  preloadedState: [S, Commands<A, any>],
  enhancer: TeaStoreEnhancer<S, A, D>
): Store<S, A> {
  return originalCreateStore(
    reducer as any,
    preloadedState,
    enhancer as any
  ) as any;
}
