import { Effect, ActionCreator } from './types';

export function applyEffect<R>({ args, func }: Effect<R>): Promise<R> {
  return func(...args);
}

export function applyActionCreator<R, A>(
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

export function effect<R>(func: () => Promise<R>): Effect<R>;
export function effect<A1, R>(func: (a1: A1) => Promise<R>, arg: A1): Effect<R>;
export function effect<A1, A2, R>(
  func: (a1: A1, a2: A2) => Promise<R>,
  arg1: A1,
  arg2: A2
): Effect<R>;
export function effect<A1, A2, A3, R>(
  func: (a1: A1, a2: A2, a3: A3) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3
): Effect<R>;
export function effect<A1, A2, A3, A4, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): Effect<R>;
export function effect<A1, A2, A3, A4, A5, R>(
  func: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Promise<R>,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): Effect<R>;
export function effect() {
  const [func, ...args] = Array.prototype.slice.call(arguments);
  return {
    name: func.name,
    func,
    args,
  };
}

export function actionCreator<R, A>(
  func: (result: R) => A
): ActionCreator<A, R>;
export function actionCreator<R, A1, A>(
  func: (result: R, a1: A1) => A,
  arg: A1
): ActionCreator<A, R>;
export function actionCreator<R, A1, A2, A>(
  func: (result: R, a1: A1, a2: A2) => A,
  arg1: A1,
  arg2: A2
): ActionCreator<A, R>;
export function actionCreator<R, A1, A2, A3, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3
): ActionCreator<A, R>;
export function actionCreator<R, A1, A2, A3, A4, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3, a4: A4) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4
): ActionCreator<A, R>;
export function actionCreator<R, A1, A2, A3, A4, A5, A>(
  func: (result: R, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => A,
  arg1: A1,
  arg2: A2,
  arg3: A3,
  arg4: A4,
  arg5: A5
): ActionCreator<A, R>;
export function actionCreator() {
  const [func, ...args] = Array.prototype.slice.call(arguments);
  return {
    name: func.name,
    func,
    args,
  };
}
