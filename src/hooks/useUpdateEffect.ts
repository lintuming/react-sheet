import React, { DependencyList, EffectCallback } from 'react';

export const useLayoutUpdateEffect = (
  callback: EffectCallback,
  deps: DependencyList
) => {
  const isMounted = React.useRef(false);

  React.useLayoutEffect(() => {
    if (isMounted.current) {
      callback();
    }
  }, deps);
  React.useLayoutEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);
};
