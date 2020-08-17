import React, { DependencyList, EffectCallback } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export const useMutableValue = <T>(v: T) => {
  const ref = React.useRef<T>(v);
  useIsomorphicLayoutEffect(() => {
    ref.current = v;
  });
  return ref;
};
