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

function tagSingle(subAction: CounterAction): Action {
  return { type: 'Single', subAction };
}

describe('wrap', () => {
  test('=== equality', () => {
    const wrapped1 = wrap(tagSingle, increment);
    const wrapped2 = wrap(tagSingle, increment);
    const wrapped3 = wrap(tagSingle, decrement);

    expect(wrapped1).toBe(wrapped2);
    expect(wrapped1).not.toBe(wrapped3);
  });
});
