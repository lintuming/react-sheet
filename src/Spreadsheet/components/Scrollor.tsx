import React from 'react';
import './ScrollBar.css';
import { useSpreadSheetStore } from '..';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { ActionScroll } from 'actions';
import { sendWheelEvent } from '../utils';
import { SCROLLBAR_SIZE } from 'consts';
import { getRowSize } from 'core/utils/row';
import { getColSize } from 'core/utils/col';
import { Injection } from 'core/types';
type ScrollBarProps = {
  direction?: 'horizontal' | 'vertical';
  size?: number;
  offset: number;
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

const ScrollBar = React.forwardRef(
  (
    { direction, size, offset, ...rest }: ScrollBarProps,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const isVertical = direction === 'vertical';
    const innerBarStyle = isVertical
      ? {
          height: size,
          width: 1,
        }
      : {
          width: size,
          height: 1,
        };
    const store = useSpreadSheetStore();
    const manager = store.sheetManager;
    const { domWidth, domHeight } = manager.injection.getCanvasSize();

    const warpperStyle = isVertical
      ? ({
          position: 'absolute',
          right: 0,
          top: offset,
          height: domHeight - offset,
        } as const)
      : ({
          position: 'absolute',
          bottom: 0,
          left: offset,
          width: domWidth - offset,
        } as const);
    const thumb = (
      <div
        className={`react-sheet-scrollbar-extendsion ${
          isVertical
            ? 'react-sheet-scrollbar-extendsion-y'
            : 'react-sheet-scrollbar-extendsion-x'
        }`}
        style={{
          ...(isVertical
            ? { width: SCROLLBAR_SIZE, height: offset }
            : {
                height: SCROLLBAR_SIZE,
                width: offset,
              }),
        }}
      ></div>
    );
    return (
      <>
        {thumb}
        <div
          {...rest}
          ref={ref}
          className={`react-sheet-scrollbar ${
            isVertical ? 'react-sheet-scrollbar-y' : 'react-sheet-scrollbar-x'
          }`}
          data-direction={direction}
          style={warpperStyle}
        >
          <div style={innerBarStyle}></div>
        </div>
      </>
    );
  }
);

const Scrollor: React.FC<{
  x: number;
  y: number;
  setGetScrollOffset: (getScrollOffset: Injection['getScrollOffset']) => void;
}> = ({ y, x, setGetScrollOffset }) => {
  const store = useSpreadSheetStore();
  const manager = store.sheetManager;
  // the total height and width
  const xRef = React.useRef<HTMLDivElement>(null);
  const yRef = React.useRef<HTMLDivElement>(null);

  const skipScroll = React.useRef(false);
  const getScrollOfset = React.useCallback(() => {
    return {
      scrollTop: yRef.current?.scrollTop ?? 0,
      scrollLeft: xRef.current?.scrollLeft ?? 0,
    };
  }, []);
  setGetScrollOffset(getScrollOfset);

  useIsomorphicLayoutEffect(() => {
    return manager.inject({
      getScrollOffset: getScrollOfset,
      scroll: (distance, vertical, skipScrollEvent) => {
        skipScroll.current = !!skipScrollEvent;
        if (!vertical) {
          if (xRef.current) {
            xRef.current.scrollLeft = distance;
          }
        } else {
          if (yRef.current) {
            yRef.current.scrollTop = distance;
          }
        }
      },
    });
  }, []);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    const target = e.target as HTMLDivElement;
    const vertical = target === yRef.current;
    const offset = vertical ? target.scrollTop : target.scrollLeft;
    manager.actionsManager.executeAction(ActionScroll, {
      offset,
      vertical,
    });
  };
  const offsetTop = getRowSize(manager.sheet, -1);
  const offsetLeft = getColSize(manager.sheet, -1);

  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.target as HTMLDivElement;
      const isVertical = target === yRef.current;
      const delta = isVertical ? e.deltaY : e.deltaX;
      sendWheelEvent(manager, target, {
        isVertical,
        delta,
        scrollHeight: y,
        scrollWidth: x,
      });
    },
    [y, x, manager]
  );

  useIsomorphicLayoutEffect(() => {
    xRef.current?.addEventListener('wheel', handleWheel, { passive: false });
    yRef.current?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      xRef.current?.removeEventListener('wheel', handleWheel);
      yRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <>
      <ScrollBar
        onScroll={handleScroll}
        ref={yRef}
        offset={offsetTop}
        direction={'vertical'}
        size={y}
      ></ScrollBar>
      <ScrollBar
        ref={xRef}
        onScroll={handleScroll}
        offset={offsetLeft}
        direction={'horizontal'}
        size={x}
      ></ScrollBar>
    </>
  );
};

export default React.memo(Scrollor);
