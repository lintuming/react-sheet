import { IS_SERVE } from 'consts';

const isNaN = (value: unknown): value is typeof NaN =>
  // eslint-disable-next-line
  typeof value === 'number' && value !== value;

export function deleteAt<T>(arr: T[], index: number) {
  arr[index] = arr[arr.length - 1];
  arr.length -= 1;
  return arr;
}

export function merge<T, F>(config1: T, config2: F) {
  const merged = { ...config1 };
  for (const key of Object.keys(config2)) {
    const value = config2[key];
    if (!(key in config1)) {
      merged[key] = value;
    } else {
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          merged[key] = value;
        } else {
          merged[key] = merge(merged[key], value);
        }
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}
function throwWhenCall(msg: string, condiction: boolean = true) {
  return (() => {
    if (condiction) {
      throwError(msg);
    }
  }) as any;
}

function throwError(msg: string): never {
  throw Error(msg);
}

function invariant(condiction: boolean, msg: string) {
  if (!condiction) {
    throwError(msg);
  }
}

enum ErrorMsgs {
  Inject_Error_Msg = 'Uninplement yet! this is likely a bug in Spreadsheet',
}
const query = () =>
  `screen and (min-resolution: ${Math.floor(window.devicePixelRatio) +
    0.5}dppx)`;
let matchMedia = window.matchMedia(query());
const addMatchMediaListener = (callback: () => void) => {
  const _matchMedia = matchMedia;
  const wrap = () => {
    callback();
    _matchMedia.removeEventListener('change', wrap);
    matchMedia = window.matchMedia(query());
    addMatchMediaListener(wrap);
  };
  _matchMedia.addEventListener('change', wrap);
};
const scheduleUpdate =
  'requestAnimationFrame' in global
    ? requestAnimationFrame
    : (callback: any) => {
        setTimeout(callback, 0);
      };

const deepClone = <T>(clone: T): T => {
  return JSON.parse(JSON.stringify(clone));
};

const dpr = () => (IS_SERVE ? 1 : Math.max(window.devicePixelRatio, 1));

function assert(cond: any): asserts cond {
  if (!cond) {
    throw Error('Assert Error');
  }
}
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}

function border(lineWidth: number, style: 'solid' | 'dashed', color: string) {
  return `${lineWidth}px ${style} ${color}`;
}

function deepFreeze<T extends Object>(obj: T) {
  // 取回定义在obj上的属性名
  var propNames = Object.getOwnPropertyNames(obj);

  // 在冻结自身之前冻结属性
  propNames.forEach(function(name) {
    var prop = obj[name];

    // 如果prop是个对象，冻结它
    if (typeof prop == 'object' && prop !== null) deepFreeze(prop);
  });

  // 冻结自身(no-op if already frozen)
  return Object.freeze(obj);
}

const hasOwn = Object.prototype.hasOwnProperty;

function is(A: unknown, B: unknown) {
  if (A === B) {
    return A !== 0 || B !== 0 || 1 / A === 1 / B; //+0 !== -0
  }
  return isNaN(A) && isNaN(B); //NaN
}

function shallowEqual(objA: unknown, objB: unknown) {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}
export {
  throwWhenCall,
  scheduleUpdate,
  invariant,
  throwError,
  assertIsDefined,
  ErrorMsgs,
  assert,
  deepFreeze,
  deepClone,
  shallowEqual,
  dpr,
  isNaN,
  border,
  addMatchMediaListener,
};
