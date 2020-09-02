import { CellStyle, SheetData, SpreadsheetConfig } from 'types';
import { border, deepFreeze } from 'utils';
const IS_SERVE = typeof window === 'undefined';

enum POINTER_BUTTON {
  MAIN = 0,
  WHEEL,
  RIGHT,
}
export enum Borders {
  all,
  inside,
  horizontal,
  vertical,
  outside,
  top,
  left,
  right,
  bottom,
  none,
}
export enum Formats {
  auto,
  plainText,
  number,
  percentage,
  scientificNotation,
  date,
  time,
  dateTime,
  duration,
}
const DRAGGER_SIZE = 5;
const RESIZER_SIZE = 3;
export const SCROLLBAR_SIZE = 13;
enum CURSOR_TYPE {
  DEFAULT = 'unset',
  CROSSHAIR = 'crosshair',
  GRAB = 'grab',
  GRABBING = 'grabbing',
  RESIZEX = 'e-resize',
  RESIZEY = 'n-resize',
}

export enum FontFamilies {
  Arial = 'Arial',
  Helvetica = 'Helvetica',
  SourceSansPro = 'Source Sans Pro',
  ComicSansMS = 'Comic Sans MS',
  CourierNew = 'Courier New',
  Verdana = 'Verdana',
  Lato = 'Lato',
}

export const FontFamilyList = [
  {
    name: FontFamilies.Arial,
    label: 'Arial',
    tag: 'default',
  },
  { name: FontFamilies.Helvetica, label: 'Helvetica' },
  { name: FontFamilies.SourceSansPro, label: 'Source Sans Pro' },
  { name: FontFamilies.ComicSansMS, label: 'Comic Sans MS' },
  { name: FontFamilies.CourierNew, label: 'Courier New' },
  { name: FontFamilies.Verdana, label: 'Verdana' },
  { name: FontFamilies.Lato, label: 'Lato' },
];

enum Colors {
  defaultFontColor = '#333',
  indexLineStroke = '#c0c0c0',
  indexBoxFill = '#f8f9fa',
  indexBoxFocusFill = '#5f6368',
  indexBoxSelectedFill = '#e8eaed',
  gridLineStroke = '#e2e2e3',
  gridBoxFill = '#fff',
  canvasBoxFill = '#f3f3f3',
  selectedLineStroke = '#1a73e8',
  selectedDraggerBoxFill = '#1473e8',
  selectedRangeMaskFill = '#1664d529',
  hitResizeBoxFill = '#4d90fe',
}

const baseTextStyle = {
  verticalAlign: 'middle',
  horizontalAlign: 'center',
  color: Colors.defaultFontColor,
  fontSize: 10,
  fontFamily: 'Arial',
  textOverflow: 'hidden',
} as const;

const DEFAULT_CELL_STYLE: CellStyle = {
  ...baseTextStyle,
  border: border(1, 'solid', 'transparent'),
  bold: false,
  italic: false,
  lineThrough: false,
  toFixed: 0,
  fillStyle: Colors.gridBoxFill,
  format: Formats.plainText,
  padding: 2,
  underline: false,
};

const DefaultStyleConfig: {
  indexCell: {
    focus: CellStyle;
    default: CellStyle;
    subsetSelected: CellStyle;
  };
  cell: CellStyle;
  selected: CellStyle;
  selectedRange: CellStyle;
  selectedRangeMove: CellStyle;
  selectedDragger: CellStyle;
  canvasBackground: CellStyle;
  grid: CellStyle;
  resizeMarkup: CellStyle;
} = {
  indexCell: {
    focus: {
      ...DEFAULT_CELL_STYLE,
      fillStyle: Colors.indexBoxFocusFill,
      border: border(1, 'solid', Colors.indexLineStroke),
      color: 'white',
    } as const,
    default: {
      ...DEFAULT_CELL_STYLE,
      fillStyle: Colors.indexBoxFill,
      border: border(1, 'solid', Colors.indexLineStroke),
    },
    subsetSelected: {
      ...DEFAULT_CELL_STYLE,
      fillStyle: Colors.indexBoxSelectedFill,
      border: border(1, 'solid', Colors.indexLineStroke),
    },
  },
  cell: DEFAULT_CELL_STYLE,

  grid: {
    ...DEFAULT_CELL_STYLE,
    border: border(1, 'solid', Colors.gridLineStroke),
  },
  selected: {
    ...DEFAULT_CELL_STYLE,
    border: border(2, 'solid', Colors.selectedLineStroke),
    fillStyle: 'transparent',
  },

  selectedRange: {
    ...DEFAULT_CELL_STYLE,
    fillStyle: Colors.selectedRangeMaskFill,
    border: border(1, 'solid', Colors.selectedLineStroke),
  },
  selectedRangeMove: {
    ...DEFAULT_CELL_STYLE,
    fillStyle: Colors.selectedRangeMaskFill,
    border: border(1, 'solid', 'transparent'),
  },

  selectedDragger: {
    ...DEFAULT_CELL_STYLE,
    fillStyle: Colors.selectedDraggerBoxFill,
    border: border(1, 'solid', 'white'),
  },

  resizeMarkup: {
    ...DEFAULT_CELL_STYLE,
    border: undefined,
    fillStyle: Colors.hitResizeBoxFill,
  },
  canvasBackground: {
    ...DEFAULT_CELL_STYLE,
    fillStyle: Colors.canvasBoxFill,
  },
};

// should not change any of this
const EmptyCell = deepFreeze({
  text: '',
  style: DEFAULT_CELL_STYLE,
});
export const DEFAULT_CONFIG: SpreadsheetConfig = {
  initialDatas: [],
  initialIndex: 0,
  width: 1000,
  height: 600,
  showToolbar: true,
  showSheetChenger: true,
};

let matrix: { [key: string]: any } = {};
for (let i = 0; i < 10000; i += 1) {
  matrix[i] = {
    0: {
      text: 'A-' + i,
      style: {},
    },
    1: {
      text: 'B-' + i,
      style: { fillStyle: 'pink', border: border(1, 'solid', 'red') },
    },
    2: { text: 'C-' + i, style: { underline: true } },
    3: {
      text: 'D-' + i,
      style: { lineThrough: true, italic: true, bold: true },
    },
    4: { text: 'E-' + i },
    5: { text: 'F-' + i },
  };
}

matrix = __DEV__ ? matrix : {};

const DEFAULT_SHEET_DATA: SheetData = {
  matrix: matrix,
  merges: [
    // [4, 4, 6, 6],
    // [1, 1, 4, 2],
    // [0, 11, 8, 11],
  ],
  rows: {
    length: 10000,
    defaultSize: 25,
    [-1]: 20,
  },
  cols: {
    defaultSize: 60,
    1: 150,
    146: 96,
    148: 150,
    149: 150,
    length: 10000,
    [-1]: 60,
  },
};

export {
  IS_SERVE,
  POINTER_BUTTON,
  CURSOR_TYPE,
  DRAGGER_SIZE,
  RESIZER_SIZE,
  DefaultStyleConfig,
  DEFAULT_SHEET_DATA,
  EmptyCell,
  Colors,
};
