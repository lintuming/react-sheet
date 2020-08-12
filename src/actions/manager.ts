import SheetManager from 'core/SheetManage';
import {
  ActionManagerNotify,
  ActionName,
  ActionShape,
  ActionsManagerInterface,
} from './types';

class ActionsManage implements ActionsManagerInterface {
  sheetManager: SheetManager;

  actions: ActionsManagerInterface['actions'];

  updater: ActionManagerNotify;

  constructor(sheetManager: SheetManager, updater: ActionManagerNotify) {
    this.sheetManager = sheetManager;
    this.updater = updater;
    this.actions = {} as ActionsManagerInterface['actions'];
  }

  registerAction(action: ActionShape) {
    this.actions[action.name] = action;
  }

  registerAll(actions: ActionShape[]) {
    for (const action of actions) {
      if (!this.actions[action.name]) {
        this.registerAction(action);
      }
    }
  }

  executeAction<T extends ActionName, F>(
    action: ActionShape<T, F>,
    payload: F
  ) {
    this.updater(
      action.perform.bind(action, this.sheetManager, payload),
      action as any
    );
  }

  handleKeydown(event: KeyboardEvent) {
    const actionToExcute = Object.values(this.actions).filter(
      action => action.keyTest && action.keyTest(event, this.sheetManager)
    );

    if (actionToExcute.length > 0) {
      this.executeAction(actionToExcute[0] as any, event as any);
    }
  }
}

export { ActionsManage };
