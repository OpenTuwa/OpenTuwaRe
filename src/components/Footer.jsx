import React from 'react';

export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-2xl font-extrabold tracking-tighter font-heading text-white">OpenTuwa</div>
        <div className="flex flex-wrap justify-center md:justify-end space-x-8 text-xs font-bold tracking-widest uppercase text-tuwa-muted">
          <a className="hover:text-white transition-colors" href="/legal">Terms & Privacy</a>
          <a className="hover:text-white transition-colors" href="/about">About OpenTuwa</a>
          <a className="hover:text-white transition-colors" href="https://x.com/OpenTuwa" target="_blank" rel="noopener noreferrer">X (formerly Twitter)</a>
        </div>
        <div className="text-xs text-tuwa-muted">© 2026 OpenTuwa Media. All rights reserved.</div>
      </div>
    </footer>
  );
}
