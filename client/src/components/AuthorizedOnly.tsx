import { User } from '@common/types';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryContext } from '../context/QueryContext';

export const AuthorizedOnly = ({
  children,
}: {
  children: (user: User) => ReactNode;
}) => {
  const { user } = useQueryContext();
  if (user === null) {
    return <Navigate to="/auth" />;
  }
  return <>{children(user)}</>;
};
