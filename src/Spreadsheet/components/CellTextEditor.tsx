import React from 'react';
import { useSheetManger } from 'Spreadsheet';
import Sheet from 'core/Sheet';
import { useIsomorphicLayoutEffect } from 'hooks/useIsomorphicLayoutEffect';
import { useMutableValue } from 'hooks/useMutableValue';
import { CellStyle } from 'types';
import { merge, getBorderWidthFromStyle } from 'utils';
import './CellTextEditor.css';
type CellTextEditorProps = {
  hidden?: boolean;
};
export default function CellTextEditor({ hidden }: CellTextEditorProps) {
  const { sheetManager, forceUpdate } = useSheetManger();
  const sheet = sheetManager.sheet;
  const state = sheet.getState();
  const ref = React.useRef<HTMLDivElement>(null);
  const cell = sheet.utils.getCellOfSelectedRect();

  const applyStyle = <T extends HTMLElement>(
    target: T,
    style: CellStyle,
    extend?: string
  ) => {
    const {
      fillStyle,
      fontSize,
      color,
      fontFamily,
      italic,
      bold,
      lineThrough,
    } = style;
    const _style = `
      background:${fillStyle};
      color:${color};
      font-size:${fontSize}px;
      font-family:${fontFamily};
      font-style:${italic ? 'italic' : 'unset'};
      font-weight:${bold ? 'bold' : 'normal'};
      text-decorator:${lineThrough ? 'line-through' : 'unset'};
      ${extend}
    `;
    target.setAttribute('style', _style);
  };
  React.useEffect(() => {
    sheet.on('UpdateState', event => {
      if (
        event.type === 'UpdateState' &&
        (event.payload.selectedRect || event.payload.startIndexs)
      ) {
        const cell = sheet.utils.getCellOfSelectedRect();
        const current = ref.current;
        if (current) {
          current.innerText = cell.text;
          const sr = sheet.getState().selectedRect;
          const {
            canvasOffsetX,
            canvasOffsetY,
            width,
            height,
          } = sheet.utils.getBoundingClientRect(...sr);
          const cellStyle = merge(sheet.styleConfig.cell, cell.style);
          applyStyle(
            current,
            cellStyle,
            `left:${canvasOffsetX}px;top:${canvasOffsetY}px;min-width:${width + 2}px;min-height:${height + 2}px;border:${sheet.styleConfig.selected.border};`
          );
        }
        forceUpdate();
      }
    });
  }, [forceUpdate, sheet]);
  const inActive =
    !sheetManager.inited ||
    hidden ||
    !sheet.utils.isRectInViewport(state.selectedRect);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [inActive]);
  return (
    <div
      className="react-sheet-cell-text-editor"
      ref={ref}
      hidden={inActive}
      onPaste={e => {}}
      contentEditable
    ></div>
  );
}
