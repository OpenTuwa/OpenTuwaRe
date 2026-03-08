import React, { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

function RevealSection({ children, className = '' }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function About() {
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [authorError, setAuthorError] = useState(null);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState({ loading: false, message: '', type: '' });

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await fetch('/api/authors_1');
        if (!response.ok) throw new Error('Failed to fetch authors');
        const data = await response.json();
        setAuthors(data || []);
      } catch (error) {
        console.error(error);
        setAuthorError('Could not load contributor list.');
      } finally {
        setLoadingAuthors(false);
      }
    };
    fetchAuthors();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubStatus({ loading: true, message: '', type: '' });
    try {
      const response = await fetch('/api/subscribe', {
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
      <main className="flex-grow pt-32 pb-24 max-w-7xl mx-auto w-full px-6">
        <div className="py-16 border-b border-white/10">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight mb-6">
            About OpenTuwa
          </h1>
          <p className="text-lg text-tuwa-muted max-w-3xl leading-relaxed">
            An independent platform built for long-form articles, research, and media exploring foundational ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-16">
          <div className="md:col-span-7 lg:col-span-8 space-y-12 text-tuwa-text leading-relaxed">
            <RevealSection>
              <section>
                <h2 className="text-xl font-heading font-bold text-white mb-4 uppercase tracking-wide text-sm">The Project</h2>
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
                <h2 className="text-xl font-heading font-bold text-white mb-4 uppercase tracking-wide text-sm">An Open Platform</h2>
                <p className="mb-4 text-tuwa-muted">
                  The "Open" in OpenTuwa means exactly that. While it began as a solo effort, the architecture of this site is built to host multiple voices.
                </p>
                <p className="text-tuwa-muted">
                  It is an open space for independent writers, researchers, and creators who want to publish their articles or share their media. By bringing together different contributors over time, the goal is to build a modest but rigorous library of critical thought.
                </p>
              </section>
            </RevealSection>
          </div>

          {/* Sidebar - Contributors */}
          <aside className="md:col-span-5 lg:col-span-4 space-y-10">
            <div className="bg-tuwa-black border-l border-white/10 pl-6 lg:pl-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-tuwa-muted mb-8 border-b border-white/10 pb-4">
                Contributors
              </h3>
              <div className="space-y-8">
                {loadingAuthors && <p className="text-xs text-tuwa-muted font-mono">Loading authors...</p>}
                {authorError && <p className="text-xs text-red-400">{authorError}</p>}
                {!loadingAuthors && !authorError && authors.length === 0 && (
                  <p className="text-sm text-tuwa-muted">No authors found.</p>
                )}
                {!loadingAuthors && !authorError && authors.map((author, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <img
                      src={author.avatar_url || author.avatar || author.image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23161618"><rect width="100" height="100"/></svg>'}
                      alt={author.name}
                      className="w-10 h-10 object-cover grayscale border border-white/10"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm flex items-center gap-1">
                        {author.name}
                        {(author.role === 'Founder and Editor-in-Chief' || author.role === 'Developer' || author.role === 'Founder & Editor-in-Chief' || author.role === 'Journalist') && (
                          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#1D9BF0"/><path d="M9.5 12.5L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </h4>
                      <p className="text-[10px] text-tuwa-muted uppercase tracking-wider mt-1 mb-2">{author.role || 'Contributor'}</p>
                      {author.bio && <p className="text-xs text-tuwa-muted leading-relaxed mb-2">{author.bio}</p>}
                      <a href={`/?author=${encodeURIComponent(author.name)}`} className="text-[11px] editorial-link text-tuwa-muted">View profile →</a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-white/10">
                <a href="/archive" className="text-sm font-medium text-tuwa-muted hover:text-white transition-colors">
                  Read the Articles →
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Subscribe Section */}
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
              {subStatus.loading ? 'Wait...' : 'Subscribe'}
            </button>

            <div className={`absolute -bottom-8 left-0 right-0 text-sm font-medium transition-opacity duration-300 ${subStatus.message ? 'opacity-100' : 'opacity-0'} ${subStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {subStatus.message}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
