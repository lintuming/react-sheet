import { ActionName } from './types';
import { register, createAction } from './register';

const ActionUndo = register(
  createAction({
    name: ActionName.undo,
    perform(_, __, sheet) {
      sheet.undo();
    },
    keyTest: event => event.ctrlKey && event.key === 'z',
  })
);

const ActionRedo = register(
  createAction({
    name: ActionName.redo,
    perform(_, __: {}, sheet) {
      sheet.redo();
    },
    keyTest: event => event.ctrlKey && event.key === 'y',
  })
);

export { ActionUndo, ActionRedo };
