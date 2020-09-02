import { IS_SERVE } from 'consts';

export function deleteAt<T>(arr: T[], index: number) {
  arr[index] = arr[arr.length - 1];
  arr.length -= 1;
  return arr;
}
export function parseBorder(border: string) {
  const [_lineWidth, lineStyle, strokeStyle] = border.split(/\s+/);
  const lineWidth = parseFloat(_lineWidth);
  return [lineWidth, lineStyle, strokeStyle] as const;
}
export function getBorderWidthFromStyle(style: {
  borderTop?: string;
  borderLeft?: string;
  borderBottom?: string;
  borderRight?: string;
  border?: string;
}) {
  let borderTop = 0,
    borderBottom = 0,
    borderLeft = 0,
    borderRight = 0;
  if (style.border) {
    const [lineWidth] = parseBorder(style.border);
    borderTop = borderBottom = borderLeft = borderRight = lineWidth;
  } else if (style.borderTop) {
    borderTop = parseBorder(style.borderTop)[0];
  } else if (style.borderBottom) {
    borderBottom = parseBorder(style.borderBottom)[0];
  } else if (style.borderLeft) {
    borderLeft = parseBorder(style.borderLeft)[0];
  } else if (style.borderRight) {
    borderRight = parseBorder(style.borderRight)[0];
  }
  return {
    borderBottom,
    borderLeft,
    borderRight,
    borderTop,
  };
}
export function merge<T, F>(config1: T, config2: F = {} as any) {
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

function throwError(msg: string): never {
  throw Error(msg);
}

function invariant(condiction: boolean, msg: string) {
  if (!condiction) {
    throwError(msg);
  }
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
  var propNames = Object.getOwnPropertyNames(obj);

  propNames.forEach(function(name) {
    var prop = obj[name];

    if (typeof prop == 'object' && prop !== null) deepFreeze(prop);
  });

  return Object.freeze(obj);
}
export {
  scheduleUpdate,
  invariant,
  throwError,
  assertIsDefined,
  assert,
  deepFreeze,
  deepClone,
  dpr,
  border,
  addMatchMediaListener,
};
