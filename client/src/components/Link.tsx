import { ComponentProps } from 'react';
import { Link as BaseLink } from 'react-router-dom';
import { useSetPreventPageLeave } from '../context/PreventPageLeaveContext';

export const Link = (props: ComponentProps<typeof BaseLink>) => {
  const { preventPageLeave } = useSetPreventPageLeave();
  console.log(props.className);
  return (
    <BaseLink
      {...props}
      className={
        preventPageLeave
          ? `${props.className} pointer-events-none `
          : props.className
      }
    />
  );
};
