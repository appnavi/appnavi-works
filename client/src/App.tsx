import React from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { IndexPage } from './pages/IndexPage';
import { User } from '@common/types';
const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexPage />,
  },
]);

function App() {
  console.log(
    User.parse({
      id: 'a',
      name: 'b',
      avatar_url: 'http://example.com',
      type: 'Slack',
    }),
  );
  return (
    <>
      <Navbar />
      <main className="flex-grow flex-shrink-0 basis-auto">
        <RouterProvider router={router} />
      </main>
      <Footer />
    </>
  );
}

export default App;
