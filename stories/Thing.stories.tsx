import React from 'react';
import S from '../src/index';

export default {
  title: 'Welcome',
};

// By passing optional props to this story, you can control the props of the component when
// you consume the story in a test.

const C = () => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const draw = () => {
    if (ref.current) {
      const ctx = ref.current.getContext('2d');
      ctx.moveTo(0.5, 10.5);
      ctx.lineWidth = 1;
      ctx.lineTo(30.5, 10.5);
      ctx.strokeStyle = 'red';
      ctx.stroke();
      ctx.beginPath();
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.lineWidth = 2;
      // ctx.moveTo(5, 20);
      ctx.moveTo(30 + 30, 20);
      ctx.lineTo(30 + 30, 40);
      // ctx.lineTo(5, 40);
      ctx.moveTo(5, 40);
      ctx.lineTo(5, 20);
      ctx.stroke();
    }
  };
  React.useEffect(() => {
    draw();
  }, []);
  return <canvas ref={ref} width={200} height={200}></canvas>;
};

export const Default = (props?: Partial<{}>) => (
  <>
    <C />

    <S width={1080} height={1080} />
  </>
);
