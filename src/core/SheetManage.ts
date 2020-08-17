import { SheetDataPartial } from 'types';
import { ErrorMsgs, merge, throwError, throwWhenCall } from 'utils';
import { actions } from 'actions';
import { ActionManagerNotify } from 'actions/types';
import { DEFAULT_SHEET_DATA } from 'consts';
import Sheet from './Sheet';
import { ActionsManage } from '../actions/manager';
import { Injection } from './types';
import { EventEmmit } from './EventEmmit';

export enum SheetManagerEventName {
  INIT = 'init',
  SheetChange = 'SheetChange',
}

const throwInjectError = throwWhenCall(ErrorMsgs.Inject_Error_Msg);

class SheetManager extends EventEmmit<
  SheetManagerEventName,
  SheetManager,
  (SheetManager: SheetManager) => void
> {
  static barSize = 13;

  injection: Injection;

  // Send: Injection['send'];
  injected?: boolean;

  actionsManager: ActionsManage;

  sheets: Sheet[];

  private _index: number;

  inited?: boolean;

  scheduleUpdate: ActionManagerNotify;

  constructor() {
    super();
    this.injection = {
      getCanvas: throwInjectError,
      // GetSpreadsheetState: throwInjectError,
      getConfig: throwInjectError,
      scroll: throwInjectError,
      getCanvasSize: throwInjectError,
      getScrollOffset: throwInjectError,
      setCursorType: throwInjectError,
    };
    // Handle actions
    this.scheduleUpdate = (fn, action) => {
      const payload = {
        excute: fn,
        action,
      };

      this.sheet.applyAction(payload);
    };
    this.actionsManager = new ActionsManage(this, this.scheduleUpdate);
    this.actionsManager.registerAll(actions);

    // Core renderer
    this._index = 0;
    this.sheets = [];
  }

  get sheet() {
    if (this.sheets[this.index]) {
      return this.sheets[this.index];
    }

    this.sheets[this.index] = new Sheet(DEFAULT_SHEET_DATA, this);

    return this.sheets[this.index];
  }

  set index(val: number) {
    this.emit(SheetManagerEventName.SheetChange, this);
    this._index = val;
  }

  get index() {
    return this._index;
  }

  render() {
    this.sheet.render();
  }

  init() {
    const { initialDatas, initialIndex } = this.injection.getConfig();

    this.index = initialIndex;
    for (let i = 0; i < initialDatas.length; i++) {
      this.addSheet(initialDatas[i], i === 0);
    }
    this.render();
    this.inited = true;
    this.emit(SheetManagerEventName.INIT, this);
  }

  addSheet(sheetDataInit: SheetDataPartial, active?: boolean) {
    const sheet = new Sheet(merge(DEFAULT_SHEET_DATA, sheetDataInit), this);

    this.sheets.push(sheet);
    if (active) {
      this.index = this.sheets.length - 1;
    }

    return sheet;
  }

  inject(injection: Partial<Injection>) {
    for (const key in injection) {
      const k: keyof Injection = key as any;
      if (this.injection[k] && this.injection[k] !== throwInjectError) {
        throwError(
          `Can not inject ${key} twice, this is likely a bug in Spreadsheet`
        );
      }
      this.injection[k] = injection[k] as any;
    }
  }
}

export default SheetManager;
