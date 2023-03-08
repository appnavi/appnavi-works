import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryContext } from '../context/QueryContext';

export const UnauthorizedOnly = ({ children }: { children: ReactNode }) => {
  const { user } = useQueryContext();
  if (user !== null) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};
