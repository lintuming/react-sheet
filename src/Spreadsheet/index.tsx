import React from 'react';
import { SpreadsheetConfig, SpreadsheetProps } from 'types';

import { dpr, merge, throwError, addMatchMediaListener } from 'utils';
import SheetManager, { SheetManagerEventName } from 'core/SheetManage';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { useLayoutUpdateEffect } from 'hooks/useUpdateEffect';

import LayerUI from './components/LayerUI';
import { ToolBar } from './components/Toolbar';

const defaultConfig: SpreadsheetConfig = {
  initialDatas: [],
  initialIndex: 0,
  width: 1000,
  height: 600,
  showToolbar: true,
  showSheetChenger: true,
};
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
    const off = manager.on(
      [SheetManagerEventName.INIT, SheetManagerEventName.SheetChange],
      forceUpdate
    );

    return () => {
      off();
    };
  }, []);

  return { sheetManager: manager, forceUpdate };
};

const Spreadsheet: React.FC<SpreadsheetProps> = ({
  spreadsheet,
  children,
  ...props
}) => {
  const config = merge(defaultConfig, props);
  const configRef = React.useRef(config);
  const sheetManager = React.useMemo(() => spreadsheet || new SheetManager(), [
    spreadsheet,
  ]);
  const getCanvasSize = () => {
    const domWidth = config.width - SheetManager.barSize;
    const domHeight = config.height - SheetManager.barSize;
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
  const forceUpdate = React.useState([])[1];
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
    addMatchMediaListener(() => {
      forceUpdate([]);
    });
  }, []);

  useLayoutUpdateEffect(() => {
    sheetManager.render();
  }, [props.width, props.height]);

  const { width, height } = config;
  const { canvasWidth, canvasHeight, domHeight, domWidth } = getCanvasSize();

  return (
    <SpreadsheetContext.Provider value={sheetManager}>
      <div
        className={'spreadsheetContainer'}
        style={{
          width: width + 23,
          height: height + 23,
        }}
      >
        <ToolBar></ToolBar>
        <LayerUI width={width} height={height} />
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
  );
};

export default Spreadsheet;
