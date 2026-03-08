import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BackToTop from './BackToTop';

export default function Layout({ children, showSearch = false, onSearch }) {
  return (
    <div className="tuwa-upgrade bg-[#0a0a0b] min-h-screen text-white flex flex-col">
      <Navbar showSearch={showSearch} onSearch={onSearch} />
      <div className="flex-grow">{children}</div>
      <Footer />
      <BackToTop />
    </div>
  );
}
