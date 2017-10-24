import {
  Runtime,
  createEnhancer,
  createStore,
  Command,
  Cmd,
  Cmds,
  effect,
  actionCreator,
  mcompose,
} from './index';

//#region sample setup

//#region counter definition

type CounterState = {
  counter: number;
  comment: string | null;
};

const initialCounterState: CounterState = { counter: 0, comment: null };

type CounterAction = Increment | Decrement | Update;

type Increment = {
  type: 'Increment';
};

function increment(): CounterAction {
  return { type: 'Increment' };
}

type Decrement = {
  type: 'Decrement';
};

function decrement(): CounterAction {
  return { type: 'Decrement' };
}

type Update = {
  type: 'Update';
  comment: string;
};

function update(comment: string): CounterAction {
  return { type: 'Update', comment };
}

type CounterInfo = {
  current: number;
};

function counterReducer(
  state: CounterState = initialCounterState,
  action: CounterAction,
  { convert: doConvert }: { convert: (n: number) => Promise<string> }
): [CounterState, Command<CounterAction>[], CounterInfo | null] {
  switch (action.type) {
    case 'Increment': {
      const counter = state.counter + 1;
      return [
        { ...state, counter },
        [
          Cmd.run(effect(doConvert, counter), {
            success: actionCreator(update),
          }),
        ],
        { current: counter },
      ];
    }
    case 'Decrement': {
      const counter = state.counter - 1;
      return [
        { ...state, counter },
        [
          Cmd.run(effect(doConvert, counter), {
            success: actionCreator(update),
          }),
        ],
        { current: counter },
      ];
    }
    case 'Update': {
      return [{ ...state, comment: action.comment }, [], null];
    }
  }
}

//#endregion

//#region container definition

type State = {
  totalCount: number;
  singleCounter: CounterState;
  doubleCounter: CounterState;
};

const initialState = {
  totalCount: 0,
  singleCounter: initialCounterState,
  doubleCounter: initialCounterState,
};

type Action = Single | Double | Init;

type Single = {
  type: 'Single';
  subAction: CounterAction;
};

function tagSingle(subAction: CounterAction): Action {
  return { type: 'Single', subAction };
}

type Double = {
  type: 'Double';
  subAction: CounterAction;
};

function tagDouble(subAction: CounterAction): Action {
  return { type: 'Double', subAction };
}

type Init = {
  type: '@@redux/INIT';
};

type Deps = {
  convert: (n: number) => Promise<string>;
};
function reducer(
  state: State = initialState,
  action: Action,
  { convert }: Deps
): [State, Command<Action>[]] {
  switch (action.type) {
    case '@@redux/INIT': {
      return [state, []];
    }
    case 'Single': {
      const [subState, subCmds, subInfo] = counterReducer(
        state.singleCounter,
        action.subAction,
        { convert }
      );
      return [
        {
          ...state,
          singleCounter: subState,
          totalCount: state.totalCount + (subInfo ? subInfo.current : 0),
        },
        [...Cmds.fmap(tagSingle, subCmds)],
      ];
    }
    case 'Double': {
      const [subState, subCmds, subInfo] = counterReducer(
        state.doubleCounter,
        action.subAction,
        { convert }
      );
      return [
        {
          ...state,
          doubleCounter: subState,
          totalCount: state.totalCount + (subInfo ? subInfo.current : 0),
        },
        [...Cmds.fmap(tagDouble, subCmds)],
      ];
    }
  }
}

function convert(n: number): Promise<string> {
  switch (n) {
    case 0:
      return Promise.resolve('zero');
    case 1:
      return Promise.resolve('one');
    case 2:
      return Promise.resolve('two');
    case 3:
      return Promise.resolve('three');
    case 4:
      return Promise.resolve('four');
    case -1:
      return Promise.resolve('neg one');
    case -2:
      return Promise.resolve('neg two');
    case -3:
      return Promise.resolve('neg three');
    case -4:
      return Promise.resolve('neg four');
    default:
      return Promise.resolve('what?');
  }
}

//#endregion

//#endregion

describe('redux integration', () => {
  test('kitchen sink', async () => {
    const runtime = new Runtime<State, Action, Deps>({ convert });

    const store = createStore(
      reducer,
      [initialState, []],
      createEnhancer(runtime)
    );

    const incrementSingle = mcompose(store.dispatch, tagSingle, increment);
    const decrementSingle = mcompose(store.dispatch, tagSingle, decrement);
    const incrementDouble = mcompose(store.dispatch, tagDouble, increment);
    const decrementDouble = mcompose(store.dispatch, tagDouble, decrement);

    await incrementSingle(); // single: 1
    await incrementSingle(); // single: 2
    await decrementSingle(); // single: 1
    await incrementDouble(); // double: 1
    await decrementDouble(); // double: 0
    await decrementDouble(); // double: -1

    expect(store.getState()).toEqual({
      totalCount: 4,
      singleCounter: { counter: 1, comment: 'one' },
      doubleCounter: { counter: -1, comment: 'neg one' },
    });
  });

  test('kitchen sink with initial commands', async () => {
    const runtime = new Runtime<State, Action, Deps>({ convert });
    const initialCommnds = [Cmd.fmap(tagSingle, Cmd.action(increment()))];

    const store = createStore(
      reducer,
      [initialState, initialCommnds],
      createEnhancer(runtime)
    );

    const incrementSingle = mcompose(store.dispatch, tagSingle, increment);
    const decrementSingle = mcompose(store.dispatch, tagSingle, decrement);
    const incrementDouble = mcompose(store.dispatch, tagDouble, increment);
    const decrementDouble = mcompose(store.dispatch, tagDouble, decrement);

    // await incrementSingle(); // single: 1
    await incrementSingle(); // single: 2
    await decrementSingle(); // single: 1
    await incrementDouble(); // double: 1
    await decrementDouble(); // double: 0
    await decrementDouble(); // double: -1

    expect(store.getState()).toEqual({
      totalCount: 4,
      singleCounter: { counter: 1, comment: 'one' },
      doubleCounter: { counter: -1, comment: 'neg one' },
    });
  });
});
