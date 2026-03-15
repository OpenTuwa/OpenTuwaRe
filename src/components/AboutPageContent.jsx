'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useScrollReveal from '../hooks/useScrollReveal';
import SkeletonImage from './SkeletonImage';
import { isVerifiedRole } from '../utils/verifiedRoles';
import VerifiedBadge from './VerifiedBadge';

function RevealSection({ children, className = '' }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function AboutPageContent({ authors = [] }) {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState({ loading: false, message: '', type: '' });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubStatus({ loading: true, message: '', type: '' });
    try {
      const response = await fetch('/api/subscribe_contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setSubStatus({ loading: false, message: data.message || 'Subscribed successfully!', type: 'success' });
        setEmail('');
        setTimeout(() => setSubStatus(prev => ({ ...prev, message: '', type: '' })), 4000);
      } else {
        setSubStatus({ loading: false, message: data.error || 'Subscription failed.', type: 'error' });
      }
    } catch (error) {
      setSubStatus({ loading: false, message: 'System error. Please try again.', type: 'error' });
    }
  };

  return (
    <>
      {/* Masthead banner */}
      <div className="bg-tuwa-black border-b border-white/10 px-6 pt-28 pb-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-tuwa-muted mb-2">OpenTuwa</p>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white tracking-tight">About</h1>
        </div>
      </div>

      <main className="flex-grow pt-8 pb-24 max-w-7xl mx-auto w-full px-6">
        <div className="py-10 border-b border-white/10">
          <div className="prose prose-invert prose-lg max-w-none text-tuwa-muted">
            <p className="lead text-xl text-white font-medium mb-6">
              OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. 
              We are built for deep thought, not fast cycles.
            </p>
            <p className="mb-6">
              In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for 
              substantive journalism and rigorous intellectual inquiry. Our mission is to surface stories that challenge assumptions, 
              expand worldviews, and provide the context often missing from the daily news cycle.
            </p>
            <p className="mb-6">
              Our "Neural Gravity" recommendation engine is designed to break filter bubbles, balancing popularity with intellectual density. 
              We prioritize content that demonstrates depth, nuance, and factual integrity over sensationalism.
            </p>
            <h3 className="text-2xl font-heading font-bold text-white mt-8 mb-4">Our Core Values</h3>
            <ul className="list-disc pl-6 space-y-2 mb-8">
              <li><strong>Independence:</strong> We are reader-supported and free from corporate influence.</li>
              <li><strong>Depth:</strong> We value comprehensive analysis over hot takes.</li>
              <li><strong>Transparency:</strong> Our algorithms and editorial processes are open and accountable.</li>
              <li><strong>Global Perspective:</strong> We seek voices from across the globe, not just the usual power centers.</li>
            </ul>
          </div>
        </div>

        <div className="mb-12 mt-10">
          <h2 className="text-2xl font-bold font-heading text-white mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-tuwa-accent"></span>
            Contributors & Editors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-7 lg:col-span-8 space-y-12 text-tuwa-text leading-relaxed">
            <RevealSection>
              <section>
                <h2 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">The Project</h2>
                <p className="mb-4 text-tuwa-muted">
                  OpenTuwa started as a personal initiative to cut through the noise. Most of the internet is focused on fast reactions and daily news cycles. This platform is built for the opposite: stepping back and taking the time to write, research, and think deeply about history, society, and philosophy.
                </p>
                <p className="text-tuwa-muted">
                  It is a ground-up, independent project. There is no corporate backing or massive editorial board behind this—just a dedication to exploring concepts thoroughly through articles and contextual media.
                </p>
              </section>
            </RevealSection>

            <hr className="border-white/10" />

            <RevealSection>
              <section>
                <h2 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">An Open Platform</h2>
                <p className="mb-4 text-tuwa-muted">
                  The "Open" in OpenTuwa means exactly that. While it began as a solo effort, the architecture of this site is built to host multiple voices.
                </p>
                <p className="text-tuwa-muted">
                  It is an open space for independent writers, researchers, and creators who want to publish their articles or share their media. By bringing together different contributors over time, the goal is to build a modest but rigorous library of critical thought.
                </p>
              </section>
            </RevealSection>
          </div>

          <aside className="md:col-span-5 lg:col-span-4 space-y-10">
            <div className="bg-tuwa-black border-l border-white/10 pl-6 lg:pl-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-tuwa-muted mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                <span className="w-3 h-[2px] bg-tuwa-accent inline-block" />
                Contributors
              </h3>
              <div className="space-y-8">
                {authors.length === 0 && (
                  <p className="text-sm text-tuwa-muted">No authors found.</p>
                )}
                {authors.map((author, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <SkeletonImage
                      src={author.avatar_url || author.avatar || author.image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23161618"><rect width="100" height="100"/></svg>'}
                      alt={author.name}
                      className="w-10 h-10 object-cover grayscale border border-white/10"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm flex items-center gap-1">
                        {author.name}
                        {isVerifiedRole(author.role) && (
                          <VerifiedBadge name={author.name} role={author.role} size="sm" />
                        )}
                      </h4>
                      <span className="inline-block mt-1 mb-2 px-2 py-0.5 border border-white/20 rounded-full text-[10px] text-tuwa-muted uppercase tracking-wider">{author.role || 'Contributor'}</span>
                      {author.bio && <p className="text-xs text-tuwa-muted leading-relaxed mb-2">{author.bio}</p>}
                      <Link href={`/authors/${String(author.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="text-[11px] editorial-link text-tuwa-muted">View profile →</Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-white/10">
                <Link href="/archive" className="text-sm font-medium text-tuwa-muted hover:text-white transition-colors">
                  Read the Articles →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <section id="subscribe-section" className="border-t border-white/10 bg-tuwa-gray">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-heading font-bold text-white mb-3">Contribute with us</h2>
          <p className="text-tuwa-muted text-sm leading-relaxed mb-8">
            Drop your email to get notified.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 justify-center relative max-w-lg mx-auto">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-grow bg-tuwa-black border border-white/10 rounded-full px-6 py-3 text-white focus:outline-none focus:border-tuwa-accent focus:ring-1 focus:ring-tuwa-accent transition-all placeholder:text-tuwa-muted/50 text-sm"
              placeholder="Enter your email"
              type="email"
            />
            <button
              disabled={subStatus.loading}
              className="bg-tuwa-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all disabled:opacity-50 min-w-[140px] text-sm"
              type="submit"
            >
              {subStatus.loading ? 'Wait...' : 'Work together'}
            </button>

            <div className={`absolute -bottom-8 left-0 right-0 text-sm font-medium transition-opacity duration-300 ${subStatus.message ? 'opacity-100' : 'opacity-0'} ${subStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {subStatus.message}
            </div>
          </form>
        </div>
      </section>

      {/* Signal secure tip section */}
      <section className="border-t border-white/10 bg-tuwa-black">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          {/* Signal wordmark + lock icon */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <svg viewBox="0 0 48 48" width="32" height="32" fill="none" aria-label="Signal" role="img">
              <circle cx="24" cy="24" r="24" fill="#3A76F0"/>
              <path d="M24 10.5a13.5 13.5 0 1 0 6.364 25.37l3.272.9-.9-3.272A13.5 13.5 0 0 0 24 10.5z" fill="white"/>
              <path d="M19 24h10M19 20h10M19 28h6" stroke="#3A76F0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-bold text-lg tracking-tight">Signal</span>
            <span className="text-white/30 text-xs font-medium uppercase tracking-widest border border-white/10 rounded px-2 py-0.5">Encrypted</span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-white mb-3">Send us a secure tip</h2>
          <p className="text-tuwa-muted text-sm leading-relaxed mb-2 max-w-xl mx-auto">
            Have a story, document, or information you want to share confidentially? Contact OpenTuwa on Signal for end-to-end encrypted, metadata-minimised communication.
          </p>
          <p className="text-white/30 text-xs mb-8">
            Signal does not log your identity, IP address, or message content. Your source protection is our priority.
          </p>

          <a
            href="https://signal.me/#eu/bquAC4a6nlu2QkJSDs2oD_TpUflpKObY5badX6z5IrGPk1U7uBxHGr916Aa6vXYb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#3A76F0] hover:bg-[#2d65d8] text-white font-bold py-3 px-8 rounded-full transition-all text-sm shadow-[0_0_24px_rgba(58,118,240,0.25)] hover:shadow-[0_0_32px_rgba(58,118,240,0.4)]"
          >
            <svg viewBox="0 0 48 48" width="18" height="18" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.2"/>
              <path d="M24 10.5a13.5 13.5 0 1 0 6.364 25.37l3.272.9-.9-3.272A13.5 13.5 0 0 0 24 10.5z" fill="white"/>
            </svg>
            Contact on Signal
          </a>

          <p className="text-white/20 text-[11px] mt-6">
            Signal is a registered trademark of Signal Messenger LLC. OpenTuwa is not affiliated with Signal Messenger LLC.
          </p>
        </div>
      </section>
    </>
  );
}
