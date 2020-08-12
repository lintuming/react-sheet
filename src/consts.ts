import { CellStyle, SheetData } from 'types';
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
const DRAGGER_SIZE = 6;
const RESIZER_SIZE = 3;
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
  bold: false,
  border: border(1, 'solid', 'transparent'),
  italic: false,
  lineThrough: false,
  toFixed: 0,
  fillStyle: Colors.gridBoxFill,
  format: Formats.plainText,
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

const DEFAULT_SHEET_DATA: SheetData = {
  matrix: {
    1: {
      1: {
        text: '123456789101121314151617',
        style: {
          border: '1px solid red ',
          textOverflow: 'wrap',
        },
      },
    },
  },
  merges: [
    [4, 4, 6, 6],
    [1, 1, 4, 2],
    [0, 11, 8, 11],
  ],
  rows: {
    length: 100,
    defaultSize: 20,
    [-1]: 20,
  },
  cols: {
    defaultSize: 80,
    length: 150,
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
