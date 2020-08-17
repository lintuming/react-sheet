import React from 'react';
import Scrollor from './Scrollor';
import { sendWheelEvent } from '../utils';
import { useSheetManger } from '..';
import { measureScrollBarInner } from '../maths';
import {
  ActionPointerDown,
  ReactPointerEvent,
  ActionPointerMove,
  ActionPointerUp,
  PointerMoveState,
  initPointerdownState,
  initializeMoveState,
  PointerDownState,
} from 'actions/actionMouse';
import CellTextEditor from './CellTextEditor';

type LayerUIProps = {
  width: number;
  height: number;
  [key: string]: any;
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

const LayerUI: React.FC<LayerUIProps> = ({
  children,
  width,
  height,
  ...props
}) => {
  const { sheetManager, forceUpdate } = useSheetManger();

  const ref = React.useRef<HTMLDivElement>(null);

  const { scrollHeight, scrollWidth } = measureScrollBarInner(sheetManager);
  const isFocus = React.useRef(false);

  React.useEffect(
    function initialize() {
      sheetManager.inject({
        setCursorType: cursorType => {
          if (ref.current) {
            ref.current.style.cursor = cursorType;
          }
        },
      });
      const dipose = sheetManager.sheet.on(
        ['UpdateColSize', 'UpdateRowSize'],
        forceUpdate
      );
      const inactive = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as any)) {
          isFocus.current = false;
          moveState.current = null;
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isFocus.current) {
          sheetManager.actionsManager.handleKeydown(e);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', inactive);
      return () => {
        window.removeEventListener('click', inactive);
        window.removeEventListener('keydown', handleKeyDown);
        dipose();
      };
    },
    [sheetManager.sheet, sheetManager, forceUpdate]
  );

  React.useEffect(
    function listenWheelEvent() {
      if (ref.current) {
        const handleWheel = (e: WheelEvent) => {
          e.stopPropagation();
          e.preventDefault();
          let isVertical = true;
          if (e.ctrlKey) {
            isVertical = false;
          }
          const delta = e.deltaY;
          sendWheelEvent(
            sheetManager,
            sheetManager.sheet.injection.getScrollOffset(),
            {
              delta,
              isVertical,
              scrollWidth,
              scrollHeight,
            }
          );
        };
        const r = ref.current;
        r.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
          r.removeEventListener('wheel', handleWheel);
        };
      }
    },
    [scrollHeight, scrollWidth, sheetManager]
  );

  const moveState = React.useRef<PointerMoveState | null>(null);

  const downState = React.useRef<PointerDownState | null>(null);

  const handlePointerMove = (e: ReactPointerEvent) => {
    e.persist();
    if (!isFocus.current) return;
    if (e.target === ref.current) {
      const _moveState = initializeMoveState(
        sheetManager,
        e,
        downState.current
      );
      moveState.current = _moveState;
      sheetManager.actionsManager.executeAction(ActionPointerMove, _moveState);
    }
  };
  const handlePointerUp = (e: ReactPointerEvent) => {
    if (e.target === ref.current) {
      sheetManager.actionsManager.executeAction(ActionPointerUp, {});
      downState.current = null;
    }
  };
  const handlePointerDown = (e: ReactPointerEvent) => {
    if (e.target === ref.current) {
      isFocus.current = true;
      e.persist();
      setShowEditor(false);
      const pointerDownState = initPointerdownState(
        sheetManager,
        moveState.current,
        e
      );
      downState.current = pointerDownState;
      sheetManager.actionsManager.executeAction(ActionPointerDown, {
        pointerDownState,
      });
    }
  };
  const [showEditor, setShowEditor] = React.useState(false);

  return (
    <div
      ref={ref}
      {...props}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={() => {
        setShowEditor(true);
      }}
      style={{
        position: 'absolute',
        width,
        height,
        ...props.style,
      }}
    >
      <CellTextEditor hidden={!showEditor}></CellTextEditor>
      <Scrollor x={scrollWidth} y={scrollHeight} />
    </div>
  );
};
export default React.memo(LayerUI);
