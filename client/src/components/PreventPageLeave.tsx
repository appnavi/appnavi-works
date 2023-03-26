import { useEffect } from 'react';

function alertBeforeLeave(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
}

// FIXME : react-router-dom のページ遷移 を防止できるように修正
// かつては Prompt というコンポーネントで防止できたが、バグの多さから現時点では非推奨。
//
// https://qiita.com/overgoro56/items/a37da0b5f0cf2f033634
// https://github.com/remix-run/react-router/issues/5405
export const PreventPageLeave = ({
  shouldPreventLeave: shouldPrevent,
}: {
  shouldPreventLeave: boolean;
}) => {
  useEffect(() => {
    if (shouldPrevent) {
      window.addEventListener('beforeunload', alertBeforeLeave);
      return () => {
        window.removeEventListener('beforeunload', alertBeforeLeave);
      };
    }
  }, [shouldPrevent]);
  return null;
};
