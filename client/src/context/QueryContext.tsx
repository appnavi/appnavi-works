import { type User } from '@common/types';
import { createContext, ReactNode, useContext } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { trpc } from '../trpc';

const QueryContext = createContext<{
  user: User | null;
  csrfToken: string;
} | null>(null);

export const useQueryContext = () => {
  const queryContext = useContext(QueryContext);
  if (queryContext === null) {
    throw new Error(
      'QueryContextが存在しません。QueryContextProviderが存在するか確認してください。',
    );
  }
  return queryContext;
};

export const QueryContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: user } = trpc.me.useQuery();
  const { data: csrfToken } = trpc.csrf.useQuery();
  if (user === undefined || csrfToken === undefined) {
    return (
      <div className="w-screen h-screen grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <QueryContext.Provider value={{ user, csrfToken }}>
      {children}
    </QueryContext.Provider>
  );
};
