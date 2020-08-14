import { assertIsDefined, dpr, merge } from 'utils';
import { Colors, DRAGGER_SIZE, RESIZER_SIZE } from 'consts';
import { Cell, CellStyle, SheetData } from 'types';
import SheetBasic from './SheetBasic';
import SheetManager from './SheetManage';
import { hasTag, MainButtonPressed, SerieBoxPressed } from './SheetTags';

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
    const { width, height } = this.injection.getConfig();

    if (canvas) {
      const context = {
        width,
        height,
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

  render() {
    this.pushContext();
    this.clearAll();
    const { ctx } = this.renderContext!;

    ctx.save();
    ctx.beginPath();
    ctx.scale(dpr(), dpr());
    ctx.translate(0.5, 0.5);
    // Patin canvas background
    this.paintBackground();
    this.renderGrid();
    this.renderCells();
    this.renderMerges();
    this.renderSelected();
    this.renderHead();
    this.renderIndex();
    this.renderResizer();
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
    const { state } = this;
    const [xStart, yStart] = state.startIndexs;
    const { viewHeight, viewWidth } = this.utils.gridViewportSize();

    for (let payload of this.utils.createCellsIterator({
      rect: [xStart, yStart, this.colsLength, this.rowsLength],
      skipEmpty: true,
      xOffsetBound: viewWidth,
      yOffsetBound: viewHeight,
    })) {
      const { x, y, cell } = payload;
      if (this.utils.isGridLocateMergeRect(x, y)) {
        continue;
      }
      this.renderBox(this.getBoxRenderContextFromCell(x, y, cell));
    }
    // this.utils.forEachCells(
    //   {
    //     xStart,
    //     yStart,
    //     xEnd: this.colsLength,
    //     yEnd: this.rowsLength,
    //     xOffsetBound: viewWidth,
    //     yOffsetBound: viewHeight,
    //     skipDetaulCell:true
    //   },
    //   ({ cell, x, y }) => {
    //     if (this.utils.cellIndexesInMerges(x, y)) {
    //       return;
    //     }
    //     const boxContext = this.getBoxRenderContextFromCell(x, y, cell);
    //     this.renderBox(boxContext);
    //   }
    // );
  }

  protected renderResizer() {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;

    ctx.save();
    const { state } = this;

    if (
      state.resizedSize != null &&
      (state.resizingRow != null || state.resizingCol != null)
    ) {
      // Const { x, y } = this.sheetManager.utils.getResizeCanvasOffset(this.sheetManager, sheet);
      const canvasOffset = this.utils.distanceToCanvasOrigin(
        state.resizingCol ?? state.startIndexs[0],
        state.resizingRow ?? state.startIndexs[1]
      );
      const { viewHeight, viewWidth } = this.utils.gridViewportSize();

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
            [offsetX + RESIZER_SIZE / 2, viewHeight]
          );
          ctx.stroke();
        }
        if (state.resizingRow != null) {
          ctx.beginPath();

          this.drawLine(
            [0, offsetY + RESIZER_SIZE / 2],
            [viewWidth, offsetY + RESIZER_SIZE / 2]
          );
          ctx.stroke();
        }
      }
    }
    ctx.restore();
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
      const { ctx, width, height } = this.renderContext;

      ctx.save();
      ctx.beginPath();
      const { state } = this;
      const [colStartIdx, rowStartIdx] = state.startIndexs;
      const { rowsLength, colsLength } = this;
      // Const restore = this.translateToIndex('y');

      for (let row of this.utils.createRowIterator(
        rowStartIdx,
        rowsLength,
        height
      )) {
        const cell = this.utils.getCell(-1, row.index);
        const ctx: BoxRenderContext = {
          canvasOffsetX: 0,
          canvasOffsetY: row.offset + this.utils.getRowSize(-1),
          width: this.utils.getColSize(-1),
          height: row.size,
          boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
          text: cell.text,
        };
        this.renderBox(ctx);
      }
      // this.utils.forEachRow(
      //   {
      //     start: rowStartIdx,
      //     end: rowsLength,
      //     offsetBound: height,
      //   },
      //   ({ offset, size }, i) => {
      //     const cell = this.utils.getCell(-1, i);
      //     const ctx: BoxRenderContext = {
      //       canvasOffsetX: 0,
      //       canvasOffsetY: offset + this.utils.getRowSize(-1),
      //       width: this.utils.getColSize(-1),
      //       height: size,
      //       boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
      //       text: cell.text,
      //     };
      //     this.renderBox(ctx);
      //   }
      // );
      for (let col of this.utils.createColIterator(
        colStartIdx,
        colsLength,
        width
      )) {
        const cell = this.utils.getCell(col.index, -1);
        const ctx: BoxRenderContext = {
          canvasOffsetX: col.offset + this.utils.getColSize(-1),
          canvasOffsetY: 0,
          width: col.size,
          height: this.utils.getRowSize(-1),
          boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
          text: cell.text,
        };
        this.renderBox(ctx);
      }
      // this.utils.forEachCol(
      //   {
      //     start: colStartIdx,
      //     end: colsLength,
      //     offsetBound: width,
      //   },
      //   ({ offset, size }, i) => {
      //     const cell = this.utils.getCell(i, -1);
      //     const ctx: BoxRenderContext = {
      //       canvasOffsetX: offset + this.utils.getColSize(-1),
      //       canvasOffsetY: 0,
      //       width: size,
      //       height: this.utils.getRowSize(-1),
      //       boxStyle: merge(this.styleConfig.cell, cell.style ?? {}),
      //       text: cell.text,
      //     };
      //     this.renderBox(ctx);
      //   }
      // );
      ctx.restore();
    }
  }

  protected renderGrid() {
    assertIsDefined(this.renderContext);
    const { ctx, width, height } = this.renderContext;

    ctx.save();
    ctx.beginPath();
    const { state } = this;

    ctx.translate(this.state.cols[-1], this.state.rows[-1]);
    const [colStartIdx, rowStartIdx] = state.startIndexs;
    const { rowsLength, colsLength } = this;
    const { viewHeight, viewWidth } = this.utils.gridViewportSize();

    this.applyBorderStyle(this.styleConfig.grid.border!);
    this.attrs({
      fillStyle: this.styleConfig.cell.fillStyle,
    });
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    for (let row of this.utils.createRowIterator(
      rowStartIdx,
      rowsLength,
      height
    )) {
      this.drawLine(
        [0, row.offset + row.size],
        [viewWidth, row.offset + row.size]
      );
    }
    // this.utils.forEachRow(
    //   {
    //     start: rowStartIdx,
    //     end: rowsLength,
    //     offsetBound: height,
    //   },
    //   ({ size, offset }) => {
    //     this.drawLine([0, offset + size], [viewWidth, offset + size]);
    //   }
    // );
    for (let { offset, size } of this.utils.createColIterator(
      colStartIdx,
      colsLength,
      width
    )) {
      this.drawLine([offset + size, 0], [offset + size, viewHeight]);
    }
    // this.utils.forEachCol(
    //   {
    //     start: colStartIdx,
    //     end: colsLength,
    //     offsetBound: width,
    //   },
    //   ({ size, offset }) => {
    //     this.drawLine([offset + size, 0], [offset + size, viewHeight]);
    //   }
    // );
    ctx.stroke();
    ctx.restore();
  }

  protected renderSelected() {
    assertIsDefined(this.renderContext);
    const { ctx } = this.renderContext;
    ctx.save();
    const { state } = this;

    let [xStart, yStart, xEnd, yEnd] = state.selectedRect;

    const rangeStartOffset = this.utils.distanceToCanvasOrigin(xStart, yStart);
    let width = this.utils.getColSize(xStart),
      height = this.utils.getRowSize(yStart);
    if (rangeStartOffset && (xEnd > xStart || yEnd > yStart)) {
      // selectedCells is merged;
      const rangeEndOffset = this.utils.distanceToCanvasOrigin(
        xEnd + 1,
        yEnd + 1,
        false
      );
      if (rangeEndOffset) {
        width = rangeEndOffset[0] - rangeStartOffset[0];
        height = rangeEndOffset[1] - rangeStartOffset[1];
      }
    }
    if (rangeStartOffset) {
      this.renderBox({
        canvasOffsetX: rangeStartOffset[0],
        canvasOffsetY: rangeStartOffset[1],
        width,
        height,
        boxStyle: this.styleConfig.selected,
      });
    }
    this.renderInterleaveSelectRanger();

    ctx.restore();
  }

  protected renderInterleaveSelectRanger() {
    if (this.renderContext) {
      const { state } = this;
      const [
        colRangeStart,
        rowRangeStart,
        colRangeEnd,
        rowRangeEnd,
      ] = this.state.selectedRangeRect;
      const xStartIndex = Math.min(colRangeStart, colRangeEnd);
      const yStartIndex = Math.min(rowRangeStart, rowRangeEnd);
      const xEndIndex = Math.max(colRangeStart, colRangeEnd);
      const yEndIndex = Math.max(rowRangeStart, rowRangeEnd);
      const rangeStartOffset = this.utils.distanceToCanvasOrigin(
        xStartIndex,
        yStartIndex,
        false
      );
      const rangeEndOffset = this.utils.distanceToCanvasOrigin(
        xEndIndex + 1,
        yEndIndex + 1,
        false
      );
      const mainButtonPressed = hasTag(state.tag, MainButtonPressed);
      if (
        rangeStartOffset &&
        rangeEndOffset &&
        !this.utils.isTwoRectSame(state.selectedRangeRect, state.selectedRect)
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
      const draggerGridOffset = this.utils.distanceToCanvasOrigin(
        Math.max(colRangeStart, colRangeEnd) + 1,
        Math.max(rowRangeStart, rowRangeEnd) + 1
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
    const [x1, y1, x2, y2] = this.state.merges[mergeIndex];
    const topLeftCellBoxRenderContext = this.getBoxRenderContextFromCell(
      x1,
      y1,
      this.utils.getCell(x1, y1)
    );
    const endCanvasOffset = this.utils.distanceToCanvasOrigin(
      x2 + 1,
      y2 + 1,
      false
    )!;

    const width =
      endCanvasOffset[0] - topLeftCellBoxRenderContext.canvasOffsetX;
    const height =
      endCanvasOffset[1] - topLeftCellBoxRenderContext.canvasOffsetY;
    return {
      ...topLeftCellBoxRenderContext,
      width,
      height,
    };
  }

  protected readBorder(border: string) {
    const [_lineWidth, lineStyle, strokeStyle] = border.split(/\s+/);
    const lineWidth = parseFloat(_lineWidth);
    return [lineWidth, lineStyle, strokeStyle] as const;
  }
  protected applyBorderStyle(border: string) {
    const [lineWidth, lineStyle, strokeStyle] = this.readBorder(border);

    this.setLineStyle(lineStyle);
    this.attrs({
      lineWidth,
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

    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(...points[i]);
    }
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
      resolvedTexts = resolvedTexts.filter(Boolean);
      const textHeight = (resolvedTexts.length - 1) * (fontSize + 2);

      let textY = this.boxTextY(
        verticalAlign,
        fontSize + 2,
        resolvedTexts.length
      );
      resolvedTexts.forEach(resolvedText => {
        ctx.fillText(resolvedText, textX, textY);
        textY += fontSize + 2;
      });
      ctx.restore();
    }
  }

  protected boxTextY(
    align: CellStyle['verticalAlign'],
    h: number,
    line: number
  ) {
    assertIsDefined(this.renderContext?.box);
    const { canvasOffsetY, height, boxStyle } = this.renderContext.box;
    const padding = boxStyle.padding ?? 0;
    const totalHeight = h * line;
    /*
     * See https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/textBaseline
     */

    if (align === 'top') {
      return canvasOffsetY + padding;
    }
    if (align === 'middle') {
      return Math.max(
        canvasOffsetY + padding + h / 2,
        canvasOffsetY + height / 2 - (totalHeight - h) / 2
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
    let borderTop = 0,
      borderBottom = 0,
      borderLeft = 0,
      borderRight = 0;
    if (boxStyle.border) {
      const [lineWidth] = this.readBorder(boxStyle.border);
      borderTop = borderBottom = borderLeft = borderRight = lineWidth;
    } else if (boxStyle.borderTop) {
      borderTop = this.readBorder(boxStyle.borderTop)[0];
    } else if (boxStyle.borderBottom) {
      borderBottom = this.readBorder(boxStyle.borderBottom)[0];
    } else if (boxStyle.borderLeft) {
      borderLeft = this.readBorder(boxStyle.borderLeft)[0];
    } else if (boxStyle.borderRight) {
      borderRight = this.readBorder(boxStyle.borderRight)[0];
    }

    this.attrs({
      fillStyle: boxStyle.fillStyle,
    });
    ctx.fillRect(
      canvasOffsetX + borderLeft / 2,
      canvasOffsetY + borderTop / 2,
      width - borderLeft / 2 - borderRight / 2,
      height - borderTop / 2 - borderBottom / 2
    );
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
    const {
      border,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft,
    } = boxStyle;

    if (border) {
      ctx.beginPath();
      ctx.save();
      this.applyBorderStyle(border);
      ctx.rect(canvasOffsetX, canvasOffsetY, width, height);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.lineCap = 'square';
    if (borderTop) {
      ctx.beginPath();
      this.applyBorderStyle(borderTop);
      ctx.moveTo(canvasOffsetX, canvasOffsetY);
      ctx.lineTo(canvasOffsetX + width, canvasOffsetY);
      ctx.stroke();
    }
    if (borderRight) {
      ctx.beginPath();
      this.applyBorderStyle(borderRight);
      ctx.moveTo(canvasOffsetX + width, canvasOffsetY);
      ctx.lineTo(canvasOffsetX + width, canvasOffsetY + height);
      ctx.stroke();
    }
    if (borderBottom) {
      ctx.beginPath();
      this.applyBorderStyle(borderBottom);
      ctx.moveTo(canvasOffsetX + width, canvasOffsetY + height);
      ctx.lineTo(canvasOffsetX, canvasOffsetY + height);
      ctx.stroke();
    }
    if (borderLeft) {
      ctx.beginPath();
      this.applyBorderStyle(borderLeft);
      ctx.moveTo(canvasOffsetX, canvasOffsetY + height);
      ctx.lineTo(canvasOffsetX, canvasOffsetY);
      ctx.stroke();
    }
    ctx.restore();
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
    const [canvasOffsetX, canvasOffsetY] = this.utils.distanceToCanvasOrigin(
      x,
      y,
      false
    );
    const width = this.utils.getColSize(x);
    const height = this.utils.getRowSize(y);

    assertIsDefined(cell);
    const cellStyle = merge(this.styleConfig.cell, cell.style ?? {});
    const cellText = cell.text ?? '';

    return {
      canvasOffsetX,
      canvasOffsetY,
      width,
      height,
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
