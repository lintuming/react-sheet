import { RowOrCol } from 'types';
import SheetBasic from 'core/SheetBasic';

export const getRowSize = (sheet: SheetBasic, i: number) => {
  const state = sheet.getState();

  return state.rows[i] ?? state.rows.defaultSize;
};

export const viewportRowIterator = function*(sheet: SheetBasic) {
  const state = sheet.getState();
  const { gridViewport } = state;
  let gridOffset = 0;
  let i = gridViewport.y;
  for (; i <= gridViewport.yEnd; i++) {
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
  state: { rows: RowOrCol },
  rowStart: number,
  advance: number
) => {
  let i = rowStart;
  const keys = Object.keys(state.rows)
    .filter(
      key => key !== '-1' && key !== 'defaultSize' && Number(key) >= rowStart
    )
    .sort((a, b) => Number(a) - Number(b));
  let base = 0;
  let rest = advance;
  /**
   *                       !
   *      |     |  |  |  |  |  |  |  |  |
   *  colstart  1  2  3  4  5  6  7  8  9
   */
  for (let key of keys) {
    const keyNum = Number(key);
    const distance = state.rows.defaultSize * (keyNum - i);
    if (rest < distance) {
      break;
    }
    base += distance;
    rest -= distance;
    const size = state.rows[key];
    if (rest <= size) {
      return [keyNum, base];
    }
    base += size;
    rest -= size;
    i = keyNum + 1;
  }
  const restIndex = Math.min(
    state.rows.length - i - 1,
    Math.max(0, Math.ceil(rest / state.rows.defaultSize) - 1)
  );
  i = i + restIndex;
  base += restIndex * state.rows.defaultSize;

  return [i, base] as const;
};

export const getPixelDistanceOfRows = (
  sheet: SheetBasic,
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

export const isRowLocateSelectedGroupViewport = (
  sheet: SheetBasic,
  row: number
) => {
  const state = sheet.getState();
  return (
    row >= state.selectedGroupViewport.y &&
    row <= state.selectedGroupViewport.yEnd
  );
};

export const isRowAllLocateSelectedGroupViewport = (
  sheet: SheetBasic,
  row: number
) => {
  const state = sheet.getState();

  const { selectedGroupViewport } = state;
  return (
    isRowLocateSelectedGroupViewport(sheet, row) &&
    selectedGroupViewport.x === 0 &&
    selectedGroupViewport.xEnd === state.cols.length - 1
  );
};
