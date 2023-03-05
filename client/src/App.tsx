import React from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <main className="container flex-grow flex-shrink-0 basis-auto"></main>
      <Footer />
    </>
  );
}

export default App;
