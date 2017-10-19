import { Action } from 'redux';
import { CmdType, RunCmd, Tagger, Callable, AppliedCmdType } from './types';

type RunOptions<A extends Action> = {
  fail?: Callable<A>;
  success?: Callable<A>;
};

function run<A extends Action>(
  effect: Callable<Promise<any>>,
  options: RunOptions<A> = {}
): CmdType<A> {
  return {
    type: 'RUN',
    effect,
    ...options,
  };
}

function action<A extends Action>(actionToDispatch: A): CmdType<A> {
  return {
    type: 'ACTION',
    name: actionToDispatch.type,
    actionToDispatch,
  };
}

function tag<A extends Action, B extends Action>(
  tagger: Tagger<B, A>,
  nestedCmd: CmdType<B>,
  name?: string
): CmdType<A> {
  return {
    type: 'TAG',
    name: name ? name : tagger.name,
    tagger,
    nestedCmd,
  };
}

function map<A extends Action, B extends Action>(
  tagger: Tagger<B, A>,
  nestedCmds: CmdType<B>[],
  name?: string
): CmdType<A>[] {
  return nestedCmds.map(cmd => tag(tagger, cmd, name));
}

function executeRun<A extends Action>(
  cmd: RunCmd<A>
): Promise<A | null | void> {
  const success = cmd.success ? cmd.success : fn((...args: any[]) => {});
  const fail = cmd.fail ? cmd.fail : fn((...args: any[]) => {});
  try {
    return Promise.resolve(apply(cmd.effect)).then(
      result =>
        result !== undefined ? apply(success, result) : apply(success),
      error => (error !== undefined ? apply(fail, error) : apply(fail))
    );
  } catch (error) {
    return Promise.resolve(error).then(null, error => {
      return apply(fail, error);
    });
  }
}

function applyMap<A extends Action, B extends Action>(
  cmd: CmdType<B>,
  tagger: Tagger<B, A>,
  name?: string
): AppliedCmdType<A> {
  switch (cmd.type) {
    case 'ACTION': {
      const taggedAction = tagger(cmd.actionToDispatch);
      return {
        ...cmd,
        actionToDispatch: taggedAction,
        name: `${name ? name : tagger.name} -> ${cmd.name}`,
      };
    }
    case 'RUN': {
      const { success, fail } = cmd;
      const taggedSuccess = success
        ? {
            ...success,
            func: (...args: any[]) => tagger(apply(success, ...args)),
            name: `${name ? name : tagger.name} -> ${success.name}`,
          }
        : undefined;

      const taggedFail = fail
        ? {
            ...fail,
            func: (...args: any[]) => tagger(apply(fail, ...args)),
            name: `${name ? name : tagger.name} -> ${fail.name}`,
          }
        : undefined;

      return {
        ...cmd,
        success: taggedSuccess,
        fail: taggedFail,
      };
    }
    case 'TAG': {
      const appliedNestedCmd = applyMap(cmd.nestedCmd, cmd.tagger, cmd.name);
      return applyMap(appliedNestedCmd, tagger, name);
    }
  }
}

function execute<A extends Action>(cmd: CmdType<A>): Promise<A | null | void> {
  switch (cmd.type) {
    case 'RUN': {
      return executeRun(cmd);
    }
    case 'ACTION': {
      return Promise.resolve(cmd.actionToDispatch);
    }
    case 'TAG': {
      const applied = applyMap(cmd.nestedCmd, cmd.tagger, cmd.name);
      if (applied.type === 'ACTION') {
        return Promise.resolve(applied.actionToDispatch);
      } else {
        return executeRun(applied);
      }
    }
  }
}

function apply<R>(callable: Callable<R>, ...extraArgs: any[]): R {
  const { args, func } = callable;
  return func(...args, ...extraArgs);
}

// zero final
function fn<R>(func: () => R): Callable<R>;
function fn<A1, R>(func: (a1: A1) => R, arg: A1): Callable<R>;
function fn<A1, A2, R>(
  func: (a1: A1, a2: A2) => R,
  arg1: A1,
  arg2: A2
): Callable<R>;
function fn<A1, A2, A3, R>(
  func: (a1: A1, a2: A2, a3: A3) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3
): Callable<R>;
function fn<A1, A2, A3, A4, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): Callable<R>;
function fn<A1, A2, A3, A4, A5, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): Callable<R>;
// one final applied arg e.g. Action Creators
function fn<B1, R>(func: (b1: B1) => R): Callable<R>;
function fn<B1, A1, R>(func: (a1: A1, b1: B1) => R, arg: A1): Callable<R>;
function fn<B1, A1, A2, R>(
  func: (a1: A1, a2: A2, b1: B1) => R,
  arg1: A1,
  arg2: A2
): Callable<R>;
function fn<B1, A1, A2, A3, R>(
  func: (a1: A1, a2: A2, a3: A3, b1: B1) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3
): Callable<R>;
function fn<B1, A1, A2, A3, A4, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, b1: B1) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): Callable<R>;
function fn<B1, A1, A2, A3, A4, A5, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, b1: B1) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): Callable<R>;
// two final applied args
function fn<B1, B2, R>(func: (b1: B1, b2: B2) => R): Callable<R>;
function fn<B1, B2, A1, R>(
  func: (a1: A1, b1: B1, b2: B2) => R,
  arg: A1
): Callable<R>;
function fn<B1, B2, A1, A2, R>(
  func: (a1: A1, a2: A2, b1: B1, b2: B2) => R,
  arg1: A1,
  arg2: A2
): Callable<R>;
function fn<B1, B2, A1, A2, A3, R>(
  func: (a1: A1, a2: A2, a3: A3, b1: B1, b2: B2) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3
): Callable<R>;
function fn<B1, B2, A1, A2, A3, A4, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, b1: B1, b2: B2) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): Callable<R>;
function fn<B1, B2, A1, A2, A3, A4, A5, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, b1: B1, b2: B2) => R,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): Callable<R>;
function fn() {
  const [func, ...args] = Array.prototype.slice.call(arguments);
  return {
    name: func.name,
    func,
    args,
  };
}

export const Cmd = {
  action,
  tag,
  run,
  map,
  executeRun,
  applyMap,
  apply,
  execute,
  fn,
};
