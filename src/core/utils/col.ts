import { RowOrCol } from 'types';
import SheetBasic from 'core/SheetBasic';

export const getColSize = (sheet: SheetBasic, i: number) => {
  const state = sheet.getState();
  return state.cols[i] ?? state.cols.defaultSize;
};

export const viewportColIterator = function*(sheet: SheetBasic) {
  const state = sheet.getState();
  const { gridViewport } = state;
  let gridOffset = 0;
  let i = gridViewport.x;
  for (; i <= gridViewport.xEnd; i++) {
    const size = getColSize(sheet, i);
    const item = {
      size,
      offset: gridOffset,
      index: i,
    };
    yield item;
    gridOffset += size;
  }
};

export const colAdvanceByPixel = (
  state: { cols: RowOrCol },
  colStart: number,
  advance: number
) => {
  let i = colStart;
  const keys = Object.keys(state.cols)
    .filter(
      key => key !== '-1' && key !== 'defaultSize' && Number(key) >= colStart
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
    const distance = state.cols.defaultSize * (keyNum - i);
    if (rest < distance) {
      break;
    }
    rest -= distance;
    base += distance;
    const size = state.cols[keyNum];
    if (rest <= size) {
      return [keyNum, base];
    } else {
      rest -= size;
      base += size;
      i = keyNum + 1;
    }
  }
  const restCount = Math.min(
    state.cols.length - i - 1,
    Math.max(0, Math.ceil(rest / state.cols.defaultSize) - 1)
  );
  i += restCount;
  base += restCount * state.cols.defaultSize;
  return [i, base] as const;
};
export const getPixelDistanceOfCols = (
  sheet: SheetBasic,
  col: number,
  col2: number
) => {
  const state = sheet.getState();
  if (col > col2) {
    let temp = col;
    col = col2;
    col2 = temp;
  }
  const cols = state.cols;
  let len = col2 - col;
  let ans = (col2 - col) * cols.defaultSize;
  const keys = Object.keys(cols);
  const keysLen = keys.length - 2;
  if (len < keysLen) {
    for (let i = col; i < col2; i++) {
      if (cols[i] != null) {
        ans += cols[i] - cols.defaultSize;
      }
    }
  } else {
    for (let i = 0; i < keys.length; i++) {
      // this skip -1 and defaultSize;
      const n = Number(keys[i]);
      if (n >= 0 && n >= col && n < col2) {
        ans += cols[n] - cols.defaultSize;
      }
    }
  }
  return ans;
};
export const isColLocateSelectedGroupViewport = (
  sheet: SheetBasic,
  col: number
) => {
  const state = sheet.getState();
  return (
    col >= state.selectedGroupViewport.x &&
    col <= state.selectedGroupViewport.xEnd
  );
};

export const isColAllLocateSelectedGroupViewport = (
  sheet: SheetBasic,
  col: number
) => {
  const state = sheet.getState();
  const { selectedGroupViewport } = sheet.getState();
  return (
    isColLocateSelectedGroupViewport(sheet, col) &&
    selectedGroupViewport.y === 0 &&
    selectedGroupViewport.yEnd === state.rows.length - 1
  );
};
