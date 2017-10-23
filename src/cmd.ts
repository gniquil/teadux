import { Action } from 'redux';
import { CmdType, ActionCreator, Effect } from './types';

type RunOptions<A extends Action, R> = {
  fail?: ActionCreator<A, any>;
  success?: ActionCreator<A, R>;
};

function run<A extends Action, R>(
  effect: Effect<R>,
  options: RunOptions<A, R> = {}
): CmdType<A, R> {
  return {
    type: 'RUN',
    name: effect.name,
    effect,
    ...options,
  };
}

function action<A extends Action>(actionToDispatch: A): CmdType<A, any> {
  return {
    type: 'ACTION',
    name: actionToDispatch.type,
    actionToDispatch,
  };
}

function tag<A extends Action, B extends Action>(
  tagger: (subAction: B) => A,
  nestedCmd: CmdType<B, any>
): CmdType<A, any>;
function tag<A extends Action, B extends Action, A1>(
  tagger: (subAction: B, a1: A1) => A,
  nestedCmd: CmdType<B, any>,
  a1: A1
): CmdType<A, any>;
function tag<A extends Action, B extends Action, A1, A2>(
  tagger: (subAction: B, a1: A1, a2: A2) => A,
  nestedCmd: CmdType<B, any>,
  a1: A1,
  a2: A2
): CmdType<A, any>;
function tag<A extends Action, B extends Action, A1, A2, A3>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3) => A,
  nestedCmd: CmdType<B, any>,
  a1: A1,
  a2: A2,
  a3: A3
): CmdType<A, any>;
function tag<A extends Action, B extends Action, A1, A2, A3, A4>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  nestedCmd: CmdType<B, any>,
  a1: A1,
  a2: A2,
  a3: A3,
  a4: A4
): CmdType<A, any>;
function tag() {
  const [tagger, nestedCmd, ...args] = Array.prototype.slice.call(arguments);

  if (nestedCmd.type === 'ACTION') {
    const {} = nestedCmd;
    return {
      ...nestedCmd,
      name: `${tagger.name} -> ${nestedCmd.name}`,
      actionToDispatch: tagger(nestedCmd.actionToDispatch, ...args),
    };
  } else {
    const { success, fail } = nestedCmd;
    return {
      ...nestedCmd,
      name: `${tagger.name} -> ${nestedCmd.name}`,
      success: success
        ? {
            name: tagger.name,
            func: tagger,
            args,
            nested: success,
          }
        : undefined,
      fail: fail
        ? {
            name: tagger.name,
            func: tagger,
            args,
            nested: fail,
          }
        : undefined,
    };
  }
}

function map<A extends Action, B extends Action>(
  tagger: (subAction: B) => A,
  nestedCmds: CmdType<B, any>[]
): CmdType<A, any>[];
function map<A extends Action, B extends Action, A1>(
  tagger: (subAction: B, a1: A1) => A,
  nestedCmds: CmdType<B, any>[],
  a1: A1
): CmdType<A, any>[];
function map<A extends Action, B extends Action, A1, A2>(
  tagger: (subAction: B, a1: A1, a2: A2) => A,
  nestedCmds: CmdType<B, any>[],
  a1: A1,
  a2: A2
): CmdType<A, any>[];
function map<A extends Action, B extends Action, A1, A2, A3>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3) => A,
  nestedCmds: CmdType<B, any>[],
  a1: A1,
  a2: A2,
  a3: A3
): CmdType<A, any>[];
function map<A extends Action, B extends Action, A1, A2, A3, A4>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  nestedCmds: CmdType<B, any>[],
  a1: A1,
  a2: A2,
  a3: A3,
  a4: A4
): CmdType<A, any>[];
function map() {
  const [tagger, nestedCmds, ...args] = Array.prototype.slice.call(arguments);

  return nestedCmds.map((cmd: any) => tag(tagger, cmd, ...args));
}

function execute<A extends Action>(
  cmd: CmdType<A, any>
): Promise<A | null | void> {
  switch (cmd.type) {
    case 'RUN': {
      const success = cmd.success
        ? cmd.success
        : actionCreator((...args: any[]) => {});
      const fail = cmd.fail ? cmd.fail : actionCreator((...args: any[]) => {});
      try {
        return applyEffect(cmd.effect).then(
          result => applyActionCreator(success, result),
          error => applyActionCreator(fail, error)
        );
      } catch (error) {
        return Promise.reject(error).then(null, error => {
          return applyActionCreator(fail, error);
        });
      }
    }
    case 'ACTION': {
      return Promise.resolve(cmd.actionToDispatch);
    }
  }
}

function applyEffect<R>({ args, func }: Effect<R>): Promise<R> {
  return func(...args);
}

function applyActionCreator<R, A>(
  actionCreator: ActionCreator<R, A>,
  arg: A
): R {
  if (actionCreator.nested) {
    const { args, func, nested } = actionCreator;
    return func(applyActionCreator(nested, arg), ...args);
  } else {
    const { args, func } = actionCreator;
    return func(arg, ...args);
  }
}

function effect<R>(func: () => Promise<R>): Effect<R>;
function effect<A1, R>(func: (a1: A1) => Promise<R>, arg: A1): Effect<R>;
function effect<A1, A2, R>(
  func: (a1: A1, a2: A2) => Promise<R>,
  arg1: A1,
  arg2: A2
): Effect<R>;
function effect<A1, A2, A3, R>(
  func: (a1: A1, a2: A2, a3: A3) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3
): Effect<R>;
function effect<A1, A2, A3, A4, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): Effect<R>;
function effect<A1, A2, A3, A4, A5, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): Effect<R>;
function effect() {
  const [func, ...args] = Array.prototype.slice.call(arguments);
  return {
    name: func.name,
    func,
    args,
  };
}

function actionCreator<R, A>(func: (result: R) => A): ActionCreator<A, R>;
function actionCreator<R, A1, A>(
  func: (result: R, a1: A1) => A,
  arg: A1
): ActionCreator<A, R>;
function actionCreator<R, A1, A2, A>(
  func: (result: R, a1: A1, a2: A2) => A,
  arg1: A1,
  arg2: A2
): ActionCreator<A, R>;
function actionCreator<R, A1, A2, A3, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3
): ActionCreator<A, R>;
function actionCreator<R, A1, A2, A3, A4, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): ActionCreator<A, R>;
function actionCreator<R, A1, A2, A3, A4, A5, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): ActionCreator<A, R>;
function actionCreator() {
  const [func, ...args] = Array.prototype.slice.call(arguments);
  return {
    name: func.name,
    func,
    args,
  };
}

export const Cmd = {
  action,
  run,
  tag,
  map,
  execute,
  applyEffect,
  applyActionCreator,
  effect,
  actionCreator,
};
