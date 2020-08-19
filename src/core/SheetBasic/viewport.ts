import { Viewport, RowOrCol } from 'types';
import Sheet from 'core/Sheet';
import { getCell } from './cell';
import { EmptyCell } from 'consts';
import { getColSize, colAdvanceByPixel } from './col';
import { getRowSize, rowAdvanceByPixel } from './row';
import { distanceOfCellToCanvasOrigin } from './distance';

export const isViewportsIntersec = (
  viewport1: Viewport,
  viewport2: Viewport
) => {
  return (
    viewport1.x <= viewport2.xEnd &&
    viewport1.xEnd >= viewport2.x &&
    viewport1.y <= viewport2.yEnd &&
    viewport1.yEnd >= viewport2.y
  );
};

export const getViewportContain = (viewports: Viewport[]) => {
  const resultViewport = {
    ...viewports[0],
  };
  for (let i = 1; i < viewports.length; i++) {
    const { x, y, xEnd, yEnd } = viewports[i];
    resultViewport.x = Math.min(resultViewport.x, x, xEnd);
    resultViewport.y = Math.min(resultViewport.y, y, yEnd);
    resultViewport.xEnd = Math.max(resultViewport.xEnd, x, xEnd);
    resultViewport.yEnd = Math.max(resultViewport.yEnd, y, yEnd);
  }
  return resultViewport;
};

// expand viewport to contain all intersected merge viewport.
export const viewportContainsIntersecMergeViewport = (
  sheet: Sheet,
  viewport: Viewport
) => {
  let resultViewport = {
    ...viewport,
  };
  let { merges } = sheet.getState();
  merges = merges.sort((v1, v2) => {
    return v1.x - v2.x + (v1.y - v2.y);
  });
  if (merges && merges.length > 0) {
    for (let i = 0; i < merges.length; i += 1) {
      if (isViewportsIntersec(merges[i], resultViewport)) {
        resultViewport = getViewportContain([merges[i], resultViewport]);
      }
    }
  }
  return resultViewport;
};

export const isViewportsCoincide = (v1: Viewport, v2: Viewport) => {
  return (
    v1.x === v2.x && v1.xEnd === v2.xEnd && v1.y === v2.y && v1.yEnd === v2.yEnd
  );
};

export const firstNotEmptyCellInViewport = (
  sheet: Sheet,
  viewport: Viewport
) => {
  const matrix = sheet.getState().matrix;
  for (let y = viewport.y; y <= viewport.yEnd; y++) {
    for (let x = viewport.x; x <= viewport.xEnd && matrix[y]; x++) {
      const cell = getCell(sheet, x, y);
      if (cell === EmptyCell) {
        continue;
      }
      return cell;
    }
  }
  return EmptyCell;
};

export const getViewportBoundingRect = (sheet: Sheet, viewport: Viewport) => {
  const { x, y, xEnd, yEnd } = viewport;
  let width = getColSize(sheet, x);
  let height = getRowSize(sheet, y);
  const [canvasOffsetX, canvasOffsetY] = distanceOfCellToCanvasOrigin(
    sheet,
    x,
    y,
    false
  );
  if (x === xEnd && y === yEnd) {
    return {
      width,
      height,
      canvasOffsetX,
      canvasOffsetY,
    };
  }
  const endCanvasOffset = distanceOfCellToCanvasOrigin(
    sheet,
    xEnd + 1,
    yEnd + 1,
    false
  )!;
  width = endCanvasOffset[0] - canvasOffsetX;
  height = endCanvasOffset[1] - canvasOffsetY;
  return {
    canvasOffsetX,
    canvasOffsetY,
    width,
    height,
  };
};

export const getLastViewport = (sheet: Sheet) => {
  const state = sheet.getState();
  const { domWidth, domHeight } = sheet.injection.getCanvasSize();
  const viewport = {
    x: (state.cols.length ?? 1) - 1,
    y: (state.rows.length ?? 1) - 1,
    xEnd: (state.cols.length ?? 1) - 1,
    yEnd: (state.rows.length ?? 1) - 1,
  };
  let width = domWidth - state.cols[-1];
  let height = domHeight - state.rows[-1];

  while (width > 0) {
    width -= getColSize(sheet, viewport.xEnd);
    viewport.x--;
  }
  while (height > 0) {
    height -= getRowSize(sheet, viewport.yEnd);
    viewport.y--;
  }
  return viewport;
};

export const getViewportAfterWheel = (
  sheet: Sheet,
  scrollTop: number,
  scrollLeft: number,
  vertical: boolean,
  forceMove?: number
) => {
  const state = sheet.getState();
  const viewport = {
    ...state.viewport,
  };
  const lastViewport = getLastViewport(sheet);
  let [x] = colAdvanceByPixel(sheet, 0, scrollLeft);
  let [y] = rowAdvanceByPixel(sheet, 0, scrollTop);
  if (x > lastViewport.x) {
    viewport.x = lastViewport.x;
    viewport.xEnd = lastViewport.xEnd;
  }
  if (y > lastViewport.y) {
    viewport.y = lastViewport.y;
    viewport.yEnd = lastViewport.yEnd;
  }
  const didChanged =
    state.viewport.x !== viewport.x || state.viewport.y !== viewport.y;
  if (!didChanged && forceMove != null) {
    const key = vertical ? 'y' : 'x';
    const end: 'xEnd' | 'yEnd' = (key + 'End') as any;

    if (forceMove > 0 && viewport[key] < lastViewport[key]) {
      viewport[key]++;
      viewport[end]++;
    } else if (forceMove < 0) {
      viewport[key]--;
      viewport[end]--;
    }
  }
  return viewport;
  // let x = 0,
  //   sum = 0;

  // let i = 0;
  // let sum = 0;
  // const isRow = which === 'row';
  // const { state } = this;
  // const items = isRow ? state.rows : state.cols;
  // const lastPageStartIndex = this.lastStartIndex(which);

  // while (sum < offset && i < lastPageStartIndex) {
  //   sum += items[i] ?? items.defaultSize;
  //   i++;
  // }
  // const didChanged = state.startIndexs[isRow ? 1 : 0] !== i;

  // if (!didChanged && forceMove != null) {
  //   if (forceMove > 0 && i < lastPageStartIndex) {
  //     sum += items[i] ?? items.defaultSize;
  //     i++;
  //   } else if (forceMove < 0) {
  //     i--;
  //     sum -= items[i] ?? items.defaultSize;
  //   }
  // }
  // return [i, sum];
};
