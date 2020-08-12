import { assertIsDefined, deepClone, scheduleUpdate } from 'utils';
import { SheetData, SheetInternalState } from 'types';
import SheetManager from './SheetManage';
import { Renderer } from './SheetRenderer';
import { ActionPayload, SheetHistory, SnapshotState } from './types';

type Update = {
  (updator: Sheet): void;
};

/*
 *        Extends               extends               extends
 * Sheet --------->  Renderer  ---------> SheetUtil  ---------> SheetStateWatcher
 */
class Sheet extends Renderer {
  history: SheetHistory;

  private updateQueued: Update[];

  private queued?: boolean;

  private didScheduleRenderThisTick?: boolean;
  constructor(data: SheetData, sheetManager: SheetManager) {
    super(data, sheetManager);
    this.history = {
      undoStack: [],
      redoStack: [],
    };
    this.updateQueued = [];
    this.on('.', () => {
      //@ts-ignore
      window.state = this.state;
      if (this.didScheduleRenderThisTick === true) return;
      this.didScheduleRenderThisTick = true;
      this.scheduleUpdate(() => {
        this.didScheduleRenderThisTick = false;
        if (sheetManager.sheet === this) this.render();
      });
    });
  }

  canUndo() {
    return this.history.undoStack.length > 0;
  }

  canRedo() {
    return this.history.redoStack.length > 0;
  }

  undo() {
    if (this.canUndo()) {
      const hisotry = this.history.undoStack.pop()!;

      this.history.redoStack.push(hisotry);
      this.performSnapshot(hisotry.undo);
    }
  }

  redo() {
    if (this.canRedo()) {
      const hisotry = this.history.redoStack.pop()!;

      this.history.undoStack.push(hisotry);
      this.performSnapshot(hisotry.redo);
    }
  }

  protected performSnapshot(snapshot: SnapshotState) {
    this.setState(snapshot);
  }

  protected scheduleUpdate(callback: Update) {
    this.updateQueued.push(callback);
    if (!this.queued) {
      this.queued = true;
      scheduleUpdate(() => {
        this.queued = false;
        for (const update of this.updateQueued) {
          update(this);
        }
        this.updateQueued.length = 0;
      });
    }
  }

  applyAction(payload: ActionPayload) {
    const { action, excute } = payload;
    let snapshot: SnapshotState;

    if (action.commitHistory) {
      snapshot = this.snapshot();
    }
    const shouldCommit = excute(this);

    if (shouldCommit) {
      assertIsDefined(snapshot!);
      this.history.undoStack.push({
        undo: snapshot!,
        redo: this.snapshot(),
      });
    }
  }

  protected stripSheetState(): SnapshotState {
    const {
      selectedRect,
      startIndexs,
      selectedRangeRect,
      readOnly,
      release,
      resizedSize,
      resizingCol,
      resizingRow,
      ...rest
    } = this.state;

    return {
      ...rest,
      selectedRect,
      startIndexs,
      selectedRangeRect,
    };
  }

  protected replaceState(state: SheetInternalState) {
    this.state = state;
  }

  snapshot() {
    return deepClone(this.stripSheetState());
  }

  getState(): SheetInternalState {
    return this.state;
  }

  updateSheetData(callback: (state: SheetInternalState) => void) {
    callback(this.state);
  }
}

export default Sheet;
