import React from 'react';
import { useSheetManger, useSafelyInjection } from 'Spreadsheet';

import { CellStyle } from 'types';
import { merge, getBorderWidthFromStyle, parseBorder } from 'utils';
import './CellTextEditor.css';

export type EditorRef = {
  dom: () => HTMLDivElement | null;
  updateCell: () => void;
};

export default React.forwardRef(function CellTextEditor(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & {
    [key: string]: any;
  },
  handler: React.Ref<EditorRef>
) {
  const { sheetManager, forceUpdate } = useSheetManger();
  const sheet = sheetManager.sheet;
  const ref = React.useRef<HTMLDivElement>(null);
  const injection = useSafelyInjection();

  React.useImperativeHandle(
    handler,
    () => ({
      dom: () => ref.current,
      updateCell: () => {
        const state = sheet.getState();
        sheet.updateCell(state.selectedRect[0], state.selectedRect[1], {
          text: ref.current?.innerText ?? '',
        });
      },
    }),
    [sheet]
  );
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
      underline,
    } = style;
    const _style = `
      background:${fillStyle};
      color:${color};
      font-size:${fontSize}px;
      font-family:${fontFamily};
      font-style:${italic ? 'italic' : 'unset'};
      font-weight:${bold ? 'bold' : 'normal'};
      text-decoration:${
        lineThrough ? 'line-through' : underline ? 'underline' : 'unset'
      };
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
          const cellStyle = merge(sheet.styleConfig.cell, cell.style ?? {});
          const {
            borderTop,
            borderBottom,
            borderLeft,
            borderRight,
          } = getBorderWidthFromStyle(cellStyle);
          const { domWidth } = injection.getCanvasSize();
          const maxWidth = domWidth - canvasOffsetX;
          applyStyle(
            current,
            cellStyle,
            `
            left:${canvasOffsetX - borderLeft}px;
            top:${canvasOffsetY - borderRight}px;
            min-width:${width + borderLeft + borderRight}px;
            min-height:${height + borderTop + borderBottom}px;
            border:${sheet.styleConfig.selected.border};
            max-width:${maxWidth}px;
            `
          );
        }
        forceUpdate();
      }
    });
  }, [forceUpdate, sheet, injection]);

  return (
    <div
      className="react-sheet-cell-text-editor"
      {...props}
      ref={ref}
      onPaste={e => {}}
      contentEditable
    ></div>
  );
});
