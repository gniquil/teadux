import { AnyAction } from 'redux';
import { Runtime } from './runtime';

export const makeSanitizers = (runtime: Runtime<any, any, {}>, key: string) => {
  const actionSanitizer = (action: AnyAction) => {
    let joinedType = action.type;
    let currentAction = action;
    while (currentAction[key]) {
      joinedType += ` -> ${currentAction[key].type}`;
      currentAction = currentAction[key];
    }
    if (currentAction !== action) {
      return {
        ...(action as any),
        type: joinedType,
      };
    }
    return action;
  };

  const stateSanitizer = (state: any) => {
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

  return {
    stateSanitizer,
    actionSanitizer,
  };
};
