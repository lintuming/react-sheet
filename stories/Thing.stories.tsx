import React from 'react';
import SpreadSheet from '../src/index';

export default {
  title: 'Welcome',
};

const CanvasTest = () => {
  return (
    <canvas
      ref={r => {
        if (r) {
          const ctx = r.getContext('2d');
          //@ts-ignore
          window.ctx = r.getContext('2d');
          ctx.lineCap = 'square'
          function drawLine(
            points: [number, number][],
            setLineStyle: () => void = () => {}
          ) {
            let [x, y] = points[0];
            setLineStyle();
            ctx.moveTo(x, y);
            for (let i = 1; i < points.length; i++) {
              [x, y] = points[i];
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          let canvasOffsetX = 10,
            canvasOffsetY = 10,
            width = 50,
            height = 30;
            ctx.setLineDash([3,2])
          drawLine(
            [
              [canvasOffsetX, canvasOffsetY],
              [canvasOffsetX + width, canvasOffsetY],
            ],
          );

          // applyBorderStyle(borderRight);
          drawLine(
            [
              [canvasOffsetX + width, canvasOffsetY],
              [canvasOffsetX + width, canvasOffsetY + height],
            ],
          );

          // applyBorderStyle(borderBottom);
          drawLine(
            [
              [canvasOffsetX + width, canvasOffsetY + height],
              [canvasOffsetX, canvasOffsetY + height],
            ],
          );

          drawLine(
            [
              [canvasOffsetX, canvasOffsetY + height],
              [canvasOffsetX, canvasOffsetY],
            ],
          );

           canvasOffsetX = 10,
          canvasOffsetY = 60,
          width = 50,
          height = 30;
        drawLine(
          [
            [canvasOffsetX, canvasOffsetY],
            [canvasOffsetX + width, canvasOffsetY],
          ],
        );

        // applyBorderStyle(borderRight);
        drawLine(
          [
            [canvasOffsetX + width, canvasOffsetY],
            [canvasOffsetX + width, canvasOffsetY + height],
          ],
        );

        // applyBorderStyle(borderBottom);
        drawLine(
          [
            [canvasOffsetX + width, canvasOffsetY + height],
            [canvasOffsetX, canvasOffsetY + height],
          ],
        );

        drawLine(
          [
            [canvasOffsetX, canvasOffsetY + height],
            [canvasOffsetX, canvasOffsetY],
          ],
        );
        }
      }}
      width={200}
      height={200}
    ></canvas>
  );
};

export const Default = (props?: Partial<{}>) => (
  <>
    <SpreadSheet width={1080} height={1080} />
  </>
);
