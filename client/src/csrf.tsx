import { ReactNode, useEffect } from 'react';
export let csrfToken: string | undefined = '';

export const CsrfTokenProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    let mounted = true;
    const refreshCsrfToken = () => {
      fetch(`${location.origin}/api/csrf`, { credentials: 'include' })
        .then((res) => res.text())
        .then((data) => {
          if (mounted) {
            csrfToken = data;
          }
        });
    };
    refreshCsrfToken();
    setInterval(refreshCsrfToken, 100 * 1000);
    return () => {
      mounted = false;
    };
  }, []);
  return <>{children}</>;
};
