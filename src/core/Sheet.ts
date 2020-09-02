import { assertIsDefined, scheduleUpdate } from 'utils';
import { SheetData, SheetInternalState } from 'types';
import SheetManager from './SheetManage';
import { Renderer } from './SheetRenderer';
import { ActionPayload, SheetHistory, SnapshotState } from './types';

type Update = {
  (updator: Sheet): void;
};

/*
 *        extends               extends               extends
 * Sheet --------->  Renderer  ---------> SheetBasic  ---------> EventEmmit
 */
class Sheet extends Renderer {
  readonly history: SheetHistory;

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
    this.on('*', () => {
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
      console.log('canundo');
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
    const { excute } = payload;
    const snapshot = this.snapshot();
    const commitHistory = excute(this);
    console.log(commitHistory, 'commit');
    if (commitHistory) {
      this.history.undoStack.push({
        undo: snapshot,
        redo: this.snapshot(),
      });
    }
  }

  protected stripSheetState(): SnapshotState {
    const {
      gridViewport,
      selectedViewport,
      selectedGroupViewport,
      readOnly,
      tag,
      resizedSize,
      resizingCol,
      resizingRow,
      ...rest
    } = this.state;

    return {
      ...rest,
      gridViewport,
      selectedViewport,
      selectedGroupViewport,
    };
  }

  protected replaceState(state: SheetInternalState) {
    this.state = state;
  }

  snapshot() {
    return this.stripSheetState();
  }

  getState(): SheetInternalState {
    return this.state;
  }

  updateSheetData(callback: (state: SheetInternalState) => void) {
    callback(this.state);
  }
}

export default Sheet;
