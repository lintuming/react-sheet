import React from 'react';
import SpreadSheet from '../dist/react-sheet.esm';

export default {
  title: 'Welcome',
};

export const Default = (props?: Partial<{}>) => (
  <>
    <SpreadSheet width={1080} height={1080} />
  </>
);
