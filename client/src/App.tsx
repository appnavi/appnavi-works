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
import { UserContextProvider } from './context/UserContext';
import { CsrfTokenProvider } from './csrf';
import { IndexPage } from './pages';
import { NotFoundPage } from './pages/NotFound';
import { AuthPage } from './pages/auth';
import { AuthGuestPage } from './pages/auth/guest';
import { DbUsersPage } from './pages/db/users';
import { DbUsersRawPage } from './pages/db/users/raw';
import { DbWorksPage } from './pages/db/works';
import { DbWorksRawPage } from './pages/db/works/raw';
import { UploadUnityPage } from './pages/upload/unity';
import { trpc } from './trpc';

const PageRoot = () => {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex-shrink-0 basis-auto">
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
        path: '/db/users/raw',
        element: <DbUsersRawPage />,
      },
      {
        path: '/db/works',
        element: <DbWorksPage />,
      },
      {
        path: '/db/works/raw',
        element: <DbWorksRawPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
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
                <HelmetProvider>
                  <RouterProvider router={router} />
                </HelmetProvider>
              </UserContextProvider>
            </ConfirmDialogContextProvider>
          </MessageDialogContextProvider>
        </CsrfTokenProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
