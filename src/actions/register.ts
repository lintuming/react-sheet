import { ActionName, ActionShape } from './types';

let actions: ActionShape[] = [];

const createAction = <F extends ActionName, T>(
  props: ActionShape<F, T>
): ActionShape<F, T> => {
  return {
    ...props,
  };
};

const register = <T extends ActionName, F>(
  action: ActionShape<T, F>
): ActionShape<T, F> => {
  actions = actions.concat(action);
  return action;
};

export { register, actions, createAction };
