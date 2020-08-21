import {
  assertIsDefined,
  dpr,
  merge,
  getBorderWidthFromStyle,
  parseBorder,
} from 'utils';
import { Colors, DRAGGER_SIZE, RESIZER_SIZE, Borders } from 'consts';
import { Cell, CellStyle, SheetData, SheetInternalState } from 'types';
import SheetBasic, { SheetOperations } from './SheetBasic';
import SheetManager from './SheetManage';
import { hasTag, MainButtonPressed, SerieBoxPressed } from './SheetTags';
import {
  getViewportBoundingRect,
  isMergeViewport,
  isViewportsCoincide,
} from './utils/viewport';
import {
  viewportCellIterator,
  getCell,
  getViewportRenderCell,
} from './utils/cell';
import { isCellInMergeViewport } from './utils/hitTest';
import { distanceOfCellToCanvasOrigin } from './utils/distance';
import { viewportRowIterator, getRowSize } from './utils/row';
import { getColSize, viewportColIterator } from './utils/col';
import Viewport from './Viewport';

export interface BoxRenderContext {
  readonly canvasOffsetX: number;
  readonly canvasOffsetY: number;
  readonly width: number;
  readonly height: number;
  readonly boxStyle: CellStyle;
  text?: string;
}
export interface RenderContext {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly ctx: CanvasRenderingContext2D;
  box: BoxRenderContext | null;
}

type Attrs = {
  fillStyle?: CanvasRenderingContext2D['fillStyle'];
  lineWidth?: CanvasRenderingContext2D['lineWidth'];
  textAlign?: CanvasRenderingContext2D['textAlign'];
  strokeStyle?: CanvasRenderingContext2D['strokeStyle'];
  font?: CanvasRenderingContext2D['font'];
  textBaseline?: CanvasRenderingContext2D['textBaseline'];
};

class Renderer extends SheetBasic {
  renderContext: RenderContext | null;

  constructor(data: SheetData, sheetManager: SheetManager) {
    super(data, sheetManager);
    this.renderContext = null;
  }

  protected pushContext() {
    const canvas = this.injection.getCanvas();
    const { domWidth, domHeight } = this.injection.getCanvasSize();

    if (canvas) {
      const context = {
        width: domWidth,
        height: domHeight,
        ctx: canvas.getContext('2d')!,
        canvas,
        box: null,
      };

      this.renderContext = context;
    }
  }

  protected popContext() {
    this.renderContext = null;
  }

  protected attrs(attrs: Attrs) {
    if (this.renderContext) {
      Object.assign(this.renderContext.ctx, attrs);
    }
  }

  protected clearAll() {
    if (this.renderContext) {
      const { ctx, width, height } = this.renderContext;

      ctx.clearRect(0, 0, width, height);
    }
  }

  renderAll() {
    // this.clearAll();
    this.paintBackground();
    this.renderGrid();
    this.renderCells();
    this.renderMerges();
    this.renderSelected();
    this.renderHead();
    this.renderIndex();
    this.renderResizer();
  }
  render() {
    this.pushContext();
    const { ctx } = this.renderContext!;

    ctx.save();
    ctx.beginPath();
    ctx.scale(dpr(), dpr());
    // ctx.translate(0.5, 0.5);
    this.renderAll();

    ctx.restore();
    this.popContext();
  }

  protected paintBackground() {
    this.renderBox({
      canvasOffsetX: 0,
      canvasOffsetY: 0,
      width: this.renderContext!.width,
      height: this.renderContext!.height,
      boxStyle: this.styleConfig.canvasBackground,
    });
  }

  protected renderCells() {
    assertIsDefined(this.renderContext);
    for (let payload of viewportCellIterator(this, true)) {
      const { x, y, cell } = payload;
      if (isCellInMergeViewport(this, x, y)) {
        continue;
      }
      this.renderBox(this.getBoxRenderContextFromCell(x, y, cell));
    }
  }

  protected renderResizer() {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;
    const { state } = this;
    if (
      state.resizedSize != null &&
      (state.resizingRow != null || state.resizingCol != null)
    ) {
      ctx.save();
      // Const { x, y } = this.sheetManager.utils.getResizeCanvasOffset(this.sheetManager, sheet);
      const canvasOffset = distanceOfCellToCanvasOrigin(
        this,
        state.resizingCol ?? state.gridViewport.x,
        state.resizingRow ?? state.gridViewport.y
      );
      const { width, height } = getViewportBoundingRect(
        this,
        state.gridViewport
      );

      assertIsDefined(canvasOffset);
      const [canvasOffsetX, canvasOffsetY] = canvasOffset;
      const offsetX = canvasOffsetX + state.resizedSize - RESIZER_SIZE;
      const offsetY = canvasOffsetY + state.resizedSize - RESIZER_SIZE;

      if (state.resizingCol != null) {
        this.renderBox({
          canvasOffsetX: offsetX,
          canvasOffsetY: 0,
          width: RESIZER_SIZE,
          height: this.state.rows[-1],
          boxStyle: this.styleConfig.resizeMarkup,
        });
      }
      if (state.resizingRow != null) {
        this.renderBox({
          canvasOffsetX: 0,
          canvasOffsetY: offsetY,
          width: this.state.cols[-1],
          height: RESIZER_SIZE,
          boxStyle: this.styleConfig.resizeMarkup,
        });
      }
      if (hasTag(state.tag, MainButtonPressed)) {
        // Line
        this.attrs({
          strokeStyle: Colors.hitResizeBoxFill,
        });

        if (state.resizingCol != null) {
          ctx.beginPath();
          this.drawLine(
            [offsetX + RESIZER_SIZE / 2, 0],
            [offsetX + RESIZER_SIZE / 2, height]
          );
        }
        if (state.resizingRow != null) {
          ctx.beginPath();

          this.drawLine(
            [0, offsetY + RESIZER_SIZE / 2],
            [width, offsetY + RESIZER_SIZE / 2]
          );
        }
      }
      ctx.restore();
    }
  }

  protected renderIndex() {
    if (this.renderContext) {
      this.renderBox({
        canvasOffsetY: 0,
        canvasOffsetX: 0,
        width: this.state.cols[-1],
        height: this.state.rows[-1],
        boxStyle: this.styleConfig.indexCell.default,
      });
    }
  }

  protected renderHead() {
    if (this.renderContext) {
      const { ctx } = this.renderContext;

      ctx.save();
      ctx.beginPath();
      for (let row of viewportRowIterator(this)) {
        const cell = getCell(this, -1, row.index);
        const ctx: BoxRenderContext = {
          canvasOffsetX: 0,
          canvasOffsetY: row.offset + getRowSize(this, -1),
          width: getColSize(this, -1),
          height: row.size,
          boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
          text: cell.text,
        };
        this.renderBox(ctx);
      }

      for (let col of viewportColIterator(this)) {
        const cell = getCell(this, col.index, -1);
        const ctx: BoxRenderContext = {
          canvasOffsetX: col.offset + getColSize(this, -1),
          canvasOffsetY: 0,
          width: col.size,
          height: getRowSize(this, -1),
          boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
          text: cell.text,
        };
        this.renderBox(ctx);
      }
      ctx.restore();
    }
  }

  protected renderGrid() {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;

    ctx.save();
    ctx.beginPath();
    const { state } = this;

    ctx.translate(this.state.cols[-1], this.state.rows[-1]);
    // const [colStartIdx, rowStartIdx] = state.gridViewport;
    // const { rowsLength, colsLength } = this;
    const { width, height } = getViewportBoundingRect(this, state.gridViewport);

    this.applyBorderStyle(this.styleConfig.grid.border!);
    this.attrs({
      fillStyle: this.styleConfig.cell.fillStyle,
    });
    ctx.fillRect(0, 0, width, height);

    // const lastPageStartCol = this.utils.lastStartIndex('col');
    // const lastPageStartRow = this.utils.lastStartIndex('row');
    for (let row of viewportRowIterator(this)) {
      this.drawLine([0, row.offset + row.size], [width, row.offset + row.size]);
    }
    for (let { offset, size } of viewportColIterator(this)) {
      this.drawLine([offset + size, 0], [offset + size, height]);
    }
    ctx.restore();
  }

  protected renderSelected() {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;
    ctx.save();
    const { state } = this;

    // let { x, y, xEnd, yEnd } = state.selectedViewport;

    // const rangeStartOffset = distanceOfCellToCanvasOrigin(this, x, y);
    // let width = getColSize(this, x),
    //   height = getRowSize(this, y);

    const bound = getViewportBoundingRect(this, state.selectedViewport);
    this.renderBox({
      ...bound,
      boxStyle: this.styleConfig.selected,
    });
    // if (rangeStartOffset && isMergeViewport(this, state.selectedViewport)) {
    //   // selectedCells is merged;
    //   const rangeEndOffset = distanceOfCellToCanvasOrigin(
    //     this,
    //     xEnd + 1,
    //     yEnd + 1,
    //     false
    //   );
    //   if (rangeEndOffset) {
    //     width = rangeEndOffset[0] - rangeStartOffset[0];
    //     height = rangeEndOffset[1] - rangeStartOffset[1];
    //   }
    // }
    // if (rangeStartOffset) {
    //   this.renderBox({
    //     canvasOffsetX: rangeStartOffset[0],
    //     canvasOffsetY: rangeStartOffset[1],
    //     width,
    //     height,
    //     boxStyle: this.styleConfig.selected,
    //   });
    // }
    this.renderInterleaveSelectRanger();

    ctx.restore();
  }

  protected renderInterleaveSelectRanger() {
    if (this.renderContext) {
      const { state } = this;
      const { x, y, xEnd, yEnd } = this.state.selectedGroupViewport;
      const xStartIndex = Math.min(x, xEnd);
      const yStartIndex = Math.min(y, yEnd);
      const xEndIndex = Math.max(x, xEnd);
      const yEndIndex = Math.max(y, yEnd);
      const rangeStartOffset = distanceOfCellToCanvasOrigin(
        this,
        xStartIndex,
        yStartIndex,
        false
      );
      const rangeEndOffset = distanceOfCellToCanvasOrigin(
        this,
        xEndIndex + 1,
        yEndIndex + 1,
        false
      );
      const mainButtonPressed = hasTag(state.tag, MainButtonPressed);
      if (
        rangeStartOffset &&
        rangeEndOffset &&
        !isViewportsCoincide(
          state.selectedViewport,
          state.selectedGroupViewport
        )
      ) {
        this.renderBox({
          canvasOffsetX: rangeStartOffset[0],
          canvasOffsetY: rangeStartOffset[1],
          width: rangeEndOffset[0] - rangeStartOffset[0],
          height: rangeEndOffset[1] - rangeStartOffset[1],
          boxStyle: mainButtonPressed
            ? this.styleConfig.selectedRangeMove
            : this.styleConfig.selectedRange,
        });
      }
      const draggerGridOffset = distanceOfCellToCanvasOrigin(
        this,
        Math.max(x, xEnd) + 1,
        Math.max(y, yEnd) + 1
      );
      if (
        (!mainButtonPressed || hasTag(state.tag, SerieBoxPressed)) &&
        draggerGridOffset
      ) {
        const size = DRAGGER_SIZE;
        this.renderBox({
          canvasOffsetX: draggerGridOffset[0] - size / 2,
          canvasOffsetY: draggerGridOffset[1] - size / 2,
          width: size,
          height: size,
          boxStyle: this.styleConfig.selectedDragger,
        });
      }
    }
  }

  protected renderMerges() {
    assertIsDefined(this.renderContext);
    const merges = this.state.merges;
    if (merges && merges.length >= 0) {
      for (let i = 0; i < merges.length; i += 1) {
        // we save the cell data into the topleft cell of the merge;
        this.renderBox(this.getBoxRenderContextFromMerge(i));
      }
    }
  }
  protected getBoxRenderContextFromMerge(mergeIndex: number): BoxRenderContext {
    const mergeViewport = this.state.merges[mergeIndex];
    const cell = getViewportRenderCell(this, mergeViewport);
    const bound = getViewportBoundingRect(this, mergeViewport);
    return {
      boxStyle: merge(this.styleConfig.cell, cell.style),
      text: cell.text ?? '',
      ...bound,
    };
  }
  protected applyBorderStyle(border: string) {
    const [lineWidth, lineStyle, strokeStyle] = parseBorder(border);
    this.setLineStyle(lineStyle);
    this.attrs({
      lineWidth: lineWidth,
      strokeStyle,
    });
  }

  protected setLineStyle(lineStyle: string | 'dashed' | 'solid' | number[]) {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;
    if (Array.isArray(lineStyle)) {
      ctx.setLineDash(lineStyle);
    } else {
      switch (lineStyle) {
        case 'solid':
          ctx.setLineDash([0]);
          return;
        case 'dashed':
          ctx.setLineDash([5, 5]);
      }
    }
  }

  protected drawLine(...points: [number, number][]) {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;
    let [x, y] = points[0];
    ctx.save();
    ctx.beginPath();
    if (ctx.lineWidth % 2 !== 0) {
      ctx.translate(0.5, 0.5);
    }
    ctx.moveTo(x, y);
    for (let i = 1; i < points.length; i++) {
      [x, y] = points[i];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  protected applyCellStyle() {
    assertIsDefined(this.renderContext);
    this.formatBoxText();
    this.drawBoxContent();
    this.drawBoxText();
    this.drawBorders();
  }

  protected drawBoxText() {
    assertIsDefined(this.renderContext?.box);
    const { ctx } = this.renderContext;
    const {
      width,
      boxStyle,
      text,
      height,
      canvasOffsetX,
      canvasOffsetY,
    } = this.renderContext.box;

    if (text) {
      ctx.save();
      const padding = boxStyle.padding ?? 0;
      const widthWithPadding = width - padding * 2;
      ctx.rect(
        canvasOffsetX + padding,
        canvasOffsetY + padding,
        widthWithPadding,
        height - padding
      );
      ctx.clip(); // this prevent the text overflow
      const {
        italic,
        bold,
        fontSize,
        fontFamily,
        lineThrough,
        color,
        textOverflow,
        underline,
        horizontalAlign,
        verticalAlign,
      } = boxStyle;
      const font = `${italic ? 'italic' : ''} ${
        bold ? 'bold' : ''
      } ${fontSize}px ${fontFamily}`;
      this.attrs({
        font,
        textAlign: horizontalAlign,
        textBaseline: verticalAlign,
        fillStyle: color,
      });
      const textX = this.boxTextX(horizontalAlign);
      const texts = `${text}`.split('\n');
      let resolvedTexts: string[] = [];

      outer: for (const text of texts) {
        const textWidth = ctx.measureText(text).width;
        if (textWidth > widthWithPadding) {
          let start = 0;
          for (let i = 0; i < text.length; i++) {
            const partialW = ctx.measureText(text.slice(start, i + 1)).width;
            if (partialW >= widthWithPadding) {
              resolvedTexts.push(text.slice(start, i));
              if (textOverflow === 'hidden') {
                continue outer;
              }
              start = i;
            }
          }
          resolvedTexts.push(text.slice(start));
        } else {
          resolvedTexts.push(text);
        }
      }

      let textY = this.boxTextY(
        verticalAlign,
        fontSize,
        2,
        resolvedTexts.length
      );
      resolvedTexts.forEach((resolvedText, i) => {
        const textWidth = ctx.measureText(resolvedText).width;
        ctx.fillText(resolvedText, textX, textY);

        if (lineThrough) {
          this.drawTextLine(
            'lineThrough',
            textX,
            textY,
            textWidth,
            fontSize,
            boxStyle
          );
        }
        if (underline) {
          this.drawTextLine(
            'underline',
            textX,
            textY,
            textWidth,
            fontSize,
            boxStyle
          );
        }
        textY += fontSize + 2;
      });
      ctx.restore();
    }
  }
  protected drawTextLine(
    type: 'lineThrough' | 'underline',
    x: number,
    y: number,
    width: number,
    height: number,
    { verticalAlign, horizontalAlign, color }: CellStyle
  ) {
    if (type === 'lineThrough') {
      if (verticalAlign === 'bottom') {
        y -= height / 2;
      } else if (verticalAlign === 'top') {
        y += height / 2;
      }
    } else if (type === 'underline') {
      if (verticalAlign === 'middle') {
        y += height / 2;
      } else if (verticalAlign === 'top') {
        y += height;
      }
    }
    if (horizontalAlign === 'center') {
      x -= width / 2;
    } else if (horizontalAlign === 'right') {
      x -= width;
    }
    this.attrs({ strokeStyle: color, lineWidth: 1 });
    this.drawLine(
      [Math.floor(x), Math.floor(y)],
      [Math.floor(x + width), Math.floor(y)]
    );
  }
  protected boxTextY(
    align: CellStyle['verticalAlign'],
    h: number,
    gap: number,
    line: number
  ) {
    assertIsDefined(this.renderContext?.box);
    const { canvasOffsetY, height, boxStyle } = this.renderContext.box;
    const padding = boxStyle.padding ?? 0;
    const totalHeight = (h + gap) * line;
    /*
     * See https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/textBaseline
     */

    if (align === 'top') {
      return canvasOffsetY + padding;
    }
    if (align === 'middle') {
      return Math.max(
        canvasOffsetY + padding + h / 2,
        canvasOffsetY + height / 2 - totalHeight / 2 + h / 2
      );
    }
    if (align === 'bottom') {
      return Math.max(canvasOffsetY + height - (totalHeight - h));
    }

    return canvasOffsetY;
  }

  protected boxTextX(align: CellStyle['horizontalAlign']) {
    assertIsDefined(this.renderContext?.box);
    const { canvasOffsetX, width, boxStyle } = this.renderContext.box;
    const padding = boxStyle.padding ?? 0;
    if (align === 'left') {
      return canvasOffsetX + padding;
    }
    if (align === 'right') {
      return canvasOffsetX + width - padding;
    }
    if (align === 'center') {
      return canvasOffsetX + (width - padding * 2) / 2;
    }

    return canvasOffsetX;
  }

  protected drawBoxContent() {
    assertIsDefined(this.renderContext?.box);
    const { ctx } = this.renderContext;
    const {
      canvasOffsetX,
      canvasOffsetY,
      width,
      height,
      boxStyle,
    } = this.renderContext.box;

    ctx.save();
    this.attrs({
      fillStyle: boxStyle.fillStyle,
    });
    ctx.fillRect(canvasOffsetX, canvasOffsetY, width, height);
    ctx.restore();
  }

  protected drawBorders() {
    assertIsDefined(this.renderContext?.box);
    const { ctx } = this.renderContext;
    const {
      canvasOffsetX,
      canvasOffsetY,
      boxStyle,
      width,
      height,
    } = this.renderContext.box;
    let { border, borderTop, borderRight, borderBottom, borderLeft } = boxStyle;
    if (border) {
      borderTop = borderTop ?? border;
      borderRight = borderRight ?? border;
      borderBottom = borderBottom ?? border;
      borderLeft = borderLeft ?? border;
    }
    ctx.lineCap = 'square';
    if (borderTop) {
      this.applyBorderStyle(borderTop);
      this.drawLine(
        [canvasOffsetX, canvasOffsetY],
        [canvasOffsetX + width, canvasOffsetY]
      );
    }

    if (borderRight) {
      this.applyBorderStyle(borderRight);
      this.drawLine(
        [canvasOffsetX + width, canvasOffsetY],
        [canvasOffsetX + width, canvasOffsetY + height]
      );
    }
    if (borderBottom) {
      this.applyBorderStyle(borderBottom);
      this.drawLine(
        [canvasOffsetX + width, canvasOffsetY + height],
        [canvasOffsetX, canvasOffsetY + height]
      );
    }
    if (borderLeft) {
      this.applyBorderStyle(borderLeft);
      this.drawLine(
        [canvasOffsetX, canvasOffsetY + height],
        [canvasOffsetX, canvasOffsetY]
      );
    }
  }

  protected getCurrentRenderingBox() {
    assertIsDefined(this.renderContext?.box);

    return this.renderContext.box;
  }

  protected formatBoxText() {
    // const box = this.getCurrentRenderingBox();
    /*
     * Const formatter = findFormatter(cellCtx.cellStyle.format);
     * CellCtx.cellText = formatter(cellCtx.cellText, cellCtx.cellStyle.toFixed);
     */
  }

  protected getBoxRenderContextFromCell(
    x: number,
    y: number,
    cell: Cell
  ): BoxRenderContext {
    assertIsDefined(cell);
    const cellStyle = merge(this.styleConfig.cell, cell.style ?? {});
    const cellText = cell.text ?? '';
    return {
      ...getViewportBoundingRect(this, new Viewport(x, y, x, y)),
      boxStyle: cellStyle,
      text: cellText,
    };
  }

  protected pushBoxRenderContext(box: BoxRenderContext) {
    assertIsDefined(this.renderContext);

    this.renderContext.box = box;
  }

  protected popBoxRenderContext() {
    assertIsDefined(this.renderContext);
    this.renderContext.box = null;
  }

  protected renderBox(box?: BoxRenderContext) {
    assertIsDefined(this.renderContext);
    if (box) {
      this.pushBoxRenderContext(box);
    }
    this.applyCellStyle();
    this.popBoxRenderContext();
  }
}

export { Renderer };
