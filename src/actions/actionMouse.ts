import SheetManager from 'core/SheetManage';
import { CURSOR_TYPE, RESIZER_SIZE } from 'consts';
import Sheet from 'core/Sheet';
import { SheetInternalState } from 'types';
import { register, createAction } from './register';
import { ActionName } from './types';
import {
  markTag,
  clearTag,
  SerieBoxPressed,
  MainButtonPressed,
} from 'core/SheetTags';
import { mouseCoordsToCellCoords } from 'core/utils/distance';
import { isCellInMergeViewport, hitSeriebox } from 'core/utils/hitTest';
import { getColSize } from 'core/utils/col';
import { getRowSize } from 'core/utils/row';
import {
  getNewViewportContainsAll,
  getViewportToContainMergeViewport,
} from 'core/utils/viewport';

import Viewport from 'core/Viewport';
import {
  getColSizeAfterResize,
  getRowSizeAfterResize,
} from 'core/utils/resize';

export type ReactPointerEvent = React.MouseEvent<HTMLDivElement>;
export type PointerMoveState = {
  originViewport: Viewport;
  viewport: Viewport;
  mouseX: number;
  mouseY: number;
  hit: {
    col?: boolean;
    row?: boolean;
    colResize?: boolean;
    rowResize?: boolean;
    serieBox?: boolean; // a small blue box in the lower right corner of the highligh cell
  };
  pointerDownState?: PointerDownState | null;
};

export type PointerDownState = PointerMoveState & {
  button: number;
};

export interface PointerEventHandler {
  (e: ReactPointerEvent): boolean | void;
}

export const initPointerdownState = (
  sheetManager: SheetManager,
  moveState: PointerMoveState | null,
  event: ReactPointerEvent
): PointerDownState | null => {
  if (!moveState) {
    moveState = initializeMoveState(sheetManager, event);
  }
  if (!moveState) return null;
  const { pointerDownState, ...rest } = moveState;
  return {
    ...rest,
    button: event.button,
  };
};

export const initializeMoveState = (
  sheetManager: SheetManager,
  event: ReactPointerEvent,
  downState?: PointerDownState | null
): PointerMoveState | null => {
  const sheet = sheetManager.sheet;
  const state = sheetManager.sheet.getState();
  const mouseX = event.nativeEvent.offsetX;
  const mouseY = event.nativeEvent.offsetY;
  const index = mouseCoordsToCellCoords(sheet, mouseX, mouseY);
  const [x, y, gridOffsetX, gridOffsetY] = index;
  const merge = isCellInMergeViewport(sheet, x, y);
  let viewport = new Viewport(x, y, x, y);
  let finalViewport = viewport.spawn();
  const onSerieBox = hitSeriebox(sheet, mouseX, mouseY);
  const onCol = y === -1;
  const onRow = x === -1;
  const onColResize =
    onCol &&
    state.cols[-1] + gridOffsetX + getColSize(sheet, x) - mouseX <=
      RESIZER_SIZE;
  const onRowResize =
    onRow &&
    state.rows[-1] + gridOffsetY + getRowSize(sheet, y) - mouseY <=
      RESIZER_SIZE;
  if (
    (!downState && (onRow || onCol)) ||
    (downState && (downState.hit.col || downState.hit.row))
  ) {
    if (onCol || (downState && downState.hit.col)) {
      finalViewport = new Viewport(x, 0, x, sheet.rowsLength - 1);
    }
    if (onRow || (downState && downState.hit.row)) {
      finalViewport = new Viewport(0, y, sheet.colsLength - 1, y);
    }
  } else if (merge) {
    finalViewport = merge.viewport;
  }

  return {
    originViewport: viewport,
    viewport: finalViewport,
    hit: {
      col: onCol,
      row: onRow,
      colResize: onColResize,
      rowResize: onRowResize,
      serieBox: onSerieBox,
    },
    mouseX,
    mouseY,
    pointerDownState: downState,
  };
};

function nextStateByPointerDown(
  sheet: Sheet,
  state: SheetInternalState,
  { hit, viewport }: PointerDownState
): Partial<SheetInternalState> {
  let newSelectedGroupViewport = viewport.spawn();
  let newSelectedViewport = viewport.spawn();
  const { x, y } = state.gridViewport;
  if (hit.col) {
    newSelectedGroupViewport.y = 0;
    newSelectedGroupViewport.yEnd = sheet.rowsLength - 1;
    newSelectedViewport.y = y;
    newSelectedViewport.yEnd = y;
  }
  if (hit.row) {
    newSelectedGroupViewport.x = 0;
    newSelectedGroupViewport.xEnd = sheet.colsLength - 1;
    newSelectedViewport.x = x;
    newSelectedViewport.xEnd = x;
  }
  newSelectedGroupViewport = getViewportToContainMergeViewport(
    sheet,
    newSelectedGroupViewport
  );
  newSelectedViewport = getViewportToContainMergeViewport(
    sheet,
    newSelectedViewport
  );
  return {
    selectedGroupViewport: newSelectedGroupViewport,
    selectedViewport: newSelectedViewport,
  };
}

export const ActionPointerDown = register(
  createAction({
    name: ActionName.pointerDown,
    perform(_, pointerDownState: PointerDownState | null, sheet) {
      if (!pointerDownState) return;
      const { hit } = pointerDownState;
      sheet.setState(state => ({
        tag: markTag(
          state.tag,
          hit.serieBox ? SerieBoxPressed : MainButtonPressed
        ),
      }));
      if (hit.colResize || hit.rowResize || hit.serieBox) {
        return;
      }
      sheet.setState(state =>
        nextStateByPointerDown(sheet, state, pointerDownState)
      );
    },
  })
);

function getNextStateByMouseDrag(
  sheet: Sheet,
  state: SheetInternalState,
  moveState: PointerMoveState
): Partial<SheetInternalState> {
  const { mouseY, mouseX, viewport, pointerDownState } = moveState;
  const { viewport: downStateViewport, hit: downStateHit } = pointerDownState!;
  if (downStateHit.serieBox) {
    return state;
  }
  if (state.resizingCol != null) {
    return {
      resizedSize: getColSizeAfterResize(sheet, state.resizingCol, mouseX),
    };
  }
  if (state.resizingRow != null) {
    return {
      resizedSize: getRowSizeAfterResize(sheet, state.resizingRow, mouseY),
    };
  }
  let newViewport = getViewportToContainMergeViewport(
    sheet,
    getNewViewportContainsAll([viewport, downStateViewport])
  );

  return {
    selectedGroupViewport: newViewport,
  };
}

function getNextStateByMouseMove(
  sheet: Sheet,
  state: SheetInternalState,
  moveState: PointerMoveState
): Partial<SheetInternalState> {
  sheet.injection.setCursorType(CURSOR_TYPE.DEFAULT);
  if (!moveState) return state;
  const { hit, viewport } = moveState;
  if (hit.serieBox) {
    sheet.injection.setCursorType(CURSOR_TYPE.CROSSHAIR);
  }
  if (hit.colResize) {
    sheet.injection.setCursorType(CURSOR_TYPE.RESIZEX);
    if (state.resizingCol !== viewport.x) {
      return {
        resizingCol: viewport.x,
        resizedSize: getColSizeAfterResize(sheet, viewport.x),
      };
    }
  } else if (state.resizingCol != null) {
    return {
      resizingCol: null,
      resizedSize: null,
    };
  }
  if (hit.rowResize) {
    sheet.injection.setCursorType(CURSOR_TYPE.RESIZEY);
    if (state.resizingRow !== viewport.y) {
      return {
        resizingRow: viewport.y,
        resizedSize: getRowSizeAfterResize(sheet, viewport.y),
      };
    }
  } else if (state.resizingRow != null) {
    return { resizingRow: null, resizedSize: null };
  }
  return state;
}
export const ActionPointerMove = register(
  createAction({
    name: ActionName.pointerMove,
    perform(_, moveState: PointerMoveState | null, sheet) {
      if (!moveState) return;
      if (moveState.pointerDownState) {
        sheet.setState(state =>
          getNextStateByMouseDrag(sheet, state, moveState)
        );
      } else {
        sheet.setState(state => {
          return getNextStateByMouseMove(sheet, state, moveState);
        });
      }
    },
  })
);

export const ActionPointerUp = register(
  createAction({
    name: ActionName.pointerUp,
    commitHistory: true,
    perform(_, __, sheet) {
      sheet.setState(state => ({
        tag: clearTag(state.tag, SerieBoxPressed),
      }));
      const { resizingCol, resizingRow, resizedSize } = sheet.getState();
      if (resizedSize != null && (resizingCol != null || resizingRow != null)) {
        if (resizingCol) {
          sheet.updateColSize(resizingCol, resizedSize);
        }
        if (resizingRow) {
          sheet.updateRowSize(resizingRow, resizedSize);
        }
        sheet.setState({
          resizedSize: null,
          resizingCol: null,
          resizingRow: null,
        });
        return true;
      }
    },
  })
);
