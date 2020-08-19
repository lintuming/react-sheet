import React from 'react';
import { SpreadsheetConfig, SpreadsheetProps } from 'types';

import { dpr, merge, throwError, addMatchMediaListener } from 'utils';
import SheetManager, { SheetManagerEventName } from 'core/SheetManage';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { useLayoutUpdateEffect } from 'hooks/useUpdateEffect';
import { ToolBar } from './components/Toolbar';
import LayerUI from './components/LayerUI';
import { SCROLLBAR_SIZE, DEFAULT_CONFIG } from 'consts';
import { Injection } from 'core/types';

const SpreadsheetContext = React.createContext<SheetManager | null>(null);

export const useSheetManger = () => {
  const manager = React.useContext(SpreadsheetContext);

  if (manager === null) {
    throwError(
      'Should use context inside <Spreadsheet/>,this is likely a bug of Spreadsheet'
    );
  }
  const _forceUpdate = React.useState({})[1];
  const forceUpdate = React.useCallback(() => _forceUpdate({}), []);

  useIsomorphicLayoutEffect(() => {
    const off = manager.on([SheetManagerEventName.SheetChange], forceUpdate);
    return () => {
      off();
    };
  }, []);

  return { sheetManager: manager, forceUpdate };
};

const safeCallInjection: Injection = {
  getCanvas: () => null,
  getCanvasSize: () => ({
    canvasWidth: 0,
    canvasHeight: 0,
    domHeight: 0,
    domWidth: 0,
  }),
  getConfig: () => DEFAULT_CONFIG,
  getScrollOffset: () => ({ scrollLeft: 0, scrollTop: 0 }),
  scroll: () => {},
  setCursorType: () => {},
};

export const useSafelyInjection = () => {
  const { sheetManager, forceUpdate } = useSheetManger();
  const deps = React.useRef({});
  useIsomorphicLayoutEffect(() => {
    sheetManager.on(SheetManagerEventName.inject, key => {
      if (deps.current[key]) {
        forceUpdate();
      }
    });
  }, [sheetManager]);

  return React.useMemo(() => {
    return new Proxy({} as Injection, {
      get(_, key) {
        deps.current[key] = true;
        if (!sheetManager.injectionDeps[key as any]) {
          return safeCallInjection[key];
        }
        return sheetManager.injection[key];
      },
      set() {
        // TODO
        throw Error('Unmutable');
      },
    });
  }, [sheetManager]);
};

const Spreadsheet: React.FC<SpreadsheetProps> = ({
  spreadsheet,
  children,
  ...props
}) => {
  const config = merge(DEFAULT_CONFIG, props);
  const configRef = React.useRef(config);
  const sheetManager = React.useMemo(() => spreadsheet || new SheetManager(), [
    spreadsheet,
  ]);
  const getCanvasSize = () => {
    const config = configRef.current;
    const domWidth = config.width - SCROLLBAR_SIZE;
    const domHeight = config.height - SCROLLBAR_SIZE;
    const canvasWidth = domWidth * dpr();
    const canvasHeight = domHeight * dpr();
    return {
      domWidth,
      domHeight,
      canvasWidth,
      canvasHeight,
    };
  };
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useIsomorphicLayoutEffect(() => {
    configRef.current = config;
  });
  useIsomorphicLayoutEffect(() => {
    sheetManager.inject({
      getCanvas: () => {
        if (canvasRef.current) {
          return canvasRef.current;
        }
        throwError('can not get canvas');
      },
      getCanvasSize,
      getConfig: () => configRef.current,
    });
    sheetManager.init();
  }, []);

  useLayoutUpdateEffect(() => {
    sheetManager.render();
  }, [props.width, props.height]);

  const { width, height } = config;
  const { canvasWidth, canvasHeight, domHeight, domWidth } = getCanvasSize();

  return (
    <>
      <SpreadsheetContext.Provider value={sheetManager}>
        <div
          className={'react-sheet-container'}
          style={{
            width: width,
            height: height,
          }}
        >
          <ToolBar></ToolBar>
          <LayerUI width={width} height={domHeight} />
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              width: domWidth,
              height: domHeight,
            }}
          />
          <div>tests</div>
        </div>
      </SpreadsheetContext.Provider>
    </>
  );
};

export default Spreadsheet;
