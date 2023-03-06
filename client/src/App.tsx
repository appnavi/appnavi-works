import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { UserProvider } from './context/UserContext';
import { AuthPage } from './pages/AuthPage';
import { IndexPage } from './pages/IndexPage';
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
const ErrorRoute = () => {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex-shrink-0 basis-auto">404</main>
      <Footer />
    </>
  );
};
const router = createBrowserRouter([
  {
    path: '/',
    element: <PageRoot />,
    errorElement: <ErrorRoute />,
    children: [
      { path: '/', element: <IndexPage /> },
      {
        path: '/auth',
        element: <AuthPage />,
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
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
