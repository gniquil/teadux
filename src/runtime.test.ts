import { Runtime } from './runtime';
import { Cmd } from './cmd';

describe('Runtime', () => {
  test('observe', async () => {
    const runtime = new Runtime();
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
    const runtime = new Runtime();
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
});
