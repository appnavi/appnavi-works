import { type User } from '@common/types';
import { createContext, ReactNode } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { trpc } from '../trpc';

export const UserContext = createContext<User | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data } = trpc.me.useQuery();
  if (data === undefined) {
    return (
      <div className="w-screen h-screen grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return <UserContext.Provider value={data}>{children}</UserContext.Provider>;
};
