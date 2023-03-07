import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ConfirmDialogContextProvider } from './context/DialogsContext/ConfirmDialog';
import { MessageDialogContextProvider } from './context/DialogsContext/MessageDialog';
import { QueryContextProvider } from './context/QueryContext';
import { IndexPage } from './pages';
import { NotFoundPage } from './pages/NotFound';
import { AuthPage } from './pages/auth';
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
              <RouterProvider router={router} />
            </QueryContextProvider>
          </ConfirmDialogContextProvider>
        </MessageDialogContextProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
