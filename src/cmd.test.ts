import { Cmd, Cmds } from './cmd';
import { actionCreator, effect } from './functions';

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

type OuterAction = { type: 'OUTER'; action: SubAction; taggerExtra: string };

function taggerFunc(action: SubAction, taggerExtra: string): OuterAction {
  return {
    type: 'OUTER',
    action,
    taggerExtra,
  };
}

describe('run', () => {
  test('without options', () => {
    const cmd = Cmd.run(effect(doEffect, 'hello world'));
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
      Cmd.run(effect(doEffect, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
        fail: actionCreator(onFail, 'extra'),
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

describe('action', () => {
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

describe('fmap', () => {
  test('over action', () => {
    expect(
      Cmd.fmap(taggerFunc, Cmd.action({ type: 'INNER' }), 'extra')
    ).toEqual({
      type: 'ACTION',
      name: 'taggerFunc -> INNER',
      actionToDispatch: {
        type: 'OUTER',
        action: {
          type: 'INNER',
        },
        taggerExtra: 'extra',
      },
    });
  });

  test('over run', () => {
    expect(
      Cmd.fmap(
        taggerFunc,
        Cmd.run(effect(doEffect, 'hello world'), {
          success: actionCreator(onSuccess, 'extra'),
          fail: actionCreator(onFail, 'extra'),
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
    expect(
      Cmd.fmap(
        taggerFunc,
        Cmd.run(effect(doEffect, 'hello world'), {
          fail: actionCreator(onFail, 'extra'),
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

describe('list.fmap', () => {
  test('over action', () => {
    expect(
      Cmds.fmap(taggerFunc, [Cmd.action({ type: 'INNER' })], 'tagExtra')
    ).toEqual([
      {
        type: 'ACTION',
        name: 'taggerFunc -> INNER',
        actionToDispatch: {
          type: 'OUTER',
          taggerExtra: 'tagExtra',
          action: {
            type: 'INNER',
          },
        },
      },
    ]);
  });

  test('over run', () => {
    expect(
      Cmds.fmap(
        taggerFunc,
        [
          Cmd.run(effect(doEffect, 'hello world'), {
            success: actionCreator(onSuccess, 'extra'),
            fail: actionCreator(onFail, 'extra'),
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

describe('execute', () => {
  test('action', async () => {
    const a = await Cmd.execute(Cmd.action({ type: 'SOMETHING' }));

    expect(a).toEqual({ type: 'SOMETHING' });
  });

  test('run succeeds without action creators', async () => {
    const data = await Cmd.execute(Cmd.run(effect(doEffect, 'hello world')));

    expect(data).toEqual(undefined);
  });

  test('run succeeds with success/fail action creators', async () => {
    const data = await Cmd.execute(
      Cmd.run(effect(doEffect, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
        fail: actionCreator(onFail, 'extra'),
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
      Cmd.run(effect(doEffectFail, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
        fail: actionCreator(onFail, 'extra'),
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
      Cmd.run(effect(doEffectThrow, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
        fail: actionCreator(onFail, 'extra'),
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
    Cmd.execute(Cmd.run(effect(doEffectFail, 'hello world'))).then(result =>
      expect(result).toBe(undefined)
    );
  });

  test('tagged run succeeds with success/fail action creators', async () => {
    const taggedCmd = Cmd.fmap(
      taggerFunc,
      Cmd.run(effect(doEffect, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
      }),
      'tagExtra'
    );

    const taggedData = await Cmd.execute(taggedCmd);

    expect(taggedData).toEqual({
      type: 'OUTER',
      taggerExtra: 'tagExtra',
      action: {
        type: 'SUCCESS',
        name: 'hello world',
        extra: 'extra',
      },
    });
  });

  test('tagged run fails with success/fail action creators', async () => {
    const taggedCmdFail = Cmd.fmap(
      taggerFunc,
      Cmd.run(effect(doEffectFail, 'hello world'), {
        success: actionCreator(onSuccess, 'extra'),
        fail: actionCreator(onFail, 'extra'),
      }),
      'tagExtra'
    );

    const taggedFailData = await Cmd.execute(taggedCmdFail);

    expect(taggedFailData).toEqual({
      type: 'OUTER',
      taggerExtra: 'tagExtra',
      action: {
        type: 'FAIL',
        errorMessage: 'Failed - hello world',
        extra: 'extra',
      },
    });
  });
});
