import { ActionName } from './types';
import React from 'react';
import { register, createAction } from './register';

type MergeStatus = 'merged' | 'idle';

const ActionMerge = register(
  createAction({
    name: ActionName.merge,
    label: 'toolbar.merge',
    component: ({ sheetManager }) => {
      const sheet = sheetManager.sheet;
      const state = sheet.getState();

      const [status, setStatus] = React.useState<MergeStatus>(
        sheet.utils.isSelectedRangeMatchMergesRect() ? 'merged' : 'idle'
      );
      const [disabled, setDisabled] = React.useState(
        sheet.utils.isTwoRectSame(state.selectedRangeRect, state.selectedRect)
      );
      React.useEffect(() => {
        const dipose = sheet.on('UpdateState', operation => {
          if (
            operation.type === 'UpdateState' &&
            (operation.payload.merges ||
              operation.payload.selectedRangeRect ||
              operation.payload.selectedRect)
          ) {
            const state = sheet.getState();
            const isMerged = sheet.utils.isSelectedRangeMatchMergesRect();
            setStatus(isMerged ? 'merged' : 'idle');
            setDisabled(
              isMerged
                ? false
                : sheet.utils.isTwoRectSame(
                    state.selectedRangeRect,
                    state.selectedRect
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
    },
    perform(_, __: {}, sheet) {
      const utils = sheet.utils;
      const state = sheet.getState();
      const isMatch = utils.isRectMatchMergesRect(...state.selectedRangeRect);

      if (isMatch) {
        sheet.setState({
          merges: utils.mergesAfterUnmergeByGrid(
            state.selectedRangeRect[0],
            state.selectedRangeRect[1]
          ),
          selectedRect: [
            state.selectedRangeRect[0],
            state.selectedRangeRect[1],
            state.selectedRangeRect[0],
            state.selectedRangeRect[1],
          ],
        });
        return true;
      } else {
        sheet.setState(state => ({
          merges: utils.mergesAfterMergeSelectedRange(),
          selectedRect: [...state.selectedRangeRect],
        }));
        return true;
      }
    },
    commitHistory: true,
  })
);

export { ActionMerge };
