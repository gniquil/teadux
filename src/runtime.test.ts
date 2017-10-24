import { Runtime } from './runtime';
import { Cmd } from './cmd';
import { Commands } from './types';

type State = {
  word: string;
};
const initialState = { word: 'hello' };

describe('Runtime', () => {
  test('observe', async () => {
    const runtime = new Runtime({});
    runtime.init(() => {}, { cmds: [] });
    runtime.enqueue({
      originalAction: { type: 'SOME_ACTION' },
      cmds: [Cmd.action({ type: 'SOME_OTHER_ACTION' })],
    });

    await runtime.runAll(runtime.dequeueAll());
    const result = runtime.observe();
    expect(result).toEqual({
      originalAction: { type: 'SOME_ACTION' },
      cmds: [
        {
          type: 'ACTION',
          name: 'SOME_OTHER_ACTION',
          actionToDispatch: {
            type: 'SOME_OTHER_ACTION',
          },
        },
      ],
    });
  });

  test('observe when monitoring off', async () => {
    const runtime = new Runtime({});
    runtime.init(() => {}, { cmds: [] });
    runtime.isMonitoring = false;

    runtime.enqueue({
      originalAction: { type: 'SOME_ACTION' },
      cmds: [Cmd.action({ type: 'SOME_OTHER_ACTION' })],
    });

    await runtime.runAll(runtime.dequeueAll());
    const result = runtime.observe();
    expect(result).toEqual(null);
  });

  describe('liftReducer', () => {
    test('given a reducer that returns only state', () => {
      const reducer = (
        state: State = initialState,
        action: any
      ): [State, Commands<any, any>] => {
        return [state, []];
      };
      const runtime = new Runtime({});
      const liftedReducer = runtime.liftReducer(reducer);
      const result = liftedReducer(initialState, { type: 'SOME_ACTION' });
      expect(result).toEqual(initialState);
      expect(runtime.queue).toEqual([
        { originalAction: { type: 'SOME_ACTION' }, cmds: [] },
      ]);
    });

    test('given a reducer that returns only state and commands', () => {
      const reducer = (
        state: State = initialState,
        action: any
      ): [State, Commands<any, any>] => {
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
      const runtime = new Runtime({});
      const liftedReducer = runtime.liftReducer(reducer);
      const result = liftedReducer(initialState, { type: 'SOME_ACTION' });
      expect(result).toEqual(initialState);
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
});
