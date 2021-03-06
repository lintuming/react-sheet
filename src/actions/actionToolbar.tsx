import { ActionName } from './types';
import React from 'react';
import { register, createAction } from './register';
import { isMergeViewport, isViewportsCoincide } from 'core/utils/viewport';
import { unmergeByCellCoords, mergeViewport } from 'core/utils/merges';
import Viewport from 'core/Viewport';
import SheetManager from 'core/SheetManage';

type MergeStatus = 'merged' | 'idle';

const Merge = ({ sheetManager }: { sheetManager: SheetManager }) => {
  const sheet = sheetManager.sheet;
  const state = sheet.getState();

  const [status, setStatus] = React.useState<MergeStatus>(
    isMergeViewport(sheet, state.selectedViewport) ? 'merged' : 'idle'
  );
  const [disabled, setDisabled] = React.useState(
    isViewportsCoincide(state.selectedViewport, state.selectedGroupViewport)
  );
  React.useEffect(() => {
    const dipose = sheet.on('UpdateState', operation => {
      if (
        operation.type === 'UpdateState' &&
        (operation.payload.merges ||
          operation.payload.selectedGroupViewport ||
          operation.payload.selectedViewport)
      ) {
        const state = sheet.getState();
        const isMerged = isMergeViewport(sheet, state.selectedGroupViewport);
        setStatus(isMerged ? 'merged' : 'idle');
        setDisabled(
          isMerged
            ? false
            : isViewportsCoincide(
                state.selectedViewport,
                state.selectedGroupViewport
              )
        );
      }
    });
    return dipose;
  }, [sheet.utils, state, sheet]);
  return (
    <button
      disabled={disabled}
      onClick={() => {
        sheetManager.actionsManager.executeAction(
          sheetManager.actionsManager.actions.merge,
          null
        );
      }}
    >
      {status === 'idle' ? 'merge' : 'unmerge'}
    </button>
  );
};
const ActionMerge = register(
  createAction({
    name: ActionName.merge,
    label: 'toolbar.merge',
    component: Merge,
    perform(_, __: {}, sheet) {
      const state = sheet.getState();
      const isMerge = isMergeViewport(sheet, state.selectedGroupViewport);
      if (isMerge) {
        sheet.setState({
          merges: unmergeByCellCoords(
            sheet,
            state.selectedGroupViewport.x,
            state.selectedGroupViewport.y
          ),
          selectedViewport: new Viewport(
            state.selectedGroupViewport.x,
            state.selectedGroupViewport.y,
            state.selectedGroupViewport.x,
            state.selectedGroupViewport.y
          ),
        });
      } else {
        sheet.setState(state => ({
          merges: mergeViewport(sheet, state.selectedGroupViewport),
          selectedViewport: state.selectedGroupViewport.spawn(),
        }));
      }
      return true;
    },
    commitHistory: true,
  })
);

export { ActionMerge };
