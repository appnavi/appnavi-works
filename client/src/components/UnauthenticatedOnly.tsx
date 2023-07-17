import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

export const UnauthenticatedOnly = ({ children }: { children: ReactNode }) => {
  const { user } = useUserContext();
  if (user !== null) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};
