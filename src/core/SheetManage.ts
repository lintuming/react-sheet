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
  inject = 'inject',
  SheetChange = 'SheetChange',
}

class SheetManager extends EventEmmit<
  SheetManagerEventName,
  any,
  (value: any) => void
> {
  // static barSize = 13;

  readonly injection: Injection;
  actionsManager: ActionsManage;

  sheets: Sheet[];

  private _index: number;
  injectionDeps: {
    [key: string]: boolean;
    [key: number]: boolean;
  };
  scheduleUpdate: ActionManagerNotify;

  constructor() {
    super();
    this.injectionDeps = {
      getCanvas: false,
      getConfig: false,
      scroll: false,
      getCanvasSize: false,
      getScrollOffset: false,
      setCursorType: false,
    };
    this.injection = new Proxy({} as Injection, {
      get: (target, key) => {
        if (this.injectionDeps[key as any]) {
          return Reflect.get(target, key);
        } else {
          throw Error(
            `Injection: \`${String(
              key
            )}\` is not injected yet! this is likely a bug of react-sheet`
          );
        }
      },
      set: (target, key, value) => {
        this.injectionDeps[key as any] = true;
        this.emit(SheetManagerEventName.inject, key);
        return Reflect.set(target, key, value);
      },
    });
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
      this.injection[k] = injection[k] as any;
    }
  }
}

export default SheetManager;
