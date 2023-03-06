import { User } from '@common/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
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
  console.log(
    User.parse({
      id: 'a',
      name: 'b',
      avatar_url: 'http://example.com',
      type: 'Slack',
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <main className="flex-grow flex-shrink-0 basis-auto">
          <RouterProvider router={router} />
        </main>
        <Footer />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
