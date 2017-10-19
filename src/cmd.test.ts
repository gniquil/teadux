import { Cmd } from './cmd';

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

type SubAction = { type: 'INNER'; name: string };

type OuterAction = { type: 'OUTER'; subAction: SubAction };

function taggerFunc(subAction: SubAction): OuterAction {
  return {
    type: 'OUTER',
    subAction,
  };
}

function onSubActionSuccess(name: string): SubAction {
  return { type: 'INNER', name };
}

test('Cmd.tag', () => {
  expect(Cmd.tag(taggerFunc, Cmd.action({ type: 'INNER' }))).toEqual({
    type: 'TAG',
    name: 'taggerFunc',
    tagger: taggerFunc,
    nestedCmd: {
      type: 'ACTION',
      name: 'INNER',
      actionToDispatch: {
        type: 'INNER',
      },
    },
  });

  expect(
    Cmd.tag(
      taggerFunc,
      Cmd.run(Cmd.fn(effect1, 'hello world'), {
        success: Cmd.fn(onSubActionSuccess),
        fail: Cmd.fn(onSubActionSuccess),
      })
    )
  ).toEqual({
    type: 'TAG',
    name: 'taggerFunc',
    tagger: taggerFunc,
    nestedCmd: {
      type: 'RUN',
      effect: {
        name: 'effect1',
        func: effect1,
        args: ['hello world'],
      },
      success: {
        name: 'onSubActionSuccess',
        func: onSubActionSuccess,
        args: [],
      },
      fail: {
        name: 'onSubActionSuccess',
        func: onSubActionSuccess,
        args: [],
      },
    },
  });
});

test('Cmd.map', () => {
  expect(Cmd.map(taggerFunc, [Cmd.action({ type: 'INNER' })])).toEqual([
    {
      type: 'TAG',
      name: 'taggerFunc',
      tagger: taggerFunc,
      nestedCmd: {
        type: 'ACTION',
        name: 'INNER',
        actionToDispatch: {
          type: 'INNER',
        },
      },
    },
  ]);

  expect(
    Cmd.map(taggerFunc, [
      Cmd.run(Cmd.fn(effect1, 'hello world'), {
        success: Cmd.fn(onSubActionSuccess),
        fail: Cmd.fn(onSubActionSuccess),
      }),
    ])
  ).toEqual([
    {
      type: 'TAG',
      name: 'taggerFunc',
      tagger: taggerFunc,
      nestedCmd: {
        type: 'RUN',
        effect: {
          name: 'effect1',
          func: effect1,
          args: ['hello world'],
        },
        success: {
          name: 'onSubActionSuccess',
          func: onSubActionSuccess,
          args: [],
        },
        fail: {
          name: 'onSubActionSuccess',
          func: onSubActionSuccess,
          args: [],
        },
      },
    },
  ]);
});

function onEffect1Success(name: string) {
  return { type: 'SUCCESS', name };
}

test('Cmd.execute', async () => {
  expect.assertions(2);

  const data = await Cmd.execute(
    Cmd.run(Cmd.fn(effect1, 'hello world'), {
      success: Cmd.fn(onEffect1Success),
    })
  );
  expect(data).toEqual({ type: 'SUCCESS', name: 'hello world' });

  const taggedCmd = Cmd.tag(
    taggerFunc,
    Cmd.run(Cmd.fn(effect1, 'hello world'), {
      success: Cmd.fn(onSubActionSuccess),
    })
  );
  const taggedData = await Cmd.execute(taggedCmd);
  expect(taggedData).toEqual({
    type: 'OUTER',
    subAction: {
      type: 'INNER',
      name: 'hello world',
    },
  });
});
