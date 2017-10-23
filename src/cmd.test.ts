import { Cmd } from './cmd';

function doEffect(name: string): Promise<string> {
  return Promise.resolve(name);
}

function doEffectFail(name: string): Promise<string> {
  return Promise.reject(new Error(`Failed - ${name}`));
}

function doEffectThrow(name: string): Promise<string> {
  throw new Error(`Failed - ${name}`);
}

function onSuccess(name: string, extra: string): SubAction {
  return { type: 'SUCCESS', name, extra };
}

function onFail(error: Error, extra: string): SubAction {
  return { type: 'FAIL', errorMessage: error.message, extra };
}

type SubAction = SuccessAction | FailAction;

type SuccessAction = {
  type: 'SUCCESS';
  name: string;
  extra: string;
};

type FailAction = {
  type: 'FAIL';
  errorMessage: string;
  extra: string;
};

type OuterAction = { type: 'OUTER'; subAction: SubAction; taggerExtra: string };

function taggerFunc(subAction: SubAction, taggerExtra: string): OuterAction {
  return {
    type: 'OUTER',
    subAction,
    taggerExtra,
  };
}

describe('Cmd.run', () => {
  test('without options', () => {
    const cmd = Cmd.run(Cmd.effect(doEffect, 'hello world'));
    expect(cmd).toEqual({
      type: 'RUN',
      name: 'doEffect',
      effect: {
        name: 'doEffect',
        func: doEffect,
        args: ['hello world'],
      },
    });
  });

  test('with options', () => {
    expect(
      Cmd.run(Cmd.effect(doEffect, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
        fail: Cmd.actionCreator(onFail, 'extra'),
      })
    ).toEqual({
      type: 'RUN',
      name: 'doEffect',
      effect: {
        name: 'doEffect',
        func: doEffect,
        args: ['hello world'],
      },
      success: {
        name: 'onSuccess',
        func: onSuccess,
        args: ['extra'],
      },
      fail: {
        name: 'onFail',
        func: onFail,
        args: ['extra'],
      },
    });
  });
});

describe('Cmd.action', () => {
  test('works', () => {
    expect(Cmd.action({ type: 'HELLO' })).toEqual({
      type: 'ACTION',
      name: 'HELLO',
      actionToDispatch: {
        type: 'HELLO',
      },
    });
  });
});

describe('Cmd.tag', () => {
  test('over action', () => {
    expect(
      Cmd.tag(taggerFunc, Cmd.action({ type: 'INNER' }), 'extra')
    ).toEqual({
      type: 'ACTION',
      name: 'taggerFunc -> INNER',
      actionToDispatch: {
        type: 'OUTER',
        subAction: {
          type: 'INNER',
        },
        taggerExtra: 'extra',
      },
    });
  });

  test('over run', () => {
    expect(
      Cmd.tag(
        taggerFunc,
        Cmd.run(Cmd.effect(doEffect, 'hello world'), {
          success: Cmd.actionCreator(onSuccess, 'extra'),
          fail: Cmd.actionCreator(onFail, 'extra'),
        }),
        'tagExtra'
      )
    ).toEqual({
      type: 'RUN',
      name: 'taggerFunc -> doEffect',
      effect: {
        name: 'doEffect',
        func: doEffect,
        args: ['hello world'],
      },
      success: {
        name: 'taggerFunc',
        func: taggerFunc,
        args: ['tagExtra'],
        nested: {
          name: 'onSuccess',
          func: onSuccess,
          args: ['extra'],
        },
      },
      fail: {
        name: 'taggerFunc',
        func: taggerFunc,
        args: ['tagExtra'],
        nested: {
          name: 'onFail',
          func: onFail,
          args: ['extra'],
        },
      },
    });
  });
});

describe('Cmd.map', () => {
  test('over action', () => {
    expect(
      Cmd.map(taggerFunc, [Cmd.action({ type: 'INNER' })], 'tagExtra')
    ).toEqual([
      {
        type: 'ACTION',
        name: 'taggerFunc -> INNER',
        actionToDispatch: {
          type: 'OUTER',
          taggerExtra: 'tagExtra',
          subAction: {
            type: 'INNER',
          },
        },
      },
    ]);
  });

  test('over run', () => {
    expect(
      Cmd.map(
        taggerFunc,
        [
          Cmd.run(Cmd.effect(doEffect, 'hello world'), {
            success: Cmd.actionCreator(onSuccess, 'extra'),
            fail: Cmd.actionCreator(onFail, 'extra'),
          }),
        ],
        'tagExtra'
      )
    ).toEqual([
      {
        type: 'RUN',
        name: 'taggerFunc -> doEffect',
        effect: {
          name: 'doEffect',
          func: doEffect,
          args: ['hello world'],
        },
        success: {
          name: 'taggerFunc',
          func: taggerFunc,
          args: ['tagExtra'],
          nested: {
            name: 'onSuccess',
            func: onSuccess,
            args: ['extra'],
          },
        },
        fail: {
          name: 'taggerFunc',
          func: taggerFunc,
          args: ['tagExtra'],
          nested: {
            name: 'onFail',
            func: onFail,
            args: ['extra'],
          },
        },
      },
    ]);
  });
});

describe('Cmd.execute', () => {
  test('action', async () => {
    const action = await Cmd.execute(Cmd.action({ type: 'SOMETHING' }));

    expect(action).toEqual({ type: 'SOMETHING' });
  });

  test('run succeeds without action creators', async () => {
    const data = await Cmd.execute(
      Cmd.run(Cmd.effect(doEffect, 'hello world'))
    );

    expect(data).toEqual(undefined);
  });

  test('run succeeds with success/fail action creators', async () => {
    const data = await Cmd.execute(
      Cmd.run(Cmd.effect(doEffect, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
        fail: Cmd.actionCreator(onFail, 'extra'),
      })
    );

    expect(data).toEqual({
      type: 'SUCCESS',
      name: 'hello world',
      extra: 'extra',
    });
  });

  test('run fails with success/fail action creators', async () => {
    const data = await Cmd.execute(
      Cmd.run(Cmd.effect(doEffectFail, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
        fail: Cmd.actionCreator(onFail, 'extra'),
      })
    );

    expect(data).toEqual({
      type: 'FAIL',
      errorMessage: 'Failed - hello world',
      extra: 'extra',
    });
  });

  test('run throws with success/fail action creators', async () => {
    const data = await Cmd.execute(
      Cmd.run(Cmd.effect(doEffectThrow, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
        fail: Cmd.actionCreator(onFail, 'extra'),
      })
    );

    expect(data).toEqual({
      type: 'FAIL',
      errorMessage: 'Failed - hello world',
      extra: 'extra',
    });
  });

  test('run fails without success/fail action creators', () => {
    expect.assertions(1);
    Cmd.execute(Cmd.run(Cmd.effect(doEffectFail, 'hello world'))).then(result =>
      expect(result).toBe(undefined)
    );
  });

  test('tagged run succeeds with success/fail action creators', async () => {
    const taggedCmd = Cmd.tag(
      taggerFunc,
      Cmd.run(Cmd.effect(doEffect, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
      }),
      'tagExtra'
    );

    const taggedData = await Cmd.execute(taggedCmd);

    expect(taggedData).toEqual({
      type: 'OUTER',
      taggerExtra: 'tagExtra',
      subAction: {
        type: 'SUCCESS',
        name: 'hello world',
        extra: 'extra',
      },
    });
  });

  test('tagged run fails with success/fail action creators', async () => {
    const taggedCmdFail = Cmd.tag(
      taggerFunc,
      Cmd.run(Cmd.effect(doEffectFail, 'hello world'), {
        success: Cmd.actionCreator(onSuccess, 'extra'),
        fail: Cmd.actionCreator(onFail, 'extra'),
      }),
      'tagExtra'
    );

    const taggedFailData = await Cmd.execute(taggedCmdFail);

    expect(taggedFailData).toEqual({
      type: 'OUTER',
      taggerExtra: 'tagExtra',
      subAction: {
        type: 'FAIL',
        errorMessage: 'Failed - hello world',
        extra: 'extra',
      },
    });
  });
});
