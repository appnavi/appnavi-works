import React from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Hello world!</div>,
  },
]);

function App() {
  return (
    <>
      <Navbar />
      <main className="container flex-grow flex-shrink-0 basis-auto">
        <RouterProvider router={router} />
      </main>
      <Footer />
    </>
  );
}

export default App;
