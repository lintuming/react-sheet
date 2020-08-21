import React from 'react';

export default function useRerender() {
  const update = React.useState({})[1];
  const rerender = React.useCallback(() => {
    update({});
  }, []);
  return rerender;
}
