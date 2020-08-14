import SheetManager from 'core/SheetManage';
import { CURSOR_TYPE, RESIZER_SIZE } from 'consts';
import Sheet from 'core/SheetBasic';
import { SheetInternalState } from 'types';
import { register, createAction } from './register';
import { ActionName } from './types';
import {
  markTag,
  clearTag,
  SerieBoxPressed,
  MainButtonPressed,
} from 'core/SheetTags';

export type ReactPointerEvent = React.MouseEvent<HTMLDivElement>;
export type PointerMoveState = {
  rect: readonly [number, number, number, number];
  normalizeRect: readonly [number, number, number, number];
  canvasOffset: [number, number];
  cursorOn: {
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
  moveState: ReturnType<typeof initializeMoveState> | null,
  event: ReactPointerEvent
): PointerDownState => {
  if (!moveState) {
    moveState = initializeMoveState(sheetManager, event);
  }
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
): PointerMoveState => {
  const utils = sheetManager.sheet.utils;
  const state = sheetManager.sheet.getState();
  const canvasOffsetX = event.nativeEvent.offsetX;
  const canvasOffsetY = event.nativeEvent.offsetY;
  const index = utils.mouseOffsetToGridIndex(canvasOffsetX, canvasOffsetY);
  const [x, y, gridOffsetX, gridOffsetY] = index;
  const merge = utils.isGridLocateMergeRect(x, y);
  let normalizeRect = [x, y, x, y] as const;
  let rect = normalizeRect;
  const { sheet } = sheetManager;
  const onSerieBox = utils.isCursorOnSerieBox(canvasOffsetX, canvasOffsetY);
  const onCol = y === -1;
  const onRow = x === -1;
  const onColResize =
    onCol &&
    state.cols[-1] + gridOffsetX + utils.getColSize(x) - canvasOffsetX <=
      RESIZER_SIZE;
  const onRowResize =
    onRow &&
    state.rows[-1] + gridOffsetY + utils.getRowSize(y) - canvasOffsetY <=
      RESIZER_SIZE;

  if (
    (!downState && (onRow || onCol)) ||
    (downState && (downState.cursorOn.col || downState.cursorOn.row))
  ) {
    if (onCol || (downState && downState.cursorOn.col)) {
      normalizeRect = [x, 0, x, sheet.rowsLength - 1];
    }
    if (onRow || (downState && downState.cursorOn.row)) {
      normalizeRect = [0, y, sheet.colsLength - 1, y];
    }
  } else if (merge) {
    normalizeRect = [...merge.rect];
  }

  return {
    rect,
    normalizeRect,
    cursorOn: {
      col: onCol,
      row: onRow,
      colResize: onColResize,
      rowResize: onRowResize,
      serieBox: onSerieBox,
    },
    canvasOffset: [canvasOffsetX, canvasOffsetY],
    pointerDownState: downState,
  };
};

function nextStateByPointerDown(
  sheet: Sheet,
  state: SheetInternalState,
  { cursorOn, normalizeRect }: PointerDownState
) {
  let selectedRangeRect: SheetInternalState['selectedRangeRect'] = [
    ...normalizeRect,
  ];
  if (cursorOn.col) {
    selectedRangeRect[1] = 0;
    selectedRangeRect[3] = sheet.rowsLength - 1;
  }
  if (cursorOn.row) {
    selectedRangeRect[0] = 0;
    selectedRangeRect[2] = sheet.colsLength - 1;
  }
  selectedRangeRect = [
    ...sheet.utils.enlargeRectToContainMerges(...selectedRangeRect),
  ];
  const utils = sheet.utils;
  let [x, y] = normalizeRect;
  const [xStart, yStart] = state.startIndexs;
  let selectedRect: SheetInternalState['selectedRect'] = [...normalizeRect];
  if (cursorOn.row || cursorOn.col) {
    x = Math.max(x, xStart);
    y = Math.max(y, yStart);
    selectedRect = [x, y, x, y];
    const merge = utils.isGridLocateMergeRect(x, y);
    if (merge && merge.rect) {
      selectedRect = [...merge.rect];
    }
  }

  return {
    selectedRect,
    selectedRangeRect,
  };
}

export const ActionPointerDown = register(
  createAction({
    name: ActionName.pointerDown,
    perform(
      _,
      {
        pointerDownState,
      }: {
        pointerDownState: PointerDownState;
      },
      sheet
    ) {
      const { cursorOn } = pointerDownState;
      sheet.setState(state => ({
        tag: markTag(
          state.tag,
          cursorOn.serieBox ? SerieBoxPressed : MainButtonPressed
        ),
      }));
      if (cursorOn.colResize || cursorOn.rowResize || cursorOn.serieBox) {
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
  const utils = sheet.utils;
  const { canvasOffset, normalizeRect, pointerDownState } = moveState;
  const {
    normalizeRect: downNormalizeRect,
    cursorOn: cursorOnWhenDown,
  } = pointerDownState!;
  if (cursorOnWhenDown.serieBox) {
    return state;
  }
  if (state.resizingCol != null) {
    return {
      resizedSize: utils.getSizeAfterResize(
        state.resizingCol,
        0,
        canvasOffset[0]
      )[0],
    };
  }
  if (state.resizingRow != null) {
    return {
      resizedSize: utils.getSizeAfterResize(
        0,
        state.resizingRow,
        canvasOffset[1]
      )[1],
    };
  }
  let rectXStart, rectYStart, rectXEnd, rectYEnd;
  [rectXStart, rectYStart, rectXEnd, rectYEnd] = utils.getRectByRects(
    [...downNormalizeRect],
    [...normalizeRect]
  );
  [
    rectXStart,
    rectYStart,
    rectXEnd,
    rectYEnd,
  ] = utils.enlargeRectToContainMerges(
    rectXStart,
    rectYStart,
    rectXEnd,
    rectYEnd
  );
  return {
    selectedRangeRect: [rectXStart, rectYStart, rectXEnd, rectYEnd],
  };
}

function getNextStateByMouseMove(
  sheet: Sheet,
  state: SheetInternalState,
  moveState: PointerMoveState
): Partial<SheetInternalState> {
  sheet.injection.setCursorType(CURSOR_TYPE.DEFAULT);
  const { cursorOn, rect } = moveState;
  const [x, y] = rect;
  const utils = sheet.utils;
  if (cursorOn.serieBox) {
    sheet.injection.setCursorType(CURSOR_TYPE.CROSSHAIR);
  }
  if (cursorOn.colResize) {
    sheet.injection.setCursorType(CURSOR_TYPE.RESIZEX);
    if (state.resizingCol !== x) {
      return {
        resizingCol: x,
        resizedSize: utils.getSizeAfterResize(x, 0)[0],
      };
    }
  } else if (state.resizingCol != null) {
    return {
      resizingCol: null,
      resizedSize: null,
    };
  }
  if (cursorOn.rowResize) {
    console.log('rowToResize', y, state.resizingRow);
    sheet.injection.setCursorType(CURSOR_TYPE.RESIZEY);
    if (state.resizingRow !== y) {
      return {
        resizingRow: y,
        resizedSize: utils.getSizeAfterResize(0, y)[1],
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
    perform(_, moveState: PointerMoveState, sheet) {
      if (moveState.pointerDownState) {
        sheet.setState(state =>
          getNextStateByMouseDrag(sheet, state, moveState)
        );
      } else {
        sheet.setState(state => {
          console.log('mouseMove', state.resizedSize);
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
      const {
        resizingCol,
        resizingRow,
        resizedSize,
        startIndexs,
      } = sheet.getState();
      if (resizedSize != null && (resizingCol != null || resizingRow != null)) {
        const [startX, startY] = startIndexs;
        const canvasOffset = sheet.utils.distanceToCanvasOrigin(
          resizingCol ?? startX,
          resizingRow ?? startY
        );
        if (canvasOffset) {
          if (resizingCol != null) {
            sheet.updateColSize(resizingCol, resizedSize);
          }
          if (resizingRow != null) {
            sheet.updateRowSize(resizingRow, resizedSize);
          }
          sheet.setState({
            resizedSize: null,
            resizingCol: null,
            resizingRow: null,
          });
          // Should commit to History
          return true;
        }
      }
      return false;
    },
  })
);
