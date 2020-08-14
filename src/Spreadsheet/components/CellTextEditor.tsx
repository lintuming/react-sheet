import React from 'react';
import { useSheetManger } from 'Spreadsheet';

type CellTextEditorProps = {
  hidden?: boolean;
};
export default function CellTextEditor({ hidden }: CellTextEditorProps) {
  const { sheetManager } = useSheetManger();
  const sheet = sheetManager.sheet;
  const state = sheet.getState();
  const cell = sheet.utils.getCellOfSelectedRect();
  if (hidden || !sheet.utils.isRectInViewport(state.selectedRect)) {
    return null;
  }

  return <div onChange={} contentEditable></div>;
}
