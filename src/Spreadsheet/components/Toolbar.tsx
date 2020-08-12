import React from 'react';
import { useSheetManger } from 'Spreadsheet';
import { ActionMerge } from 'actions';

export function ToolBar() {
  const { sheetManager } = useSheetManger();
  const C = ActionMerge.component!;
  return (
    <div>
      <C sheetManager={sheetManager}></C>t
    </div>
  );
}
