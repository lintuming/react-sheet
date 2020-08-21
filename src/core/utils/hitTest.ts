import SheetBasic from 'core/SheetBasic';
import { getColSize } from './col';
import { getRowSize } from './row';
import { distanceOfCellToCanvasOrigin } from './distance';
import { DRAGGER_SIZE } from 'consts';

export const hitSeriebox = (
  sheet: SheetBasic,
  mouseX: number,
  mouseY: number
) => {
  const state = sheet.getState();
  const { x, y, xEnd, yEnd } = state.selectedGroupViewport;

  const _x = Math.max(x, xEnd);
  const _y = Math.max(y, yEnd);
  const width = getColSize(sheet, _x);
  const height = getRowSize(sheet, _y);
  const pos = distanceOfCellToCanvasOrigin(sheet, _x, _y);

  if (pos) {
    const size = DRAGGER_SIZE;
    const draggerXStart = pos[0] + width - size / 2;
    const draggerYStart = pos[1] + height - size / 2;
    const draggerXEnd = draggerXStart + size;
    const draggerYEnd = draggerYStart + size;

    return (
      mouseX >= draggerXStart &&
      mouseX <= draggerXEnd &&
      mouseY >= draggerYStart &&
      mouseY <= draggerYEnd
    );
  }

  return false;
};

export const isCellInMergeViewport = (
  sheet: SheetBasic,
  cellX: number,
  cellY: number
) => {
  const state = sheet.getState();
  const merges = state.merges;
  if (merges.length > 0) {
    for (let i = 0; i < merges.length; i += 1) {
      const viewport = merges[i];
      if (
        cellX >= viewport.x &&
        cellX <= viewport.xEnd &&
        cellY >= viewport.y &&
        cellY <= viewport.yEnd
      ) {
        return { viewport: viewport, index: i };
      }
    }
  }
  return null;
};
