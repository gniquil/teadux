# TEADUX

## Overview

- Tea = The Elm Architecture
- Dux = Redux

This is a simple library to provide 3 things:

1. Managing effects
  - Side effects are serialized into "Commands"
  - Commands are easily runnable later and compared against for safe testing

2. Scalability
  - Scale your reducer/actions via `Cmd.map` or `Cmd.tag`, by breaking down reducers
    into fractal pattern. Factal pattern allows one to reason locally, thereby
    easier to scale.
  - Side effects & state are consolidated into reducer files. This overcomes the
    one of the major short comings of `observable` and `saga`.

3. Type safe (as much as possible via typescript)
  - And also nice to have intelli-sense.

## How to use

```ts
import {
  // since reducer is returns state and side effect, need this to type check
  createStore,
  install,
  compose,
  actionSanitizer,
  makeStateSanitizer,
} from 'teadux'

// enhancer enqueues commands from your reducers into your runtime
// runtime executes and dispatches success/fail actions
const { enhancer: teaEnhancer, runtime: teaRuntime } = install();

// with the following you can see a `@@cmds` key in the STATE panel of the
// redux devtool, as well as actions formatted as `POSTS -> NEW_MESSAGE -> SUBMIT`
const composeEnhancers = windowIfDefined.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? windowIfDefined.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        actionSanitizer: actionSanitizer,
        stateSanitizer: makeStateSanitizer(teaRuntime),
      })
    : compose;

const routerMiddleware = ... // react router e.g.

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(teaEnhancer, applyMiddleware(routerMiddleware))
);
```

## Reducer

Reducer in teadux has the following signature:

```ts
export interface TeaReducer<S, A extends Action> {
  (state: S | undefined, action: A, dispatch: Dispatch<A>): [S, CmdType<A>[]];
}

// where
export type Dispatch<A> = (action: A) => void;

export type CmdType<A extends Action> =
  | ActionCmd<A>
  | RunCmd<A>
  | TagCmd<A, AnyAction>;
```

The list of `CmdType<A>` would be something that runs a http request, etc. (Docs to come)

## Example

You can find a full-fledged example [here](https://github.com/gniquil/teadux-example).

### Kitchen sink

The following is an example from `index.test.ts`

```ts
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

```

### Testing

Testing should be easy as side effects are "serialized" into commands with which
you can use "deep equal" tests. Example:

```ts

async function effect1(name: string): Promise<string> {
  return await Promise.resolve(name);
}

function onSuccess(name: string) {
  return { type: 'SUCCESS', name };
}

function onFail(name: string) {
  return { type: 'FAIL', name };
}

test('Cmd.run', () => {
  expect(
    Cmd.run(Cmd.fn(effect1, 'hello world'), {
      success: Cmd.fn(onSuccess),
      fail: Cmd.fn(onFail),
    })
  ).toEqual({
    type: 'RUN',
    effect: {
      name: 'effect1',
      func: effect1,
      args: ['hello world'],
    },
    success: {
      name: 'onSuccess',
      func: onSuccess,
      args: [],
    },
    fail: {
      name: 'onFail',
      func: onFail,
      args: [],
    },
  });
});

test('Cmd.action', () => {
  expect(Cmd.action({ type: 'HELLO' })).toEqual({
    type: 'ACTION',
    name: 'HELLO',
    actionToDispatch: {
      type: 'HELLO',
    },
  });
});

```
