import SheetManager from 'core/SheetManage';

export function measureScrollBarInner(sheetMangager: SheetManager) {
  const { sheet } = sheetMangager;
  const data = sheet.getState();
  let vertical = data.rows.defaultSize;
  for (let row of sheet.utils.createRowIterator(0, sheet.rowsLength)) {
    vertical += row.size;
  }
  let horizontal = data.cols.defaultSize;
  for (let col of sheet.utils.createColIterator(0, sheet.colsLength)) {
    horizontal += col.size;
  }
  // const vertical = sheetMangager.sheet.utils.sumRowSize(0, sheet.rowsLength)[1]
  //   + data.rows.defaultSize;
  // const horizontal =
  //   sheetMangager.sheet.utils.sumColSize(0, sheetMangager.sheet.colsLength)[1] +
  //   data.cols.defaultSize;

  return {
    scrollWidth: horizontal,
    scrollHeight: vertical,
  };
}
