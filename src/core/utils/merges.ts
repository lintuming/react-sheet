import SheetBasic from 'core/SheetBasic';
import { isCellInMergeViewport } from './hitTest';
import { SheetInternalState } from 'types';
import { isViewportContain } from './viewport';
import { deleteAt } from 'utils';
import Viewport from 'core/Viewport';

export const unmergeByIndex = (sheet: SheetBasic, index: number) => {
  const state = sheet.getState();
  const merges = [...state.merges];
  merges[index] = merges[merges.length - 1];
  merges.length -= 1;
  return merges;
};

export const unmergeByCellCoords = (
  sheet: SheetBasic,
  x: number,
  y: number
) => {
  const merge = isCellInMergeViewport(sheet, x, y);
  if (merge) {
    return unmergeByIndex(sheet, merge.index);
  }
  return sheet.getState().merges;
};

export const mergeViewport = (
  sheet: SheetBasic,
  viewport: Viewport
): SheetInternalState['merges'] => {
  const state = sheet.getState();
  const merges = state.merges;
  if (merges.length > 0) {
    for (let i = 0; i < merges.length; i++) {
      const mergeViewport = merges[i];
      if (isViewportContain(viewport, mergeViewport)) {
        deleteAt(merges, i);
        i--;
      }
    }
  }
  return [...merges, viewport];
};
