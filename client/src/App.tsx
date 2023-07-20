import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import superjson from 'superjson';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ConfirmDialogContextProvider } from './context/DialogsContext/ConfirmDialog';
import { MessageDialogContextProvider } from './context/DialogsContext/MessageDialog';
import { PreventPageLeaveContextProvider } from './context/PreventPageLeaveContext';
import { UserContextProvider } from './context/UserContext';
import { csrfToken, CsrfTokenProvider } from './csrf';
import { IndexPage } from './pages';
import { AccountPage } from './pages/account';
import { AccountGuestPage } from './pages/account/guest';
import { AuthPage } from './pages/auth';
import { AuthGuestPage } from './pages/auth/guest';
import { DbUsersPage } from './pages/db/users';
import { DbWorksPage } from './pages/db/works';
import { ErrorPage } from './pages/error';
import { UploadUnityPage } from './pages/upload/unity';
import { trpc } from './trpc';

const PageRoot = () => {
  return (
    <>
      <Navbar />
      <main className="flex-shrink-0 flex-grow basis-auto">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <PageRoot />,
    children: [
      {
        path: '/',
        element: <IndexPage />,
      },
      {
        path: '/account',
        element: <AccountPage />,
      },
      {
        path: '/account/guest',
        element: <AccountGuestPage />,
      },
      {
        path: '/auth',
        element: <AuthPage />,
      },
      {
        path: '/auth/guest',
        element: <AuthGuestPage />,
      },
      {
        path: '/upload/unity',
        element: <UploadUnityPage />,
      },
      {
        path: '/db/users',
        element: <DbUsersPage />,
      },
      {
        path: '/db/works',
        element: <DbWorksPage />,
      },
    ],
    errorElement: <ErrorPage />,
  },
]);

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api',
          headers() {
            return {
              'x-csrf-token': csrfToken,
            };
          },
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <CsrfTokenProvider>
          <MessageDialogContextProvider>
            <ConfirmDialogContextProvider>
              <UserContextProvider>
                <PreventPageLeaveContextProvider>
                  <HelmetProvider>
                    <RouterProvider router={router} />
                  </HelmetProvider>
                </PreventPageLeaveContextProvider>
              </UserContextProvider>
            </ConfirmDialogContextProvider>
          </MessageDialogContextProvider>
        </CsrfTokenProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
