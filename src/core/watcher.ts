import { assert, deepClone, shallowEqual } from 'utils';
import { SheetInternalState } from 'types';

const didChange = <T, F>(value: T, value2: F) => !shallowEqual(value, value2);

interface Notify<F> {
  (descriptor: F): void;
}
const proxyAndNotify = <T extends Object, F>(
  subject: T,
  {
    current = 1,
    depth = Number.MAX_SAFE_INTEGER,
    notify,
    createDescriptor,
  }: {
    notify: Notify<F>;
    createDescriptor: (path: string, prop: string | number, value: any) => F;
    depth?: number;
    current?: number;
  },
  path = ''
) => {
  if (current > depth) {
    return subject;
  }
  const keys = Object.keys(subject);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const item = subject[key];

    if (typeof item === 'object') {
      subject[key] = proxyAndNotify(
        item,
        {
          depth,
          current: current + 1,
          notify,
          createDescriptor,
        },
        path ? `${path}.${key}` : key
      );
    } else {
      subject[key] = item;
    }
  }
  const o = new Proxy(subject, {
    set(target, prop, value, receiver) {
      assert(typeof prop !== 'symbol');
      const changed = didChange(target[prop], value);
      console.log('set', prop, value, target, changed);
      if (typeof value === 'object' && value !== null) {
        value = proxyAndNotify(
          value,
          {
            current: current + 1,
            depth,
            notify,
            createDescriptor,
          },
          path ? `${path}.${prop}` : String(prop)
        );
      }
      const result = Reflect.set(target, prop, value, receiver);
      if (changed) {
        const p = path ? `${path}.${prop}` : String(prop);
        const descriptor = createDescriptor(p, prop, value);
        notify(descriptor);
      }
      return result;
    },
  });

  return o;
};
// Like { prop: "border", path: "matrix.0.0.style.border", value: "1px solid red" }

export type Descriptor = {
  prop: string | number;
  path: string;
  value: any;
  targer: SheetInternalState;
};

const watcher = (subject: SheetInternalState, notify: Notify<Descriptor>) => {
  const proxyTarget = deepClone(subject);
  const createDescriptor = (
    path: string,
    prop: string | number,
    value: any
  ): Descriptor => ({
    prop,
    path,
    value,
    targer: proxyTarget,
  });

  return proxyAndNotify(
    proxyTarget,
    {
      notify,
      depth: 1,
      createDescriptor,
    },
    ''
  );
};

export { watcher };
