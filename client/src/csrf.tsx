import { ReactNode } from 'react';
import { trpc } from './trpc';
export let csrfToken: string | undefined = '';

export const CsrfTokenProvider = ({ children }: { children: ReactNode }) => {
  const { data } = trpc.csrf.useQuery();
  csrfToken = data;
  return <>{children}</>;
};
