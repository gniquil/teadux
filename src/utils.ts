import { compose } from 'redux';

export type Func0<R> = () => R;
export type Func1<T1, R> = (a1: T1) => R;
export type Func2<T1, T2, R> = (a1: T1, a2: T2) => R;
export type Func3<T1, T2, T3, R> = (
  a1: T1,
  a2: T2,
  a3: T3,
  ...args: any[]
) => R;

/* one functions */
export function mcompose<F extends Function>(f: F): F;

/* two functions */
export function mcompose<A, R>(f1: (a: A) => R, f2: Func0<A>): Func0<R>;
export function mcompose<A, T1, R>(
  f1: (a: A) => R,
  f2: Func1<T1, A>
): Func1<T1, R>;
export function mcompose<A, T1, T2, R>(
  f1: (a: A) => R,
  f2: Func2<T1, T2, A>
): Func2<T1, T2, R>;
export function mcompose<A, T1, T2, T3, R>(
  f1: (a: A) => R,
  f2: Func3<T1, T2, T3, A>
): Func3<T1, T2, T3, R>;

/* three functions */
export function mcompose<A, B, R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func0<A>
): Func0<R>;
export function mcompose<A, B, T1, R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func1<T1, A>
): Func1<T1, R>;
export function mcompose<A, B, T1, T2, R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func2<T1, T2, A>
): Func2<T1, T2, R>;
export function mcompose<A, B, T1, T2, T3, R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func3<T1, T2, T3, A>
): Func3<T1, T2, T3, R>;

/* four functions */
export function mcompose<A, B, C, R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func0<A>
): Func0<R>;
export function mcompose<A, B, C, T1, R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func1<T1, A>
): Func1<T1, R>;
export function mcompose<A, B, C, T1, T2, R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func2<T1, T2, A>
): Func2<T1, T2, R>;
export function mcompose<A, B, C, T1, T2, T3, R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func3<T1, T2, T3, A>
): Func3<T1, T2, T3, R>;
export function mcompose() {
  const funcs: any[] = Array.prototype.slice.call(arguments);

  if (funcs.length === 1) {
    return funcs[0];
  } else if (funcs.length === 2) {
    const [func1, func2] = funcs;
    let func1Cache = _composeCache.cache.get(func1);
    if (!func1Cache) {
      func1Cache = new Map();
      _composeCache.count = _composeCache.count + 1;
      _composeCache.cache.set(func1, func1Cache);
    }
    let func12 = func1Cache.get(func2);
    if (!func12) {
      func12 = compose(func1, func2);
      _composeCache.count = _composeCache.count + 1;
      func1Cache.set(func2, func12);
    }
    return func12;
  } else if (funcs.length === 3) {
    /* can't get the following to type check... but this is embarrassing
      ```
      const [func1, ...rest] = funcs;
      const funcRest = wrap(...rest);
      return wrap(func1, funcRest);
      ```
    */
    const [func1, func2, func3] = funcs;
    const func23 = mcompose(func2, func3);
    return mcompose(func1, func23);
  } else if (funcs.length === 4) {
    const [func1, func2, func3, func4] = funcs;
    const func34 = mcompose(func3, func4);
    const func234 = mcompose(func2, func34);
    return mcompose(func1, func234);
  } else {
    throw new Error('Wrapping more than 4 functions is not supported');
  }
}

export const _composeCache: {
  cache: Map<any, Map<any, any>>;
  count: number;
} = {
  cache: new Map(),
  count: 0,
};
