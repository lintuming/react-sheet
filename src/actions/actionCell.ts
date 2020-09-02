import { ActionName } from './types';
import { register, createAction } from './register';
import { Cell } from 'types';

const ActionEditCell = register(
  createAction({
    name: ActionName.editCell,
    commitHistory: true,
    perform(
      _,
      { x, y, payload }: { x: number; y: number; payload: Partial<Cell> },
      sheet
    ) {
      sheet.updateCell(x, y, payload);
      return true;
    },
  })
);

export { ActionEditCell };
