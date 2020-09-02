import React from 'react';
import Scrollor from './Scrollor';
import { sendWheelEvent } from '../utils';
import { useSpreadSheetStore } from '..';
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
import CellTextEditor, { EditorRef } from './CellTextEditor';
import { CURSOR_TYPE } from 'consts';
import { Injection } from 'core/types';
import useRerender from 'hooks/useRerender';
import throttle from 'lodash.throttle';
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
  const store = useSpreadSheetStore();
  const manager = store.sheetManager;

  const rerender = useRerender();

  const getScrollOffset = React.useRef<Injection['getScrollOffset'] | null>(
    null
  );
  const ref = React.useRef<HTMLDivElement>(null);

  const { scrollHeight, scrollWidth } = measureScrollBarInner(manager);
  const isFocus = React.useRef(false);
  const editorRef = React.useRef<EditorRef>(null);
  React.useEffect(
    function initialize() {
      manager.inject({
        setCursorType: (cursorType: CURSOR_TYPE) => {
          if (ref.current) {
            ref.current.style.cursor = cursorType;
          }
        },
      });
      const dipose = manager.sheet.on(
        ['UpdateColSize', 'UpdateRowSize'],
        rerender
      );
      const inactive = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as any)) {
          isFocus.current = false;
          moveState.current = null;
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isFocus.current) {
          manager.actionsManager.handleKeydown(e);
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
    [manager.sheet, manager, rerender]
  );

  React.useEffect(
    function listenWheelEvent() {
      if (ref.current && getScrollOffset.current) {
        if (getScrollOffset.current) {
          const current = getScrollOffset.current;
          const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            e.preventDefault();
            let isVertical = true;
            if (e.ctrlKey) {
              isVertical = false;
            }
            const delta = e.deltaY;
            sendWheelEvent(manager, current(), {
              delta,
              isVertical,
              scrollWidth,
              scrollHeight,
            });
          };
          const r = ref.current;
          r.addEventListener('wheel', handleWheel, { passive: false });
          return () => {
            r.removeEventListener('wheel', handleWheel);
          };
        }
      }
    },
    [scrollHeight, scrollWidth, manager, getScrollOffset]
  );

  const moveState = React.useRef<PointerMoveState | null>(null);

  const downState = React.useRef<PointerDownState | null>(null);

  const handlePointerMove = React.useCallback(
    (e: ReactPointerEvent) => {
      if (!isFocus.current) return;
      if (e.target === ref.current) {
        const _moveState = initializeMoveState(manager, e, downState.current);
        moveState.current = _moveState;
        manager.actionsManager.executeAction(ActionPointerMove, _moveState);
      }
    },
    [manager]
  );
  const handlePointerUp = (e: ReactPointerEvent) => {
    if (e.target === ref.current) {
      manager.actionsManager.executeAction(ActionPointerUp, {});
      downState.current = null;
    }
  };
  const handlePointerDown = (e: ReactPointerEvent) => {
    if (e.target === ref.current) {
      isFocus.current = true;
      e.persist();
      if (showEditor) {
        hideEditorAndUpdateText();
      }

      const pointerDownState = initPointerdownState(
        manager,
        moveState.current,
        e
      );
      downState.current = pointerDownState;
      manager.actionsManager.executeAction(ActionPointerDown, pointerDownState);
    }
  };
  const [showEditor, setShowEditor] = React.useState(false);

  const handleDoubleClick = () => {
    setShowEditor(true);
    setTimeout(() => {
      editorRef.current?.dom()?.focus();
    }, 0);
  };

  const hideEditorAndUpdateText = () => {
    setShowEditor(false);
    editorRef.current?.updateCell();
  };
  return (
    <div
      ref={ref}
      {...props}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 5,
        ...props.style,
      }}
    >
      {props.children}
      <CellTextEditor ref={editorRef} hidden={!showEditor}></CellTextEditor>
      <Scrollor
        setGetScrollOffset={getOffset => {
          getScrollOffset.current = getOffset;
        }}
        x={scrollWidth}
        y={scrollHeight}
      />
    </div>
  );
};
export default React.memo(LayerUI);
