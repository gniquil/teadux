import { Action } from 'redux';

import { Cmd } from './cmd';
import { CmdType, Dispatch } from './types';

export type Item<A extends Action> = {
  originalAction?: A;
  cmds: CmdType<A>[];
};

export type Queue<A extends Action> = Item<A>[];

export class Runtime<S, A extends Action> {
  queue: Queue<A> = [];
  observeQueue: Queue<A> = [];
  isMonitoring: boolean = true;
  dispatch: Dispatch<A>;

  liftReducer(reducer: any) {
    return (state: S, action: A) => {
      const result = reducer(state, action, this.dispatch);
      const [model, cmds]: [S, CmdType<A>[]] =
        result['length'] === 2 ? result : [result, []];

      this.enqueue({ originalAction: action, cmds });
      return model;
    };
  }

  enqueue(item: Item<A>) {
    this.queue.push(item);
    if (this.isMonitoring) {
      this.observeQueue.push(item);
    }
  }

  dequeueAll() {
    const runningQueue = this.queue;
    this.queue = [];
    return runningQueue;
  }

  observe() {
    if (this.isMonitoring) {
      return this.observeQueue.shift();
    }
    return null;
  }

  runAll(queue: Queue<A>) {
    return Promise.all(queue.map(item => this.run(item)));
  }

  run({ originalAction, cmds }: Item<A>, init: boolean = false) {
    return Promise.all(
      cmds.map(cmd => {
        return Cmd.execute(cmd)
          .then(a => a && this.dispatch(a))
          .catch(error => {
            console.error(
              promiseCaughtError(
                init
                  ? 'Init action'
                  : originalAction ? originalAction.type : 'Unknown action',
                error
              )
            );
            throw error;
          });
      })
    );
  }

  init(dispatch: Dispatch<A>, item: Item<A>) {
    this.dispatch = dispatch;
    this.run(item, true);
  }
}

function promiseCaughtError(originalActionType: string, error: any) {
  return `
Exception thrown when running Cmds from action: ${originalActionType}.

Thrown exception:
${error}
`;
}