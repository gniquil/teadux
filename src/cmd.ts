import { Action } from 'redux';
import { Command, ActionCreator, Effect } from './types';
import { actionCreator, applyActionCreator, applyEffect } from './functions';

type RunOptions<A extends Action, R> = {
  fail?: ActionCreator<A, any>;
  success?: ActionCreator<A, R>;
};

function run<A extends Action, R>(
  effect: Effect<R>,
  options: RunOptions<A, R> = {}
): Command<A, R> {
  return {
    type: 'RUN',
    name: effect.name,
    effect,
    ...options,
  };
}

function action<A extends Action>(actionToDispatch: A): Command<A, any> {
  return {
    type: 'ACTION',
    name: actionToDispatch.type,
    actionToDispatch,
  };
}

function fmap<A extends Action, B extends Action>(
  tagger: (subAction: B) => A,
  nestedCmd: Command<B, any>
): Command<A, any>;
function fmap<A extends Action, B extends Action, A1>(
  tagger: (subAction: B, a1: A1) => A,
  nestedCmd: Command<B, any>,
  a1: A1
): Command<A, any>;
function fmap<A extends Action, B extends Action, A1, A2>(
  tagger: (subAction: B, a1: A1, a2: A2) => A,
  nestedCmd: Command<B, any>,
  a1: A1,
  a2: A2
): Command<A, any>;
function fmap<A extends Action, B extends Action, A1, A2, A3>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3) => A,
  nestedCmd: Command<B, any>,
  a1: A1,
  a2: A2,
  a3: A3
): Command<A, any>;
function fmap<A extends Action, B extends Action, A1, A2, A3, A4>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  nestedCmd: Command<B, any>,
  a1: A1,
  a2: A2,
  a3: A3,
  a4: A4
): Command<A, any>;
function fmap() {
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
  nestedCmds: Command<B, any>[]
): Command<A, any>[];
function map<A extends Action, B extends Action, A1>(
  tagger: (subAction: B, a1: A1) => A,
  nestedCmds: Command<B, any>[],
  a1: A1
): Command<A, any>[];
function map<A extends Action, B extends Action, A1, A2>(
  tagger: (subAction: B, a1: A1, a2: A2) => A,
  nestedCmds: Command<B, any>[],
  a1: A1,
  a2: A2
): Command<A, any>[];
function map<A extends Action, B extends Action, A1, A2, A3>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3) => A,
  nestedCmds: Command<B, any>[],
  a1: A1,
  a2: A2,
  a3: A3
): Command<A, any>[];
function map<A extends Action, B extends Action, A1, A2, A3, A4>(
  tagger: (subAction: B, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  nestedCmds: Command<B, any>[],
  a1: A1,
  a2: A2,
  a3: A3,
  a4: A4
): Command<A, any>[];
function map() {
  const [tagger, nestedCmds, ...args] = Array.prototype.slice.call(arguments);

  return nestedCmds.map((cmd: any) => fmap(tagger, cmd, ...args));
}

function execute<A extends Action>(
  cmd: Command<A, any>
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

export const Cmd = {
  run,
  action,
  fmap,
  execute,
};

export const Cmds = {
  fmap: map,
};
