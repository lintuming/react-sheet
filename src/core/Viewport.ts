import SheetBasic from './SheetBasic';
import { colAdvanceByPixel } from './utils/col';
import { rowAdvanceByPixel } from './utils/row';

export default class Viewport {
  x: number;
  y: number;
  xEnd: number;
  yEnd: number;

  constructor(x: number, y: number, xEnd: number, yEnd: number) {
    this.x = x;
    this.y = y;
    this.xEnd = xEnd;
    this.yEnd = yEnd;
  }
  spawn() {
    return new Viewport(this.x, this.y, this.xEnd, this.yEnd);
  }
}

export class AutoViewport implements Viewport {
  sheet: SheetBasic;
  x: number;
  y: number;
  constructor(sheet: SheetBasic, { x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
    this.sheet = sheet;
  }
  spawn() {
    return new Viewport(this.x, this.y, this.xEnd, this.yEnd);
  }
  get xEnd() {
    const { domWidth } = this.sheet.injection.getCanvasSize();
    let [xEnd] = colAdvanceByPixel(this.sheet.getState(), this.x, domWidth);
    return xEnd;
  }

  get yEnd() {
    const { domHeight } = this.sheet.injection.getCanvasSize();
    let [yEnd] = rowAdvanceByPixel(this.sheet.getState(), this.y, domHeight);
    return yEnd;
  }
}
