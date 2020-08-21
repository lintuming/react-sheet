import { ActionName } from './types';
import { register, createAction } from './register';
import { getViewportAfterWheel } from 'core/utils/viewport';

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
      const scrollState = sheet.injection.getScrollOffset();
      const currentScrollTop = vertical ? offset : scrollState.scrollTop;
      const currentScrollLeft = vertical ? scrollState.scrollLeft : offset;
      const { viewport } = getViewportAfterWheel(
        sheet,
        currentScrollTop,
        currentScrollLeft,
        vertical
      );
      sheet.setState(() => ({
        gridViewport: viewport,
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
      const scrollState = sheet.injection.getScrollOffset();
      const currentScrollTop = vertical ? offset : scrollState.scrollTop;
      const currentScrollLeft = vertical ? scrollState.scrollLeft : offset;
      const { viewport, scrollLeft, scrollTop } = getViewportAfterWheel(
        sheet,
        currentScrollTop,
        currentScrollLeft,
        vertical,
        Math.sign(delta)
      );
      sheet.setState(() => ({
        gridViewport: viewport,
      }));
      sheet.injection.scroll(vertical ? scrollTop : scrollLeft, vertical, true);
    },
  })
);
