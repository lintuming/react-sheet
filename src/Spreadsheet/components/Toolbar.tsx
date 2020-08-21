import React from 'react';
import { useSpreadSheetStore } from 'Spreadsheet';
import { ActionMerge } from 'actions';

export function ToolBar() {
  const store = useSpreadSheetStore();
  const sheetManager = store.sheetManager;
  const C = ActionMerge.component!;
  return (
    <div>
      <C sheetManager={sheetManager}></C>t
    </div>
  );
}
