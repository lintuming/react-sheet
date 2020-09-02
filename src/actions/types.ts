import SheetInstance from 'core/SheetBasic';
import SheetManager from 'core/SheetManage';
import Sheet from 'core/Sheet';
import { SnapshotState } from 'core/types';

export enum ActionName {
  scroll = 'scroll',
  wheel = 'wheel',
  pointerDown = 'pointerDown',
  pointerMove = 'pointerMove',
  pointerUp = 'pointerUp',
  undo = 'undo',
  redo = 'redo',
  updateSheet = 'updateSheet',
  merge = 'merge',
  editCell = 'editCell',
}

type ConfirmCommitHostory = void | boolean;

type Third<T extends any[]> = ((...t: T) => void) extends (
  h1: any,
  h2: any,
  ...r: infer R
) => void
  ? R
  : never;

type ActionFn<T> = (
  sheetManager: SheetManager,
  payload: T,
  sheet: Sheet
) => ConfirmCommitHostory;

type ActionFnBind = (
  ...args: Third<Parameters<ActionFn<any>>>
) => ConfirmCommitHostory;

interface KeyTestFn {
  (event: KeyboardEvent, sheetManager: SheetManager): boolean;
}

type ActionShape<F extends ActionName = any, T = any> = {
  name: F;
  perform: ActionFn<T>;
  commitHistory?: boolean;
  panelComponent?: React.FC<{
    sheetInstance: SheetInstance;
  }>;
  forceUpdate?: boolean;
  keyTest?: KeyTestFn;
  label?: string;
  component?: React.FC<{
    sheetManager: SheetManager;
  }>;
};

interface ActionsManagerInterface {
  actions: {
    [key in ActionName]: ActionShape;
  };
  registerAction(action: ActionShape): void;
  registerAll(actions: ActionShape[]): void;
  handleKeydown(event: KeyboardEvent): void;
}

type ActionManagerNotify = {
  (excuteAction: ActionFnBind, action: ActionShape): void;
};

export {
  ActionShape,
  ActionsManagerInterface,
  ActionFnBind,
  ActionManagerNotify,
};
