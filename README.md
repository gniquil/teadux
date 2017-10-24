# TEADUX

## Overview

- Tea = The Elm Architecture
- Dux = Redux

This is a simple library to provide 3 things:

1. Managing effects

  - Side effects are serialized into "Commands"

  - Commands are easily runnable later and compared against for safe testing

2. Scalability

  - Scale your reducer/actions via `Cmd.fmap` or `Cmds.fmap`, by breaking down reducers
    into fractal pattern. Factal pattern allows one to reason locally, thereby
    easier to scale.

  - Side effects & state are consolidated into reducer files. This overcomes the
    one of the major short comings of `redux-observable` and `redux-saga`.

  - Dependencies are declared and passed to your reducer via the `runtime`. This
    reduces dependencies and allows you to reason more locally. In addition,
    mocks for dependencies can be easily passed in during testing to simulate
    side effects.

3. Type safe (as much as possible via typescript)

  - And also nice to have intelli-sense.

This is heavily inspired by `redux-loop` and `Elm`.

## How to use

```ts
import {
  // since reducer is returns state and side effect, need a special `createStore`
  // to type check
  createStore,
  Runtime,
  createEnhancer,
  compose
  actionSanitizer,
  makeStateSanitizer,
} from 'teadux'

// enhancer enqueues commands from your reducers into your runtime
// runtime executes and dispatches success/fail actions
const deps: Deps = { queryData, mutateData }
const teaRuntime = new Runtime<State, Action, Deps>(deps)

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
  composeEnhancers(createEnhancer(teaRuntime>, applyMiddleware(routerMiddleware))
);
```

## Reducer

Reducer in teadux has the following signature:

```ts
export interface TeaReducer<S, A extends Action, D = {}> {
  (state: S | undefined, action: A, dependencies: D, dispatch: Dispatch<A>): [
    S,
    Command<A, any>[]
  ];
}

// where
export type Dispatch<A> = (action: A) => void;

export type Command<A extends Action, R> =
  | ActionCommand<A>
  | RunCommand<A, R>;
```

The list of `Command<A, R>` would be something that runs a http request, etc. (Docs to come)

## Example

You can find a full-fledged example [here](https://github.com/gniquil/teadux-example).

### Kitchen sink

You can also find an example of how this lib works in the `index.test.ts` file.

## Testing

Testing should be easy as side effects are "serialized" into commands with which
you can use "deep equal" tests. Example:

```ts

import { Cmd, actionCreator, effect } from 'teadux'

async function doWork(name: string): Promise<string> {
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
    Cmd.run(effect(doWork, 'hello world'), {
      success: actionCreator(onSuccess),
      fail: actionCreator(onFail),
    })
  ).toEqual({
    type: 'RUN',
    effect: {
      name: 'doWork',
      func: doWork,
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

## Dependencies

In addition, although you may directly reference side effect with `effect`, it
is better to specify them during `runtime` construction. Since root reducer is
passed the dependencies, you can pass mocks during testing.

Finally, being specific about dependencies allows you to do more local reasoning.

## Type safety

TBD