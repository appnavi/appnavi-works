import { useEffect } from 'react';
import { useSetPreventPageLeave } from '../context/PreventPageLeaveContext';

export const PreventPageLeave = ({
  shouldPreventLeave: shouldPrevent,
}: {
  shouldPreventLeave: boolean;
}) => {
  const { setPreventPageLeave } = useSetPreventPageLeave();
  useEffect(() => {
    setPreventPageLeave(shouldPrevent);
  }, [shouldPrevent]);
  return null;
};
