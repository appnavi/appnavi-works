import { useEffect } from 'react';

function alertBeforeLeave(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
}

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
