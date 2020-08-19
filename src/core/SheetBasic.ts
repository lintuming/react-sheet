import { Cell, SheetData, SheetInternalState, Rect, RowOrCol } from 'types';

import { throwError, deleteAt } from 'utils';
import {
  DRAGGER_SIZE,
  DefaultStyleConfig,
  EmptyCell,
  RESIZER_SIZE,
} from 'consts';
import SheetManager from './SheetManage';
import { Injection } from './types';
import { EventEmmit } from './EventEmmit';
import { Noop } from './SheetTags';
import { produce } from 'immer';
type SheetEventNames =
  | 'UpdateState'
  | 'UpdateColSize'
  | 'UpdateRowSize'
  | 'UpdateCells';

type Operation<T extends SheetEventNames, P, M = any> = {
  type: T;
  payload: P;
  meta?: M;
};
export type SheetOperations =
  | Operation<'UpdateState', Partial<SheetInternalState>>
  | Operation<
      'UpdateColSize',
      {
        key: number | 'defaultSize';
        value: number;
      }
    >
  | Operation<
      'UpdateRowSize',
      {
        key: number | 'defaultSize';
        value: number;
      }
    >
  | Operation<
      'UpdateCells',
      {
        x: number;
        y: number;
        value?: Partial<Cell> | null;
      }
    >;

const getGridRect = (
  startPoint: [number, number],
  row: RowOrCol,
  cols: RowOrCol,
  canvasSize: {
    canvasWidth: number;
    canvasHeight: number;
    domWidth: number;
    domHeight: number;
  }
) => {};

class SheetBasic extends EventEmmit<
  SheetEventNames,
  SheetOperations,
  (event: SheetOperations) => void
> {
  sheetManager: SheetManager;

  injection: Injection;

  utils: SheetUtils;
  protected state: SheetInternalState;

  styleConfig: typeof DefaultStyleConfig;
  constructor(data: SheetData, sheetManager: SheetManager) {
    super();
    this.state = {
      ...data,
      gridRect: [0, 0],
      selectedRect: [0, 0, 0, 0],
      selectedRangeRect: [0, 0, 3, 4],
      tag: Noop,
    };
    this.styleConfig = DefaultStyleConfig;
    this.sheetManager = sheetManager;
    this.injection = sheetManager.injection;
    this.utils = new SheetUtils(this, () => this.state);
  }
  getState(): Readonly<SheetInternalState> {
    return this.state;
  }
  setState(
    _state:
      | Partial<SheetInternalState>
      | ((state: SheetInternalState) => Partial<SheetInternalState>)
  ) {
    this.dispatch(state => {
      _state = typeof _state === 'function' ? _state(state) : _state;
      if (state === _state) return null;
      return { type: 'UpdateState', payload: _state };
    });
  }

  updateCell(x: number, y: number, cell?: Partial<Cell> | null) {
    this.dispatch({
      type: 'UpdateCells',
      payload: {
        x,
        y,
        value: cell,
      },
    });
  }
  updateColSize(index: number | 'defaultSize', value: number) {
    this.dispatch({
      type: 'UpdateColSize',
      payload: {
        key: index,
        value,
      },
    });
  }
  updateRowSize(index: number | 'defaultSize', value: number) {
    this.dispatch({
      type: 'UpdateRowSize',
      payload: {
        key: index,
        value,
      },
    });
  }

  updateCellsInMergeRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cell: Cell
  ) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        this.updateCell(
          x,
          y,
          cell === EmptyCell
            ? null
            : {
                text: y === y1 && x === x1 ? cell.text : '',
                style: { ...cell.style },
              }
        );
      }
    }
  }
  dispatch(
    _action:
      | SheetOperations
      | ((state: SheetInternalState) => SheetOperations | null)
      | null
  ) {
    if (!_action) return;
    let action: SheetOperations;
    if (typeof _action === 'function') {
      const temp = _action(this.state);
      if (!temp) return;
      action = temp;
    } else {
      action = _action;
    }
    const changes = [];
    const inver = [];
    switch (action.type) {
      case 'UpdateState':
        {
          const payload = action.payload;
          this.state = produce(
            this.state,
            state => {
              Object.assign(state, payload);
            },
            (c, ic) => {
              changes.push(...c);
              inver.push(...ic);
              console.log(c, ic, 'cc');
            }
          );
        }
        break;
      case 'UpdateCells': {
        const { x, y, value } = action.payload;
        this.state = produce(
          this.state,
          state => {
            if (!state.matrix[y]) state.matrix[y] = {};
            if (!value) {
              delete state.matrix[y][x];
            } else {
              state.matrix[y][x] = {
                ...state.matrix[y][x],
                ...value,
              };
            }
          },
          (c, ic) => {
            changes.push(...c);
            inver.push(...ic);
            console.log(c, ic, 'cc');
          }
        );
        break;
      }
      case 'UpdateColSize': {
        const { key, value } = action.payload;
        this.state = produce(
          this.state,
          state => {
            state.cols[key] = value;
          },
          (c, ic) => {
            changes.push(...c);
            inver.push(...ic);
            console.log(c, ic, 'cc');
          }
        );
        // this.state.cols[key] = value;
        break;
      }
      case 'UpdateRowSize': {
        const { key, value } = action.payload;
        this.state = produce(
          this.state,
          state => {
            state.rows[key] = value;
          },
          (c, ic) => {
            changes.push(...c);
            inver.push(...ic);
            console.log(c, ic, 'cc');
          }
        );
        // this.state.rows[key] = value;
        break;
      }
    }
    this.emit(action.type, action);
  }

  get colsLength() {
    return this.state.cols.length;
  }

  get rowsLength() {
    return this.state.rows.length;
  }
}

export class Utils {
  getState: () => SheetInternalState;
  constructor(getState: () => SheetInternalState) {
    this.getState = getState;
  }
}

export class SheetUtils {
  sheetBase: SheetBasic;

  protected getState: () => SheetInternalState;

  constructor(sheetBase: SheetBasic, getState: () => SheetInternalState) {
    this.sheetBase = sheetBase;
    this.getState = getState;
  }

  get state() {
    return this.getState();
  }

  get injection() {
    return this.sheetBase.injection;
  }

  get styleConfig() {
    return this.sheetBase.styleConfig;
  }

  get colsLength() {
    return this.sheetBase.colsLength;
  }

  get rowsLength() {
    return this.sheetBase.rowsLength;
  }

  // getRectCell() {
  //   const [x1, y1] = this.state.selectedRect;
  //   return this.getCell(x1, y1);
  // }

  // isRectInViewport([x1, y1, x2, y2]: Rect) {
  //   const [x, y] = this.state.startIndexs;
  //   const { viewHeight, viewWidth } = this.gridViewportSize();
  //   const [xEnd] = this.colAdvance(x, viewWidth);
  //   const [yEnd] = this.rowAdvance(y, viewHeight);
  //   return x1 <= xEnd && x2 >= x && y1 <= yEnd && y2 >= y;
  // }

  /**
   *  Merge
   */
  // getRectByRects(...rects: [number, number, number, number][]) {
  //   let x1, y1, x2, y2;
  //   [x1, y1, x2, y2] = rects[0];
  //   for (let i = 0; i < rects.length; i++) {
  //     const [rectX1, rectY1, rectX2, rectY2] = rects[i];
  //     x1 = Math.min(x1, rectX1, rectX2);
  //     y1 = Math.min(y1, rectY1, rectY2);
  //     x2 = Math.max(x2, rectX1, rectX2);
  //     y2 = Math.max(y2, rectY1, rectY2);
  //   }
  //   return [x1, y1, x2, y2] as const;
  // }

  // enlargeRectToContainMerges(x1: number, y1: number, x2: number, y2: number) {
  //   let xStart = x1,
  //     yStart = y1,
  //     xEnd = x2,
  //     yEnd = y2;
  //   const merges = this.state.merges.sort((a, z) => {
  //     return a[0] - z[0] + (a[1] - z[1]);
  //   });
  //   if (merges && merges.length > 0) {
  //     for (let i = 0; i < merges.length; i += 1) {
  //       const [mergeXStart, mergeYStart, mergeXEnd, mergeYEnd] = merges[i];
  //       // collision
  //       if (
  //         xStart <= mergeXEnd &&
  //         xEnd >= mergeXStart &&
  //         yStart <= mergeYEnd &&
  //         yEnd >= mergeYStart
  //       ) {
  //         xStart = Math.min(xStart, mergeXStart);
  //         yStart = Math.min(yStart, mergeYStart);
  //         xEnd = Math.max(xEnd, mergeXEnd);
  //         yEnd = Math.max(yEnd, mergeYEnd);
  //       }
  //     }
  //   }
  //   return [xStart, yStart, xEnd, yEnd] as const;
  // }

  mergesAfterUnmerge(index: number) {
    const state = this.state;
    const merges = [...state.merges];
    merges[index] = merges[merges.length - 1];
    merges.length -= 1;
    return merges;
  }

  mergesAfterUnmergeByGrid(x: number, y: number) {
    const merge = this.isGridLocateMergeRect(x, y);
    if (merge) {
      return this.mergesAfterUnmerge(merge.index);
    }
    return this.getState().merges;
  }
  mergesAfterMergeRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): SheetInternalState['merges'] {
    const merges = this.state.merges;
    if (merges.length > 0) {
      for (let i = 0; i < merges.length; i++) {
        const range = merges[i];
        const [rangeX, rangeY, rangeXEnd, rangeYEnd] = range;
        if (
          x1 <= rangeX &&
          y1 <= rangeY &&
          x2 >= rangeXEnd &&
          y2 >= rangeYEnd
        ) {
          deleteAt(merges, i);
          i--;
        }
      }
    }
    return [...merges, [x1, y1, x2, y2]];
  }
  mergesAfterMergeSelectedRange() {
    const selectedRangeRect = this.state.selectedRangeRect;
    return this.mergesAfterMergeRect(...selectedRangeRect);
  }

  // isTwoRectSame(rect1: Rect, rect2: Rect) {
  //   for (let i = 0; i < 4; i++) {
  //     if (rect1[i] !== rect2[i]) {
  //       return false;
  //     }
  //   }
  //   return true;
  // }

  // firstNotEmptyCellInRect(x1: number, y1: number, x2: number, y2: number) {
  //   const matrix = this.state.matrix;
  //   for (let y = y1; y <= y2; y++) {
  //     for (let x = x1; x <= x2 && matrix[y]; x++) {
  //       const cell = this.getCell(x, y);
  //       if (cell === EmptyCell) {
  //         continue;
  //       }
  //       return cell;
  //     }
  //   }
  //   return EmptyCell;
  // }

  /**
   *  Get Data
   */
  // getCell(x: number, y: number): Cell {
  //   const { state } = this;
  //   if (x < 0 || y < 0) {
  //     return this.getIndexCell(x, y);
  //   }
  //   const cells = state.matrix[y];
  //   if (cells) {
  //     return cells[x] ?? EmptyCell;
  //   }
  //   return EmptyCell;
  // }  
  
  // getIndexCell(x: number, y: number): Cell {
  //   const indexStylConfig = this.styleConfig.indexCell;
  //   if (x === -1 || y === -1) {
  //     if (y < 0) {
  //       let styles = indexStylConfig.default;
  //       if (this.isColSubsetSelected(x)) {
  //         if (this.isColSubsetSelectedAll(x)) {
  //           styles = indexStylConfig.focus;
  //         } else {
  //           styles = indexStylConfig.subsetSelected;
  //         }
  //       }

  //       return {
  //         text: __DEV__
  //           ? `${this.stringAt(x + 1)}(${x})`
  //           : this.stringAt(x + 1),
  //         style: styles,
  //       };
  //     }
  //     if (x < 0) {
  //       let styles = indexStylConfig.default;
  //       if (this.isRowSubsetSelected(y)) {
  //         if (this.isRowSubsetSelectedAll(y)) {
  //           styles = indexStylConfig.focus;
  //         } else {
  //           styles = indexStylConfig.subsetSelected;
  //         }
  //       }

  //       return {
  //         text: __DEV__ ? `${y + 1}(${y})` : `${y + 1}`,
  //         style: styles,
  //       };
  //     }
  //   }
  //   throwError('Expect one the indexs is -1 ');
  // }
  // getRowSize(index: number) {
  //   return this.state.rows[index] ?? this.state.rows.defaultSize;
  // }
  // getColSize(index: number) {
  //   return this.state.cols[index] ?? this.state.cols.defaultSize;
  // }


  /**
   *  Status check
   */
  isGridLocateMergeRect(x: number, y: number) {
    const merges = this.state.merges;
    if (merges.length > 0) {
      for (let i = 0; i < merges.length; i += 1) {
        const range = merges[i];
        const [xStart, yStart, xEnd, yEnd] = range;
        if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
          return { rect: range, index: i };
        }
      }
    }
    return null;
  }
  isSelectedRangeMatchMergesRect() {
    return this.isRectMatchMergesRect(...this.state.selectedRangeRect);
  }
  isRectMatchMergesRect(x1: number, y1: number, x2: number, y2: number) {
    const merges = this.state.merges;
    [x1, y1, x2, y2] = this.getRectByRects([x1, y1, x2, y2]);
    for (let merge of merges) {
      const [mx1, my1, mx2, my2] = merge;
      if (x1 === mx1 && x2 === mx2 && y1 === my1 && y2 === my2) {
        return true;
      }
    }
    return false;
  }
  // isColSubsetSelectedAll(x: number) {
  //   const { selectedRangeRect } = this.state;
  //   const [_, yStart, __, yEnd] = selectedRangeRect;
  //   return (
  //     this.isColSubsetSelected(x) &&
  //     yStart === 0 &&
  //     yEnd === this.rowsLength - 1
  //   );
  // }

  isCursorOnSerieBox(offsetX: number, offsetY: number) {
    const { state } = this;
    const [
      rangeXStart,
      rangeYStart,
      rangeXEnd,
      rangeYEnd,
    ] = state.selectedRangeRect;
    const x = Math.max(rangeXEnd, rangeXStart);
    const y = Math.max(rangeYEnd, rangeYStart);
    const width = this.getColSize(x);
    const height = this.getRowSize(y);
    const pos = this.distanceToCanvasOrigin(x, y);

    if (pos) {
      const size = DRAGGER_SIZE;
      const draggerXStart = pos[0] + width - size / 2;
      const draggerYStart = pos[1] + height - size / 2;
      const draggerXEnd = draggerXStart + size;
      const draggerYEnd = draggerYStart + size;

      return (
        offsetX >= draggerXStart &&
        offsetX <= draggerXEnd &&
        offsetY >= draggerYStart &&
        offsetY <= draggerYEnd
      );
    }

    return false;
  }
  // isRowSubsetSelectedAll(y: number) {
  //   const { selectedRangeRect } = this.state;
  //   const [xStart, _, xEnd] = selectedRangeRect;
  //   return (
  //     this.isRowSubsetSelected(y) &&
  //     xStart === 0 &&
  //     xEnd === this.colsLength - 1
  //   );
  // }
  // isRowSubsetSelected(index: number) {
  //   const start = 1;
  //   const { state } = this;

  //   return (
  //     index >= state.selectedRangeRect[start] &&
  //     index <= state.selectedRangeRect[start + 2]
  //   );
  // }
  // isColSubsetSelected(index: number) {
  //   const start = 0;
  //   const { state } = this;
  //   return (
  //     index >= state.selectedRangeRect[start] &&
  //     index <= state.selectedRangeRect[start + 2]
  //   );
  // }

  /**
   *  Iterator
   */

  // *createColIterator(
  //   start: number = 0,
  //   end: number = this.colsLength,
  //   offsetBound: number = Number.MAX_SAFE_INTEGER
  // ) {
  //   let girdOffset = 0;
  //   let i = start;

  //   for (; i < end && girdOffset < offsetBound; i++) {
  //     const size = this.getColSize(i);
  //     const payload = {
  //       size,
  //       offset: girdOffset,
  //       index: i,
  //     };
  //     yield payload;
  //     girdOffset += size;
  //   }
  // }
  // distanceOfCols(col: number, col2: number) {
  //   if (col > col2) {
  //     let temp = col;
  //     col = col2;
  //     col2 = temp;
  //   }
  //   const cols = this.state.cols;
  //   let len = col2 - col;
  //   let ans = (col2 - col) * cols.defaultSize;
  //   const keys = Object.keys(cols);
  //   const keysLen = keys.length - 2;
  //   if (len < keysLen) {
  //     for (let i = col; i < col2; i++) {
  //       if (cols[i] != null) {
  //         ans += cols[i] - cols.defaultSize;
  //       }
  //     }
  //   } else {
  //     for (let i = 0; i < keys.length; i++) {
  //       // this skip -1 and defaultSize;
  //       const n = Number(keys[i]);
  //       if (n >= 0 && n >= col && n < col2) {
  //         ans += cols[n] - cols.defaultSize;
  //       }
  //     }
  //   }
  //   return ans;
  // }

  /**
   *
   * @param col - advance from
   * @param advance - the distance to advance
   */
  // colAdvance(col: number, advance: number) {
  //   let distanceToCol = 0;
  //   let i = col;
  //   while (true) {
  //     const nextDistance = distanceToCol + this.getColSize(i);
  //     if (nextDistance >= advance) {
  //       break;
  //     }
  //     distanceToCol = nextDistance;
  //     i++;
  //   }
  //   return [i, distanceToCol] as const;
  // }

  // *createRowIterator(
  //   start: number = 0,
  //   end: number = this.rowsLength,
  //   offsetBound: number = Number.MAX_SAFE_INTEGER
  // ) {
  //   let girdOffset = 0;
  //   let i = start;

  //   for (; i < end && girdOffset < offsetBound; i++) {
  //     const size = this.getRowSize(i);
  //     const payload = {
  //       size,
  //       offset: girdOffset,
  //       index: i,
  //     };
  //     yield payload;
  //     girdOffset += size;
  //   }
  // }
  // rowAdvance(row: number, advance: number) {
  //   let distanceTorow = 0;
  //   let i = row;
  //   while (true) {
  //     const nextDistance = distanceTorow + this.getRowSize(i);
  //     if (nextDistance >= advance) {
  //       break;
  //     }
  //     distanceTorow = nextDistance;
  //     i++;
  //   }
  //   return [i, distanceTorow];
  // }
  // distanceOfRows(row1: number, row2: number) {
  //   if (row1 > row2) {
  //     let temp = row1;
  //     row1 = row2;
  //     row2 = temp;
  //   }
  //   const rows = this.state.rows;
  //   let len = row2 - row1;
  //   let ans = (row2 - row1) * rows.defaultSize;
  //   const keys = Object.keys(rows);
  //   const keysLen = keys.length - 2;
  //   if (len < keysLen) {
  //     for (let i = row1; i < row2; i++) {
  //       if (rows[i] != null) {
  //         ans += rows[i] - rows.defaultSize;
  //       }
  //     }
  //   } else {
  //     for (let i = 0; i < keys.length; i++) {
  //       // this skip -1 and defaultSize;
  //       const n = Number(keys[i]);
  //       if (n >= 0 && n >= row1 && n < row2) {
  //         ans += rows[n] - rows.defaultSize;
  //       }
  //     }
  //   }
  //   return ans;
  // }

  // *createCellsIterator({
  //   rect,
  //   xOffsetBound,
  //   yOffsetBound,
  //   skipEmpty,
  // }: {
  //   rect: [number, number, number, number];
  //   skipEmpty?: boolean;
  //   xOffsetBound: number;
  //   yOffsetBound: number;
  // }) {
  //   const [xStart, yStart, xEnd, yEnd] = rect;
  //   let xOffset = 0;
  //   let yOffset = 0;
  //   let y = yStart;
  //   let x = xStart;

  //   for (; y < yEnd && yOffset < yOffsetBound; y++) {
  //     const height = this.getRowSize(y);
  //     xOffset = 0;
  //     x = xStart;
  //     for (; x < xEnd && xOffset < xOffsetBound; x++) {
  //       const cell = this.getCell(x, y);
  //       if (skipEmpty && cell === EmptyCell) {
  //         continue;
  //       }
  //       const width = this.getColSize(x);
  //       const payload = {
  //         cell,
  //         width,
  //         height,
  //         x,
  //         y,
  //         xOffset,
  //         yOffset,
  //       };

  //       yield payload;
  //       xOffset += width;
  //     }
  //     yOffset += height;
  //   }
  // }

  /**
   * Maths
   */

  // getBoundingClientRect(x1: number, y1: number, x2: number, y2: number) {
  //   let width = this.getColSize(x1);
  //   let height = this.getRowSize(y1);
  //   const [canvasOffsetX, canvasOffsetY] = this.distanceToCanvasOrigin(
  //     x1,
  //     y1,
  //     false
  //   );
  //   if (x1 === x2 && y1 === y2) {
  //     return {
  //       width,
  //       height,
  //       canvasOffsetX,
  //       canvasOffsetY,
  //     };
  //   }
  //   const endCanvasOffset = this.distanceToCanvasOrigin(x2 + 1, y2 + 1, false)!;
  //   width = endCanvasOffset[0] - canvasOffsetX;
  //   height = endCanvasOffset[1] - canvasOffsetY;
  //   return {
  //     canvasOffsetX,
  //     canvasOffsetY,
  //     width,
  //     height,
  //   };
  // }
  // gridViewportSize() {
  //   const { domWidth, domHeight } = this.injection.getCanvasSize();
  //   return {
  //     viewHeight: Math.min(domHeight),
  //     viewWidth: Math.min(domWidth),
  //   };
  // }

  // lastStartIndex(which: 'col' | 'row') {
  //   const { domWidth, domHeight } = this.injection.getCanvasSize();
  //   const { state } = this;
  //   const isRow = which === 'row';
  //   const items = isRow ? state.rows : state.cols;
  //   const viewRange = isRow ? domHeight - items[-1] : domWidth - items[-1];
  //   let last = isRow ? this.rowsLength : this.colsLength;
  //   let sum = 0;

  //   while (last--) {
  //     const size = items[last] ?? items.defaultSize;
  //     sum += size;
  //     if (sum > viewRange) {
  //       return last + 1;
  //     }
  //   }
  //   return last;
  // }

  // wheelOffsetToGridIndex(
  //   which: 'col' | 'row',
  //   offset: number,
  //   forceMove?: number
  // ): [number, number] {
  //   let i = 0;
  //   let sum = 0;
  //   const isRow = which === 'row';
  //   const { state } = this;
  //   const items = isRow ? state.rows : state.cols;
  //   const lastPageStartIndex = this.lastStartIndex(which);

  //   while (sum < offset && i < lastPageStartIndex) {
  //     sum += items[i] ?? items.defaultSize;
  //     i++;
  //   }
  //   const didChanged = state.startIndexs[isRow ? 1 : 0] !== i;

  //   if (!didChanged && forceMove != null) {
  //     if (forceMove > 0 && i < lastPageStartIndex) {
  //       sum += items[i] ?? items.defaultSize;
  //       i++;
  //     } else if (forceMove < 0) {
  //       i--;
  //       sum -= items[i] ?? items.defaultSize;
  //     }
  //   }
  //   return [i, sum];
  // }

  // distanceViewportStart(x: number, y: number, onlyInView = true) {
  //   const { state } = this;

  //   // we treat the startIndex as origin
  //   const [colStartIdx, rowStartIdx] = state.startIndexs;
  //   const { domWidth, domHeight } = this.injection.getCanvasSize();
  //   const xOffsetBound = onlyInView ? domWidth : Number.MAX_SAFE_INTEGER;
  //   const yOffsetBound = onlyInView ? domHeight : Number.MAX_SAFE_INTEGER;

  //   const xSign = x < colStartIdx ? -1 : 1;
  //   const ySign = y < rowStartIdx ? -1 : 1;

  //   let xDistance =
  //     x < 0 ? -1 * state.cols[-1] : xSign * this.distanceOfCols(x, colStartIdx);
  //   let yDistance =
  //     y < 0 ? -1 * state.rows[-1] : ySign * this.distanceOfRows(y, rowStartIdx);

  //   if (
  //     onlyInView &&
  //     (xDistance > xOffsetBound ||
  //       yDistance > yOffsetBound ||
  //       (xDistance < 0 && x >= 0) ||
  //       (yDistance < 0 && y >= 0))
  //   ) {
  //     return null;
  //   }
  //   return [xDistance, yDistance] as const;
  // }

  // distanceToCanvasStart(x: number, y: number, onlyInView = true) {
  //   const gridOffset = this.distanceToStartIndex(x, y, onlyInView);
  //   if (gridOffset) {
  //     const { state } = this;
  //     return [
  //       gridOffset[0] + state.cols[-1],
  //       gridOffset[1] + state.rows[-1],
  //     ] as const;
  //   }
  //   return null;
  // }

  // mouseCoordToCellCoord(offsetX: number, offsetY: number) {
  //   const { state } = this;
  //   let [x, y] = state.startIndexs;
  //   let gridOffsetX = 0;
  //   let gridOffsetY = 0;

  //   // the cursor is on the rows
  //   if (offsetX <= state.cols[-1]) {
  //     x = -1;
  //   }
  //   // the cursor is on the cols
  //   if (offsetY <= state.rows[-1]) {
  //     y = -1;
  //   }
  //   if (x >= 0) {
  //     offsetX -= state.cols[-1];
  //     const [i, offset] = this.colAdvance(x, offsetX);

  //     x = i;
  //     gridOffsetX = offset;
  //   }
  //   if (y >= 0) {
  //     offsetY -= state.rows[-1];
  //     const [i, offset] = this.rowAdvance(y, offsetY);

  //     y = i;
  //     gridOffsetY = offset;
  //   }

  //   return [x, y, gridOffsetX, gridOffsetY] as const;
  // }






  // getSizeAfterResize(
  //   resizingCol: number,
  //   resizingRow: number,
  //   mouseOffset?: number
  // ) {
  //   const { state } = this;
  //   const originWidth = this.getColSize(resizingCol);
  //   const originHeight = this.getRowSize(resizingRow);
  //   const [canvasOffsetX, canvasOffsetY] = this.distanceToCanvasOrigin(
  //     state.resizingCol ?? state.startIndexs[0], // If no colToReisize ,use whatever indexs
  //     state.resizingRow ?? state.startIndexs[1]
  //   );

  //   if (mouseOffset == null) {
  //     return [originWidth, originHeight];
  //   }
  //   const { domWidth, domHeight } = this.injection.getCanvasSize();
  //   const width = Math.min(
  //     Math.max(mouseOffset - canvasOffsetX, RESIZER_SIZE + 2),
  //     domWidth - RESIZER_SIZE - canvasOffsetX
  //   );
  //   const height = Math.min(
  //     Math.max(mouseOffset - canvasOffsetY, RESIZER_SIZE + 2),
  //     domHeight - RESIZER_SIZE - canvasOffsetY
  //   );
  //   return [width, height];
  // }

  // stringAt(index: number | string) {
  //   index = Number(index);
  //   let ans = '';

  //   while (index !== 0) {
  //     index -= 1;
  //     const r = index % 26;

  //     index = Math.floor(index / 26);
  //     ans = String.fromCharCode('A'.charCodeAt(0) + r) + ans;
  //   }
  //   return ans;
  // }
}

export default SheetBasic;
