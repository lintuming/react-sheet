import SheetBasic from 'core/SheetBasic';
import { getCell } from './cell';
import { EmptyCell } from 'consts';
import { getColSize, colAdvanceByPixel } from './col';
import { getRowSize, rowAdvanceByPixel } from './row';
import { distanceOfCellToCanvasOrigin } from './distance';
import Viewport from 'core/Viewport';
import { Injection } from 'core/types';

export const isViewportsIntersect = (
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

export const isViewportContain = (viewport: Viewport, contain: Viewport) => {
  return (
    viewport.x <= contain.x &&
    viewport.xEnd >= contain.xEnd &&
    viewport.y <= contain.y &&
    viewport.yEnd >= contain.yEnd
  );
};
export const getNewViewportContainsAll = (viewports: Viewport[]) => {
  const resultViewport = viewports[0].spawn();
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
export const getViewportToContainMergeViewport = (
  sheet: SheetBasic,
  viewport: Viewport
) => {
  let resultViewport = viewport.spawn();
  let { merges } = sheet.getState();
  merges = merges.sort((v1, v2) => {
    return v1.x - v2.x + (v1.y - v2.y);
  });
  if (merges && merges.length > 0) {
    for (let i = 0; i < merges.length; i += 1) {
      if (isViewportsIntersect(merges[i], resultViewport)) {
        resultViewport = getNewViewportContainsAll([merges[i], resultViewport]);
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

export const isMergeViewport = (sheet: SheetBasic, viewport: Viewport) => {
  const state = sheet.getState();
  return state.merges.some(mergeViewport =>
    isViewportsCoincide(viewport, mergeViewport)
  );
};
export const firstNotEmptyCellInViewport = (
  sheet: SheetBasic,
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

export const getViewportBoundingRect = (
  sheet: SheetBasic,
  viewport: Viewport
) => {
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

export const getLastViewport = (
  sheet: SheetBasic,
  getCanvasSize?: Injection['getCanvasSize']
) => {
  const state = sheet.getState();
  const { domWidth, domHeight } = getCanvasSize
    ? getCanvasSize()
    : sheet.injection.getCanvasSize();
  const viewport = new Viewport(
    (state.cols.length ?? 1) - 1,
    (state.rows.length ?? 1) - 1,
    (state.cols.length ?? 1) - 1,
    (state.rows.length ?? 1) - 1
  );
  let width = domWidth - state.cols[-1];
  let height = domHeight - state.rows[-1];
  while (width > 0) {
    const size = getColSize(sheet, viewport.x);
    if (width > size) {
      width -= size;
      viewport.x--;
    } else {
      viewport.x++;
      break;
    }
  }
  while (height > 0) {
    const size = getRowSize(sheet, viewport.y);
    console.log(height,size, viewport.y, 'last');
    if (height > size) {
      height -= size;
      viewport.y--;
    } else {
      viewport.y++;
      break;
    }
  }
  return viewport;
};

export const getViewportAfterWheel = (
  sheet: SheetBasic,
  scrollTop: number,
  scrollLeft: number,
  vertical?: boolean,
  forceMove?: number
) => {
  const state = sheet.getState();
  const viewport = state.gridViewport.spawn();
  const lastViewport = getLastViewport(sheet);
  let [x, newScrollLeft] = colAdvanceByPixel(sheet.getState(), 0, scrollLeft);
  let [y, newScrollTop] = rowAdvanceByPixel(sheet.getState(), 0, scrollTop);
  const { domWidth, domHeight } = sheet.injection.getCanvasSize();

  viewport.x = x;
  viewport.y = y;

  const didChanged =
    state.gridViewport.x !== viewport.x || state.gridViewport.y !== viewport.y;
  if (!didChanged && forceMove != null) {
    const key = vertical ? 'y' : 'x';
    const end: 'xEnd' | 'yEnd' = (key + 'End') as any;
    if (forceMove > 0) {
      if (vertical) {
        newScrollTop += getRowSize(sheet, viewport.y);
      } else {
        newScrollLeft += getColSize(sheet, viewport.x);
      }
      viewport[key]++;
      viewport[end]--;
    } else if (forceMove < 0) {
      viewport[key]--;
      viewport[end]--;
      if (vertical) {
        newScrollTop -= getRowSize(sheet, viewport.y);
      } else {
        newScrollLeft -= getColSize(sheet, viewport.x);
      }
    }
  }
  let [xEnd] = colAdvanceByPixel(sheet.getState(), viewport.x, domWidth);
  let [yEnd] = rowAdvanceByPixel(sheet.getState(), viewport.y, domHeight);

  viewport.xEnd = xEnd;
  viewport.yEnd = yEnd;
  viewport.x = Math.min(Math.max(0, viewport.x), lastViewport.x);
  viewport.xEnd = Math.min(Math.max(0, viewport.xEnd), lastViewport.xEnd);
  viewport.y = Math.min(Math.max(0, viewport.y), lastViewport.y);
  viewport.yEnd = Math.min(Math.max(0, viewport.yEnd), lastViewport.yEnd);
  console.log(lastViewport, 'lastViewport', x, y, scrollTop);
  return { viewport, scrollTop: newScrollTop, scrollLeft: newScrollLeft };
};
