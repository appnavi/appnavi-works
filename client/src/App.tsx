import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { UserProvider } from './context/UserContext';
import { AuthPage } from './pages/AuthPage';
import { IndexPage } from './pages/IndexPage';
import { trpc } from './trpc';
const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexPage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
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
          <Navbar />
          <main className="flex-grow flex-shrink-0 basis-auto">
            <RouterProvider router={router} />
          </main>
          <Footer />
        </UserProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
