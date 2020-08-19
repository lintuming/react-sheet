import { SheetInternalState } from 'types';
import Sheet from 'core/Sheet';
import { distanceOfCellToCanvasOrigin } from './distance';

export const getColSize = (sheet: Sheet, i: number) => {
  const state = sheet.getState();
  return state.cols[i] ?? state.cols.defaultSize;
};

export const viewportColIterator = function*(sheet: Sheet) {
  const state = sheet.getState();
  const { viewport } = state;
  let gridOffset = 0;
  let i = viewport.x;
  for (; i < viewport.xEnd; i++) {
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
  sheet: Sheet,
  colStart: number,
  advance: number
) => {
  let distanceTocol = 0;
  let i = colStart;
  const state = sheet.getState();
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
    const distance = state.cols.defaultSize * (keyNum - i) + state.cols[key];
    if (rest < distance) {
      break;
    }
    base += distance;
    i = keyNum + 1;
    rest -= distance;
  }
  const restIndex = Math.ceil(rest / state.cols.defaultSize);
  i = i + restIndex;
  base += restIndex * state.cols.defaultSize;
  // while (true) {
  //   const nextDistance = distanceTocol + getColSize(sheet, i);
  //   if (nextDistance >= advance) {
  //     break;
  //   }
  //   distanceTocol = nextDistance;
  //   i++;
  // }
  return [i, base];
};
export const getPixelDistanceOfCols = (
  sheet: Sheet,
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
export const isColLocateSelectedGroupViewport = (sheet: Sheet, col: number) => {
  const state = sheet.getState();
  return (
    col >= state.selectGroupViewport.x && col <= state.selectGroupViewport.xEnd
  );
};

export const isColAllLocateSelectedGroupViewport = (
  sheet: Sheet,
  col: number
) => {
  const state = sheet.getState();
  const { selectGroupViewport } = sheet.getState();
  return (
    isColLocateSelectedGroupViewport(sheet, col) &&
    selectGroupViewport.y === 0 &&
    selectGroupViewport.yEnd === state.rows.length - 1
  );
};
