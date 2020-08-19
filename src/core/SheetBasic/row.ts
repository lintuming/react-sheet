import { SheetInternalState } from 'types';
import Sheet from 'core/Sheet';

export const getRowSize = (sheet: Sheet, i: number) => {
  const state = sheet.getState();

  return state.rows[i] ?? state.rows.defaultSize;
};

export const viewportRowIterator = function*(sheet: Sheet) {
  const state = sheet.getState();
  const { viewport } = state;
  let gridOffset = 0;
  let i = viewport.y;
  for (; i < viewport.yEnd; i++) {
    const size = getRowSize(sheet, i);
    const item = {
      size,
      offset: gridOffset,
      index: i,
    };
    yield item;
    gridOffset += size;
  }
};

export const rowAdvanceByPixel = (
  sheet: Sheet,
  rowStart: number,
  advance: number
) => {
  let distanceTorow = 0;
  let i = rowStart;
  while (true) {
    const nextDistance = distanceTorow + getRowSize(sheet, i);
    if (nextDistance >= advance) {
      break;
    }
    distanceTorow = nextDistance;
    i++;
  }
  return [i, distanceTorow];
};

export const getPixelDistanceOfRows = (
  sheet: Sheet,
  row1: number,
  row2: number
) => {
  const state = sheet.getState();
  if (row1 > row2) {
    let temp = row1;
    row1 = row2;
    row2 = temp;
  }
  const rows = state.rows;
  let len = row2 - row1;
  let ans = (row2 - row1) * rows.defaultSize;
  const keys = Object.keys(rows);
  const keysLen = keys.length - 2;
  if (len < keysLen) {
    for (let i = row1; i < row2; i++) {
      if (rows[i] != null) {
        ans += rows[i] - rows.defaultSize;
      }
    }
  } else {
    for (let i = 0; i < keys.length; i++) {
      // this skip -1 and defaultSize;
      const n = Number(keys[i]);
      if (n >= 0 && n >= row1 && n < row2) {
        ans += rows[n] - rows.defaultSize;
      }
    }
  }
  return ans;
};

export const isRowLocateSelectedGroupViewport = (sheet: Sheet, row: number) => {
  const state = sheet.getState();
  return (
    row >= state.selectGroupViewport.y && row <= state.selectGroupViewport.yEnd
  );
};

export const isRowAllLocateSelectedGroupViewport = (
  sheet: Sheet,
  row: number
) => {
  const state = sheet.getState();

  const { selectGroupViewport } = state;
  return (
    isRowLocateSelectedGroupViewport(sheet, row) &&
    selectGroupViewport.x === 0 &&
    selectGroupViewport.xEnd === state.cols.length - 1
  );
};
