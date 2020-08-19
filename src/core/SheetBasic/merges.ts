import Sheet from 'core/Sheet';

export const unmergeByIndex = (sheet: Sheet, index: number) => {
  const state = sheet.getState();
  const merges = [...state.merges];
  merges[index] = merges[merges.length - 1];
  merges.length -= 1;
  return merges;
};



export const unmergeByCellCoords=(x: number, y: number) => {
  const merge = this.isGridLocateMergeRect(x, y);
  if (merge) {
    return this.mergesAfterUnmerge(merge.index);
  }
  return this.getState().merges;
}
mergesAfterMergeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): SheetInternalState['merges'] {
  const merges = this.state.merges;
  if (merges.length > 0) {
    for (let i = 0; i < merges.length; i++) {
      const range = merges[i];
      const [rangeX, rangeY, rangeXEnd, rangeYEnd] = range;
      if (
        x1 <= rangeX &&
        y1 <= rangeY &&
        x2 >= rangeXEnd &&
        y2 >= rangeYEnd
      ) {
        deleteAt(merges, i);
        i--;
      }
    }
  }
  return [...merges, [x1, y1, x2, y2]];
}
mergesAfterMergeSelectedRange() {
  const selectedRangeRect = this.state.selectedRangeRect;
  return this.mergesAfterMergeRect(...selectedRangeRect);
}