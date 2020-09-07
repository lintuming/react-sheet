import SheetBasic from 'core/SheetBasic';
import { getColSize } from './col';
import { distanceOfCellToCanvasOrigin } from './distance';
import {  getRowSize } from './row';
import { RESIZER_SIZE } from 'consts';

export const getRowSizeAfterResize = (
  sheet: SheetBasic,
  row: number,
  mouseY?: number
) => {
  const originSize = getRowSize(sheet, row);

  const canvasOffsetY = distanceOfCellToCanvasOrigin(sheet, 0, row)?.[1]!;
  if (mouseY == null) {
    return originSize;
  }
  const { domHeight } = sheet.injection.getCanvasSize();
  // const width = Math.min(
  //   Math.max(mouseOffset - canvasOffsetX, RESIZER_SIZE + 2),
  //   domWidth - RESIZER_SIZE - canvasOffsetX
  // );
  const height = Math.min(
    Math.max(mouseY - canvasOffsetY, RESIZER_SIZE + 2),
    domHeight - RESIZER_SIZE - canvasOffsetY
  );
  return height;
};

export const getColSizeAfterResize = (
  sheet: SheetBasic,
  col: number,
  mouseX?: number
) => {
  const originSize = getColSize(sheet, col);

  const canvasOffsetX = distanceOfCellToCanvasOrigin(sheet, col, 0)?.[0]!;
  if (mouseX == null) {
    return originSize;
  }
  const { domWidth } = sheet.injection.getCanvasSize();
  const width = Math.min(
    Math.max(mouseX - canvasOffsetX, RESIZER_SIZE + 2),
    domWidth - RESIZER_SIZE - canvasOffsetX
  );
  return width;
};
