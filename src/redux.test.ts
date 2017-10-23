import { prepare } from './redux';
import { Runtime } from './runtime';

describe('prepare', () => {
  test('providing runtime', () => {
    const runtime = new Runtime();
    const result = prepare(runtime);
    expect(result.runtime).toBe(runtime);
  });
});

describe('liftReducer', () => {
  test('given a reducer that returns only state', () => {
    const state = { word: 'hello' };
    const reducer = () => {
      return state;
    };
    const runtime = new Runtime();
    const liftedReducer = runtime.liftReducer(reducer);
    const result = liftedReducer({}, { type: 'SOME_ACTION' });
    expect(result).toEqual(state);
    expect(runtime.queue).toEqual([
      { originalAction: { type: 'SOME_ACTION' }, cmds: [] },
    ]);
  });

  test('given a reducer that returns only state and commands', () => {
    const state = { word: 'hello' };
    const reducer = () => {
      return [
        state,
        [
          {
            type: 'ACTION',
            actionToDispatch: { type: 'OTHER_ACTION' },
            name: 'OTHER_ACTION',
          },
        ],
      ];
    };
    const runtime = new Runtime();
    const liftedReducer = runtime.liftReducer(reducer);
    const result = liftedReducer({}, { type: 'SOME_ACTION' });
    expect(result).toEqual(state);
    expect(runtime.queue).toEqual([
      {
        originalAction: { type: 'SOME_ACTION' },
        cmds: [
          {
            type: 'ACTION',
            name: 'OTHER_ACTION',
            actionToDispatch: { type: 'OTHER_ACTION' },
          },
        ],
      },
    ]);
  });
});
