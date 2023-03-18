import { type User } from '@common/types';
import { createContext, ReactNode, useContext } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { trpc } from '../trpc';

const UserContext = createContext<{
  user: User | null;
} | null>(null);

export const useUserContext = () => {
  const userContext = useContext(UserContext);
  if (userContext === null) {
    throw new Error(
      'UserContextが存在しません。UserContextProviderが存在するか確認してください。',
    );
  }
  return userContext;
};

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: user } = trpc.me.useQuery();
  if (user === undefined) {
    return (
      <div className="w-screen h-screen grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};
