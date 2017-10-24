import { Action } from 'redux';

import { Cmd } from './cmd';
import { Commands, Dispatch, TeaReducer } from './types';

export type Item<A extends Action> = {
  originalAction?: A;
  cmds: Commands<A, any>;
};

export type Queue<A extends Action> = Item<A>[];

export class Runtime<S, A extends Action, D> {
  queue: Queue<A> = [];
  observeQueue: Queue<A> = [];
  isMonitoring: boolean = true;
  dispatch: Dispatch<A>;
  dependencies: D;

  constructor(dependencies: D) {
    this.dependencies = dependencies;
  }

  liftReducer(reducer: TeaReducer<S, A, D>) {
    return (state: S, action: A) => {
      const [model, cmds] = reducer(
        state,
        action,
        this.dependencies,
        this.dispatch
      );
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
        return Cmd.execute(cmd).then(a => a && this.dispatch(a));
      })
    );
  }

  init(dispatch: Dispatch<A>, item: Item<A>) {
    this.dispatch = dispatch;
    this.run(item, true);
  }
}
