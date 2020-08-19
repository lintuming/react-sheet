import { SheetInternalState, Cell, Viewport } from 'types';
import {
  getRowSize,
  isRowLocateSelectedGroupViewport,
  isRowAllLocateSelectedGroupViewport,
} from './row';
import {
  getColSize,
  isColLocateSelectedGroupViewport,
  isColAllLocateSelectedGroupViewport,
} from './col';
import Sheet from 'core/Sheet';
import { EmptyCell } from 'consts';
import { throwError } from 'utils';

export const getCell = (sheet: Sheet, x: number, y: number): Cell => {
  const state = sheet.getState();
  if (x < 0 || y < 0) {
    return getIndexCell(sheet, x, y);
  }
  const cells = state.matrix[y];
  if (cells) {
    return cells[x] ?? EmptyCell;
  }
  return EmptyCell;
};

export const stringAt = (index: number | string) => {
  index = Number(index);
  let ans = '';

  while (index !== 0) {
    index -= 1;
    const r = index % 26;

    index = Math.floor(index / 26);
    ans = String.fromCharCode('A'.charCodeAt(0) + r) + ans;
  }
  return ans;
};
export const getIndexCell = (sheet: Sheet, x: number, y: number) => {
  const indexStylConfig = sheet.styleConfig.indexCell;
  if (x === -1 || y === -1) {
    if (y < 0) {
      let styles = indexStylConfig.default;
      if (isColLocateSelectedGroupViewport(sheet, x)) {
        if (isColAllLocateSelectedGroupViewport(sheet, x)) {
          styles = indexStylConfig.focus;
        } else {
          styles = indexStylConfig.subsetSelected;
        }
      }

      return {
        text: __DEV__ ? `${stringAt(x + 1)}(${x})` : stringAt(x + 1),
        style: styles,
      };
    }
    if (x < 0) {
      let styles = indexStylConfig.default;
      if (isRowLocateSelectedGroupViewport(sheet, y)) {
        if (isRowAllLocateSelectedGroupViewport(sheet, y)) {
          styles = indexStylConfig.focus;
        } else {
          styles = indexStylConfig.subsetSelected;
        }
      }

      return {
        text: __DEV__ ? `${y + 1}(${y})` : `${y + 1}`,
        style: styles,
      };
    }
  }
  throwError('Expect one the indexs is -1 ');
};

export const viewportCellIterator = function*(
  sheet: Sheet,
  skipEmpty: boolean = true
) {
  const state = sheet.getState();
  let { x, y, xEnd, yEnd } = state.viewport;
  let xOffset = 0;
  let yOffset = 0;

  let i = y,
    j = x;
  for (; i < yEnd; i++) {
    const height = getRowSize(sheet, i);
    xOffset = 0;
    j = x;
    for (; j < xEnd; j++) {
      const cell = getCell(sheet, x, y);
      if (skipEmpty && cell === EmptyCell) {
        continue;
      }
      const width = getColSize(sheet, j);
      const payload = {
        cell,
        width,
        height,
        x,
        y,
        xOffset,
        yOffset,
      };
      yield payload;
      xOffset += width;
    }
    yOffset += height;
  }
};

export const getViewportRenderCell = (sheet: Sheet, viewport: Viewport) => {
  return getCell(sheet, viewport.x, viewport.y);
};
