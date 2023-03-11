import { User } from '@common/types';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

export const SlackUserOnly = ({
  children,
}: {
  children: (user: User) => ReactNode;
}) => {
  const { user } = useUserContext();
  if (user === null) {
    return <Navigate to="/auth" />;
  }
  if (user.type !== 'Slack') {
    return <Navigate to="/" />;
  }
  return <>{children(user)}</>;
};
