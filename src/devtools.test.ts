import { Cmd } from './cmd';
import { Runtime } from './runtime';
import { actionSanitizer, makeStateSanitizer } from './devtools';

describe('actionSanitizer', () => {
  test('without subAction', () => {
    expect(actionSanitizer({ type: 'SOME_ACTION' })).toEqual({
      type: 'SOME_ACTION',
    });
  });

  test('with subAction', () => {
    expect(
      actionSanitizer({ type: 'SOME_ACTION', action: { type: 'OTHER' } })
    ).toEqual({
      type: 'SOME_ACTION -> OTHER',
      action: {
        type: 'OTHER',
      },
    });
  });
});

describe('makeStateSanitizer', () => {
  test('when runtime monitoring is off', async () => {
    const runtime = new Runtime({});
    runtime.isMonitoring = false;
    runtime.init(() => {}, { cmds: [] });
    runtime.enqueue({
      originalAction: { type: 'SOME_ACTION' },
      cmds: [Cmd.action({ type: 'SOME_OTHER_ACTION' })],
    });

    await runtime.runAll(runtime.dequeueAll());

    const actionSanitizer = makeStateSanitizer(runtime);
    const result = actionSanitizer({ word: 'hello' });
    expect(result).toEqual({ word: 'hello' });
  });

  test('when runtime monitoring is on, runtime item exists', async () => {
    const runtime = new Runtime({});
    runtime.init(() => {}, { cmds: [] });
    runtime.enqueue({
      originalAction: { type: 'SOME_ACTION' },
      cmds: [Cmd.action({ type: 'SOME_OTHER_ACTION' })],
    });

    await runtime.runAll(runtime.dequeueAll());

    const actionSanitizer = makeStateSanitizer(runtime);
    const result = actionSanitizer({ word: 'hello' });
    expect(result).toEqual({
      word: 'hello',
      '@@teadux': {
        type: 'SOME_ACTION',
        cmds: [Cmd.action({ type: 'SOME_OTHER_ACTION' })],
      },
    });
  });

  test('when runtime monitoring is on, runtime item does not exist', async () => {
    const runtime = new Runtime({});
    runtime.init(() => {}, { cmds: [] });

    await runtime.runAll(runtime.dequeueAll());

    const actionSanitizer = makeStateSanitizer(runtime);
    const result = actionSanitizer({ word: 'hello' });
    expect(result).toEqual({
      word: 'hello',
      '@@teadux': {},
    });
  });
});
