import React from 'react';
import './ScrollBar.css';
import { useSheetManger } from '..';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { ActionScroll } from 'actions';
import SheetManager from 'core/SheetManage';
import { sendWheelEvent } from '../utils';
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

    const { sheetManager } = useSheetManger();

    if (!sheetManager.inited) {
      return null;
    }
    const {
      domWidth,
      domHeight,
    } = sheetManager.sheet.injection.getCanvasSize();

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
            ? { width: SheetManager.barSize, height: offset }
            : {
                height: SheetManager.barSize,
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
}> = ({ y, x }) => {
  const { sheetManager, forceUpdate } = useSheetManger();
  // the total height and width
  const xRef = React.useRef<HTMLDivElement>(null);
  const yRef = React.useRef<HTMLDivElement>(null);

  const skipScroll = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    return sheetManager.inject({
      getScrollOffset: () => {
        return {
          scrollTop: yRef.current?.scrollTop ?? 0,
          scrollLeft: xRef.current?.scrollLeft ?? 0,
        };
      },
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
    sheetManager.actionsManager.executeAction(ActionScroll, {
      offset,
      vertical,
    });
  };
  const offsetTop = sheetManager.sheet.utils.getRowSize(-1);
  const offsetLeft = sheetManager.sheet.utils.getColSize(-1);

  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.target as HTMLDivElement;
      const isVertical = target === yRef.current;
      const delta = isVertical ? e.deltaY : e.deltaX;
      sendWheelEvent(sheetManager, target, {
        isVertical,
        delta,
        scrollHeight: y,
        scrollWidth: x,
      });
    },
    [y, x, sheetManager]
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
