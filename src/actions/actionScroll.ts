import { ActionName } from './types';
import { register, createAction } from './register';

export const ActionScroll = register(
  createAction({
    name: ActionName.scroll,
    perform(
      _,
      {
        offset,
        vertical,
      }: {
        offset: number;
        vertical?: boolean;
      },
      sheet
    ) {
      const [i] = sheet.utils.wheelOffsetToGridIndex(
        vertical ? 'row' : 'col',
        offset
      );
      sheet.setState(state => ({
        startIndexs: vertical
          ? [state.startIndexs[0], Math.max(i, 0)]
          : [Math.max(i, 0), state.startIndexs[1]],
      }));
    },
  })
);

export const ActionWheel = register(
  createAction({
    name: ActionName.wheel,
    perform(
      _,
      {
        offset,
        vertical,
        delta,
      }: {
        offset: number;
        vertical?: boolean;
        delta: number;
      },
      sheet
    ) {
      const [i, sum] = sheet.utils.wheelOffsetToGridIndex(
        vertical ? 'row' : 'col',
        offset,
        Math.sign(delta)
      );
      sheet.setState(state => ({
        startIndexs: vertical
          ? [state.startIndexs[0], Math.max(i, 0)]
          : [Math.max(i, 0), state.startIndexs[1]],
      }));
      sheet.injection.scroll(Math.max(sum, offset), vertical, true);
    },
  })
);
