import React from 'react';
import { SpreadsheetConfig, SpreadsheetProps } from 'types';

import { dpr, merge, throwError, assertIsDefined } from 'utils';
import SheetManager, { SheetManagerEventName } from 'core/SheetManage';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { useLayoutUpdateEffect } from 'hooks/useUpdateEffect';
import { ToolBar } from './components/Toolbar';
import LayerUI from './components/LayerUI';
import { SCROLLBAR_SIZE, DEFAULT_CONFIG } from 'consts';
import useRerender from 'hooks/useRerender';

type Store = {
  sheetManager: SheetManager;
};

const AppContext = React.createContext<Store | null>(null);
export const useSpreadSheetStore = () => {
  const ctx = React.useContext(AppContext);
  assertIsDefined(ctx);
  const { sheetManager } = ctx;
  const rerender = useRerender();
  React.useEffect(() => {
    sheetManager.on(SheetManagerEventName.SheetChange, rerender);
  }, [sheetManager, rerender]);
  return ctx;
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
  const [shouldRenderLayer, _renderLayer] = React.useState(false);
  const renderLayer = () => _renderLayer(true);
  const store: Store = React.useMemo(
    () => ({
      sheetManager,
    }),
    [sheetManager]
  );

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const renderPhaseInjection = React.useRef({
    getCanvas: () => {
      if (canvasRef.current) {
        return canvasRef.current;
      }
      throwError('can not get canvas');
    },
    getConfig: () => configRef.current,
    renderLayer,
    getCanvasSize: () => {
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
    },
  });

  useIsomorphicLayoutEffect(() => {
    configRef.current = config;
  });

  useIsomorphicLayoutEffect(() => {
    sheetManager.inject(renderPhaseInjection.current);
    sheetManager.init();
  }, []);

  useLayoutUpdateEffect(() => {
    sheetManager.render();
  }, [props.width, props.height]);

  const { width, height } = config;
  const {
    canvasWidth,
    canvasHeight,
    domHeight,
    domWidth,
  } = renderPhaseInjection.current.getCanvasSize();

  return (
    <AppContext.Provider value={store}>
      <div
        className={'react-sheet-container'}
        style={{
          width: width,
          height: height,
        }}
      >
        {shouldRenderLayer ? (
          <>
            <ToolBar></ToolBar>
            <LayerUI width={width} height={height} />
          </>
        ) : null}
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
    </AppContext.Provider>
  );
};

export default Spreadsheet;
