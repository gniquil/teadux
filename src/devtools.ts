import { AnyAction } from 'redux';
import { Runtime } from './runtime';

export const actionSanitizer = <A extends AnyAction>(action: A) => {
  let joinedType = action.type;
  let currentAction = action;
  while (currentAction.action) {
    joinedType += ` -> ${currentAction.action.type}`;
    currentAction = currentAction.action;
  }
  if (currentAction !== action) {
    return {
      ...(action as any),
      type: joinedType,
    };
  }
  return action;
};

export const makeStateSanitizer = (runtime: Runtime<any, any, {}>) => (
  state: any
) => {
  if (runtime.isMonitoring) {
    const runtimeItem = runtime.observe();
    if (runtimeItem) {
      const { originalAction, cmds } = runtimeItem;
      return {
        ...state,
        '@@teadux': {
          type: actionSanitizer(originalAction).type,
          cmds: cmds,
        },
      };
    } else {
      return {
        ...state,
        '@@teadux': {},
      };
    }
  } else {
    return state;
  }
};
