import Sheet from 'core/Sheet';

export const mergesAfterUnmerge = (sheet: Sheet, index: number) => {
  const state = sheet.getState();
  const merges = [...state.merges];
  merges[index] = merges[merges.length - 1];
  merges.length -= 1;
  return merges;
};
