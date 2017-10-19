import { install, createStore, Cmd, CmdType } from './index';

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
  action: CounterAction
): [CounterState, CmdType<CounterAction>[], CounterInfo | null] {
  switch (action.type) {
    case 'Increment': {
      const counter = state.counter + 1;
      return [
        { ...state, counter },
        [
          Cmd.run(Cmd.fn(doConvert, counter), {
            success: Cmd.fn(update),
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
          Cmd.run(Cmd.fn(doConvert, counter), {
            success: Cmd.fn(update),
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

function reducer(
  state: State = initialState,
  action: Action
): [State, CmdType<Action>[]] {
  switch (action.type) {
    case '@@redux/INIT': {
      return [state, []];
    }
    case 'Single': {
      const [subState, subCmds, subInfo] = counterReducer(
        state.singleCounter,
        action.subAction
      );
      return [
        {
          ...state,
          singleCounter: subState,
          totalCount: state.totalCount + (subInfo ? subInfo.current : 0),
        },
        [...Cmd.map(tagSingle, subCmds)],
      ];
    }
    case 'Double': {
      const [subState, subCmds, subInfo] = counterReducer(
        state.doubleCounter,
        action.subAction
      );
      return [
        {
          ...state,
          doubleCounter: subState,
          totalCount: state.totalCount + (subInfo ? subInfo.current : 0),
        },
        [...Cmd.map(tagDouble, subCmds)],
      ];
    }
  }
}

function doConvert(n: number): Promise<string> {
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

describe(`install integration`, () => {
  test('kitchen sink', async () => {
    expect.assertions(1);

    const { enhancer } = install();

    const store = createStore(reducer, initialState, enhancer);

    await store.dispatch(tagSingle(increment())); // single: 1
    await store.dispatch(tagSingle(increment())); // single: 2
    await store.dispatch(tagSingle(decrement())); // single: 1
    await store.dispatch(tagDouble(increment())); // double: 1
    await store.dispatch(tagDouble(decrement())); // double: 0
    await store.dispatch(tagDouble(decrement())); // double: -1

    expect(store.getState()).toEqual({
      totalCount: 4,
      singleCounter: { counter: 1, comment: 'one' },
      doubleCounter: { counter: -1, comment: 'neg one' },
    });
  });
});
