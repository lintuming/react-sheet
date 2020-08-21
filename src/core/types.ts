import { ScrollState, SpreadsheetConfig, SheetInternalState } from 'types';
import { CURSOR_TYPE } from 'consts';
import { ActionFnBind, ActionShape } from 'actions/types';

interface Injection {
  getCanvas: () => HTMLCanvasElement | null;
  getConfig: () => SpreadsheetConfig;
  getScrollOffset: () => ScrollState;
  // ScrollBy: (distance: number,vertical?:boolean) => void;
  scroll: (
    distance: number,
    vertical?: boolean,
    skipScrollEvent?: boolean
  ) => void;
  getCanvasSize: () => {
    canvasWidth: number;
    canvasHeight: number;
    domWidth: number;
    domHeight: number;
  };
  setCursorType: (cursorType: CURSOR_TYPE) => void;
  renderLayer: () => void;
  // Send: any;
}

interface HistoryStackValue {
  undo: SnapshotState;
  redo: SnapshotState;
}
type SnapshotState = Pick<
  SheetInternalState,
  | 'gridViewport'
  | 'selectedGroupViewport'
  | 'selectedViewport'
  | 'rows'
  | 'cols'
  | 'matrix'
  | 'merges'
>;
interface SheetHistory {
  undoStack: HistoryStackValue[];
  redoStack: HistoryStackValue[];
}
interface ActionPayload {
  excute: ActionFnBind;
  action: ActionShape;
}
export { Injection, ActionPayload, SheetHistory, SnapshotState };
