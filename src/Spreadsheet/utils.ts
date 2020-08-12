import SheetManager from 'core/SheetManage';
import { ScrollState } from 'types';
import { ActionWheel } from 'actions/actionScroll';

const sendWheelEvent = (
  sheetManager: SheetManager,
  scrollState: ScrollState,
  {
    delta,
    isVertical,
    scrollHeight,
    scrollWidth,
  }: {
    isVertical?: boolean;
    delta: number;
    scrollWidth: number;
    scrollHeight: number;
  }
) => {
  const { domWidth, domHeight } = sheetManager.sheet.injection.getCanvasSize();
  const max = isVertical
    ? scrollHeight - (domHeight - sheetManager.sheet.utils.getRowSize(-1))
    : scrollWidth - (domWidth - sheetManager.sheet.utils.getColSize(-1));
  const offset = Math.min(
    max,
    (isVertical ? scrollState.scrollTop : scrollState.scrollLeft) + delta
  );

  sheetManager.actionsManager.executeAction(ActionWheel, {
    offset,
    vertical: isVertical,
    delta,
  });
};

export { sendWheelEvent };
