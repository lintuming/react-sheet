import { getCell, stringAt, viewportCellIterator } from '../cell';
import React from 'react';
import { render } from '@testing-library/react';
import SpreadSheet from 'index';
import SheetManager from 'core/SheetManage';
import Sheet from 'core/Sheet';
import {
  DEFAULT_CELL_STYLE,
  DEFAULT_SHEET_DATA,
  DefaultStyleConfig,
} from 'consts';
let sheet: Sheet;
let sheetManager;
function buildMatrix() {
  const matrix = {};
  for (let i = 0; i < 1000; i++) {
    matrix[i] = {};
    for (let j = 0; j < 1000; j++) {
      if (j <= 5) {
        matrix[i][j] = {
          text: i + ':' + j,
        };
      }
    }
  }
  return matrix;
}

describe('cell utils', () => {
  beforeEach(() => {
    sheetManager = new SheetManager();
    render(
      <SpreadSheet
        spreadsheet={sheetManager}
        initialDatas={[
          {
            matrix: buildMatrix(),
            rows: {
              defaultSize: 25,
              length: 1000,
              [-1]: 25,
            },
            cols: {
              defaultSize: 60,
              length: 1000,
              [-1]: 150,
            },
          },
        ]}
      />
    );
    sheet = sheetManager.sheet;
  });
  it('stringAt', () => {
    expect(stringAt(0)).toBe('A');
    expect(stringAt(1500)).toBe('BES');
  });
  it('getCell', () => {
    console.log(getCell(sheet, 0, 0).style, 'style');

    expect(getCell(sheet, 0, 0)).toEqual({
      text: '0:0',
    });
    expect(getCell(sheet, -1, 0)).toEqual({
      text: '1(0)',
      style: DefaultStyleConfig.indexCell.subsetSelected,
    });
    expect(getCell(sheet, 150, -1)).toEqual({
      text: stringAt(150) + '(150)',
      style: DefaultStyleConfig.indexCell.default,
    });
    expect(getCell(sheet, 0, -1)).toEqual({
      text: 'A(0)',
      style: DefaultStyleConfig.indexCell.subsetSelected,
    });
  });
  it('cell generator', () => {
    const generator = viewportCellIterator(sheet);
    expect(generator.next().value).toEqual({
      x: 0,
      y: 0,
      cell: { text: '0:0' },
      width: 60,
      height: 25,
      xOffset: 0,
      yOffset: 0,
    });
  });
});
