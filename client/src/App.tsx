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
import { QueryContextProvider } from './context/QueryContext';
import { IndexPage } from './pages';
import { NotFoundPage } from './pages/NotFound';
import { AuthPage } from './pages/auth';
import { AuthGuestPage } from './pages/auth/guest';
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
        <MessageDialogContextProvider>
          <ConfirmDialogContextProvider>
            <QueryContextProvider>
              <HelmetProvider>
                <RouterProvider router={router} />
              </HelmetProvider>
            </QueryContextProvider>
          </ConfirmDialogContextProvider>
        </MessageDialogContextProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
