import { wrap } from './utils';

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

type Quadruple = {
  type: 'Quadruple';
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

function tagQuadruple(subAction: Triple): Quadruple {
  return { type: 'Quadruple', subAction };
}

describe('wrap', () => {
  test('0 func', () => {
    const wrapped1 = wrap(increment);
    const wrapped2 = wrap(increment);
    const wrapped3 = wrap(decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped3);
  });

  test('1 func', () => {
    const wrapped1 = wrap(tagSingle, increment);
    const wrapped2 = wrap(tagSingle, increment);
    const wrapped3 = wrap(tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped3);
  });

  test('2 funcs', () => {
    const wrapped1 = wrap(tagDouble, tagSingle, increment);
    const wrapped2 = wrap(tagDouble, tagSingle, increment);
    const wrapped2b = wrap(tagDouble, tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped2b);
  });

  test('3 funcs', () => {
    const wrapped1 = wrap(tagTriple, tagDouble, tagSingle, increment);
    const wrapped2 = wrap(tagTriple, tagDouble, tagSingle, increment);
    const wrapped2b = wrap(tagTriple, tagDouble, tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped2b);
  });
});
