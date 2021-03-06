import SheetManager from 'core/SheetManage';
import { Formats } from 'consts';
import Viewport from 'core/Viewport';

declare global {
  const __DEV__: boolean;
}
export type Sparse<T> = {
  [key: string]: T;
  [key: number]: T;
};
export type SparseArray<T> = Sparse<T> & { length: number };

export type RowOrCol = SparseArray<number> & {
  [-1]: number;
  defaultSize: number;
};
interface TextStyle {
  horizontalAlign: 'center' | 'left' | 'right';
  verticalAlign: 'middle' | 'top' | 'bottom';
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  lineThrough: boolean;
  color: string;
  underline: boolean;
  textOverflow: 'hidden' | 'wrap';
}

export type CellStyle = {
  toFixed: number;
  fillStyle: string;
  borderTop?: string;
  borderLeft?: string;
  borderBottom?: string;
  borderRight?: string;
  border?: string;
  format: Formats;
  padding?: number;
} & TextStyle;

export type CellStyleConfig = Partial<CellStyle>;
export interface Cell {
  readonly text?: string;
  readonly style?: CellStyleConfig;
}

// Sparse matrix
export type Cells = Sparse<Cell>;

export type Rect = [number, number, number, number];

export interface SheetData {
  merges: Viewport[];
  freeze?: string;
  matrix: Sparse<Cells>;
  cols: RowOrCol;
  rows: RowOrCol;
  readOnly?: boolean;
}

export type SheetInternalState = SheetData & {
  tag: number;
  gridViewport: Viewport;
  selectedGroupViewport: Viewport;
  selectedViewport: Viewport;
  // selectedRangeRect: [number, number, number, number]; //  [x1,y1,x2,y2]
  // selectedRect: [number, number, number, number];
  resizingCol?: number | null;
  resizingRow?: number | null;
  resizedSize?: number | null;
};

export type SheetDataPartial = {
  [key in keyof SheetData]?: SheetData[key] extends Array<any>
    ? SheetData[key]
    : Partial<SheetData[key]>;
};

export type SheetDatas = SheetData[];

export interface SpreadsheetConfig {
  initialDatas: SheetDataPartial[];
  initialIndex: number;
  width: number;
  height: number;
  showToolbar: boolean;
  showSheetChenger: boolean;
  onIndexChange?: (index: number) => void;
  onDataChange?: (data: SheetData, datas: SheetData[]) => void;
}

export type SpreadsheetProps = {
  [key in keyof SpreadsheetConfig]?: key extends 'initialDatas'
    ? SpreadsheetConfig['initialDatas']
    : Partial<SpreadsheetConfig[key]>;
} & {
  spreadsheet?: SheetManager;
};

export type Point = string;

export type ScrollState = {
  scrollTop: number;
  scrollLeft: number;
};
