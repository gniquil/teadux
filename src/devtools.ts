import { Runtime } from './runtime';

export const actionSanitizer = (action: any, runtime: Runtime<any, any>) => {
  let joinedType: string = action.type;
  let currentAction = action;
  while (currentAction.subAction) {
    joinedType += ` -> ${currentAction.subAction.type}`;
    currentAction = currentAction.subAction;
  }
  if (currentAction !== action) {
    return {
      ...action,
      type: joinedType,
    };
  }
  return action;
};

export const makeStateSanitizer = (runtime: Runtime<any, any>) => (
  state: any
) => {
  if (runtime.isMonitoring) {
    const runtimeItem = runtime.observe();
    if (runtimeItem) {
      const { originalAction, cmds } = runtimeItem;
      return {
        ...state,
        '@@dux': {
          type: actionSanitizer(originalAction, runtime).type,
          cmds: cmds,
        },
      };
    } else {
      return {
        ...state,
        '@@dux': {},
      };
    }
  } else {
    return state;
  }
};
