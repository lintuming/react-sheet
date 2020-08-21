import SheetManager from 'core/SheetManage';
import { getPixelDistanceOfRows } from 'core/utils/row';
import { getPixelDistanceOfCols } from 'core/utils/col';
import { getLastViewport, getViewportBoundingRect } from 'core/utils/viewport';
import Sheet from 'core/Sheet';
import { Injection } from 'core/types';

const getExtractSpaceFromLastViewport = (sheet: Sheet) => {
  const lastViewport = getLastViewport(sheet);
  const boundRect = getViewportBoundingRect(sheet, lastViewport);
  const { domWidth, domHeight } = sheet.injection.getCanvasSize();
  const state = sheet.getState();
  return {
    extractWidth: domWidth - boundRect.width - state.cols[-1],
    extractHeight: domHeight - boundRect.height - state.rows[-1],
  };
};

export function measureScrollBarInner(sheetMangager: SheetManager) {
  const { sheet } = sheetMangager;

  const { extractHeight, extractWidth } = getExtractSpaceFromLastViewport(
    sheet
  );
  let vertical =
    getPixelDistanceOfRows(sheet, 0, sheet.rowsLength) + extractWidth;
  let horizontal =
    getPixelDistanceOfCols(sheet, 0, sheet.colsLength) + extractHeight;

  return {
    scrollWidth: horizontal,
    scrollHeight: vertical,
  };
}
