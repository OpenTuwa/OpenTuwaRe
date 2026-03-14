import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BackToTop from './BackToTop';

export default function Layout({ children, showSearch = false, onSearch }) {
  return (
    <div className="tuwa-upgrade bg-[#0a0a0b] min-h-screen text-white flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-tuwa-accent focus:text-white focus:px-4 focus:py-2 focus:rounded focus:font-semibold">Skip to content</a>
      <Navbar showSearch={showSearch} onSearch={onSearch} />
      <div id="main-content" className="flex-grow">{children}</div>
      <Footer />
      <BackToTop />
    </div>
  );
}
