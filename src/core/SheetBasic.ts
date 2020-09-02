import { Cell, SheetData, SheetInternalState } from 'types';

import { DefaultStyleConfig, EmptyCell } from 'consts';
import SheetManager from './SheetManage';
import { Injection } from './types';
import { EventEmmit } from './EventEmmit';
import { Noop } from './SheetTags';
import { produce } from 'immer';

import Viewport, { AutoViewport } from './Viewport';
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
    this.injection = sheetManager.injection;
    // const { domWidth, domHeight } = this.injection.getCanvasSize();
    this.state = {
      ...data,
      gridViewport: new AutoViewport(this, { x: 0, y: 0 }),
      selectedGroupViewport: new Viewport(0, 0, 0, 0),
      selectedViewport: new Viewport(0, 0, 0, 0),
      tag: Noop,
    };

    this.styleConfig = DefaultStyleConfig;
    this.sheetManager = sheetManager;
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

    switch (action.type) {
      case 'UpdateState':
        {
          const payload = action.payload;
          this.state = produce(this.state, state => {
            Object.assign(state, payload);
          });
        }
        break;
      case 'UpdateCells': {
        const { x, y, value } = action.payload;
        this.state = produce(this.state, state => {
          if (!state.matrix[y]) state.matrix[y] = {};
          if (!value) {
            delete state.matrix[y][x];
          } else {
            state.matrix[y][x] = {
              ...state.matrix[y][x],
              ...value,
            };
          }
        });
        break;
      }
      case 'UpdateColSize': {
        const { key, value } = action.payload;
        this.state = produce(this.state, state => {
          state.cols[key] = value;
        });
        // this.state.cols[key] = value;
        break;
      }
      case 'UpdateRowSize': {
        const { key, value } = action.payload;
        this.state = produce(this.state, state => {
          state.rows[key] = value;
        });
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
}

export default SheetBasic;
