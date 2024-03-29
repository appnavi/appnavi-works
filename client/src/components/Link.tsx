import { ComponentProps } from 'react';
import { Link as BaseLink } from 'react-router-dom';
import { useSetPreventPageLeave } from '../context/PreventPageLeaveContext';

export const Link = (props: ComponentProps<typeof BaseLink>) => {
  const { preventPageLeave } = useSetPreventPageLeave();
  return (
    <BaseLink
      {...props}
      className={`${props.className} ${
        preventPageLeave ? 'pointer-events-none' : ''
      }`}
    />
  );
};
