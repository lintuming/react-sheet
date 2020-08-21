import SheetBasic from 'core/SheetBasic';
import { getPixelDistanceOfCols, colAdvanceByPixel } from './col';
import { getPixelDistanceOfRows, rowAdvanceByPixel } from './row';
import Viewport from 'core/Viewport';

export const distanceOfCellToViewportOrigin = (
  sheet: SheetBasic,
  cellX: number,
  cellY: number,
  viewport: Viewport,
  cellMustInViewport: boolean = true
) => {
  const state = sheet.getState();

  const { x, y } = viewport;
  const { domWidth, domHeight } = sheet.injection.getCanvasSize();
  const xOffsetBound = cellMustInViewport ? domWidth : Number.MAX_SAFE_INTEGER;
  const yOffsetBound = cellMustInViewport ? domHeight : Number.MAX_SAFE_INTEGER;

  const xSign = cellX < x ? -1 : 1;
  const ySign = cellY < y ? -1 : 1;

  let xDistance =
    cellX < 0
      ? -1 * state.cols[-1]
      : xSign * getPixelDistanceOfCols(sheet, cellX, x);
  let yDistance =
    cellY < 0
      ? -1 * state.rows[-1]
      : ySign * getPixelDistanceOfRows(sheet, y, cellY);

  if (
    cellMustInViewport &&
    (xDistance > xOffsetBound ||
      yDistance > yOffsetBound ||
      (xDistance < 0 && cellX >= 0) ||
      (yDistance < 0 && cellY >= 0))
  ) {
    return null;
  }
  return [xDistance, yDistance] as const;
};

export const distanceOfCellToCanvasOrigin = (
  sheet: SheetBasic,
  cellX: number,
  cellY: number,
  cellMustInViewport: boolean = true
) => {
  const state = sheet.getState();

  const gridOffset = distanceOfCellToViewportOrigin(
    sheet,
    cellX,
    cellY,
    state.gridViewport,
    cellMustInViewport
  );
  if (gridOffset) {
    return [
      gridOffset[0] + state.cols[-1],
      gridOffset[1] + state.rows[-1],
    ] as const;
  }
  return null;
};

export const mouseCoordsToCellCoords = (
  sheet: SheetBasic,
  mouseX: number,
  mouseY: number
) => {
  const state = sheet.getState();
  let { x, y } = state.gridViewport;
  let gridOffsetX = 0;
  let gridOffsetY = 0;

  // the cursor is on the rows
  if (mouseX <= state.cols[-1]) {
    x = -1;
  }
  // the cursor is on the cols
  if (mouseY <= state.rows[-1]) {
    y = -1;
  }
  if (x >= 0) {
    mouseX -= state.cols[-1];

    const [i, offset] = colAdvanceByPixel(sheet.getState(), x, mouseX);
    x = i;
    gridOffsetX = offset;
  }
  if (y >= 0) {
    mouseY -= state.rows[-1];
    const [i, offset] = rowAdvanceByPixel(sheet.getState(), y, mouseY);

    y = i;
    gridOffsetY = offset;
  }

  return [x, y, gridOffsetX, gridOffsetY] as const;
};
