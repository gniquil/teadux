import { mcompose } from './utils';

type CounterAction = Increment | Decrement;

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

type Action = Single;

type Single = {
  type: 'Single';
  subAction: CounterAction;
};

type Double = {
  type: 'Double';
  subAction: Single;
};

type Triple = {
  type: 'Triple';
  subAction: Double;
};

type Quad = {
  type: 'Quad';
  subAction: Triple;
};

function tagSingle(subAction: CounterAction): Action {
  return { type: 'Single', subAction };
}

function tagDouble(subAction: Single): Double {
  return { type: 'Double', subAction };
}

function tagTriple(subAction: Double): Triple {
  return { type: 'Triple', subAction };
}

function tagQuad(subAction: Triple): Quad {
  return { type: 'Quad', subAction };
}

describe('wrap', () => {
  test('0 func', () => {
    const wrapped1 = mcompose(increment);
    const wrapped2 = mcompose(increment);
    const wrapped3 = mcompose(decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped3);
  });

  test('1 func', () => {
    const wrapped1 = mcompose(tagSingle, increment);
    const wrapped2 = mcompose(tagSingle, increment);
    const wrapped3 = mcompose(tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped3);
  });

  test('2 funcs', () => {
    const wrapped1 = mcompose(tagDouble, tagSingle, increment);
    const wrapped2 = mcompose(tagDouble, tagSingle, increment);
    const wrapped2b = mcompose(tagDouble, tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped2b);
  });

  test('3 funcs', () => {
    const wrapped1 = mcompose(tagTriple, tagDouble, tagSingle, increment);
    const wrapped2 = mcompose(tagTriple, tagDouble, tagSingle, increment);
    const wrapped2b = mcompose(tagTriple, tagDouble, tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped2b);
  });

  test('4 funcs', () => {
    expect(() => {
      (mcompose as any)(tagQuad, tagTriple, tagDouble, tagSingle, increment);
    }).toThrow(/not supported/);
  });
});
