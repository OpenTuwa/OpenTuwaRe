'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar({ showSearch = false, onSearch }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Stories' },
    { href: '/archive', label: 'Archive' },
    { href: '/about', label: 'About' },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-b border-white/5">
      <nav aria-label="Site navigation" className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link className="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">OpenTuwa</Link>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-tuwa-muted">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-white transition-colors ${isActive(link.href) ? 'text-white' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="hidden md:block">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stories"
                className="bg-tuwa-black/60 text-sm text-white placeholder:text-tuwa-muted/60 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-tuwa-accent"
              />
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded bg-white/5 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-tuwa-accent"
            aria-label="Toggle navigation"
            aria-expanded={isMobileMenuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div role="navigation" aria-label="Mobile navigation" className="fixed inset-x-4 top-20 z-40 rounded-lg bg-[rgba(10,10,11,0.95)] border border-white/5 p-4 shadow-lg md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded hover:bg-white/5 transition-colors ${isActive(link.href) ? 'text-white' : 'text-tuwa-muted hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
