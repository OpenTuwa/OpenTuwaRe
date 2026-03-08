import React, { useState, useEffect } from 'react';

export default function Archive() {
  // 1. Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 2. Archive Data State
  const [archiveData, setArchiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch and Group the Data
  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const response = await fetch('/api/article');
        const articles = await response.json();
        
        if (articles.length === 0) {
          setArchiveData([]);
          setLoading(false);
          return;
        }

        // Group articles by Year automatically
        const grouped = articles.reduce((acc, article) => {
            const date = new Date(article.published_at || Date.now());
            const year = date.getFullYear();
            if (!acc[year]) acc[year] = [];
            acc[year].push(article);
            return acc;
        }, {});

        // Sort years descending and convert to an array we can map over
        const sortedArchive = Object.keys(grouped)
          .sort((a, b) => b - a)
          .map(year => ({
            year: year,
            articles: grouped[year]
          }));

        setArchiveData(sortedArchive);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArchive();
  }, []);

  return (
    <div className="tuwa-upgrade bg-[rgba(10,10,11,1)] min-h-screen text-white flex flex-col">
      {/* Skip to content */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-24 focus:left-6 z-60 bg-white/5 text-white px-3 py-2 rounded">
        Skip to content
      </a>

      {/* Header */}
      <header role="banner" className="fixed top-0 w-full z-50 backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-b border-white/5">
        <nav role="navigation" aria-label="Main" className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a className="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">Tuwa</a>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-tuwa-muted" id="primaryNavArchive">
              <a className="hover:text-white transition-colors" href="/">Stories</a>
              <a className="text-white transition-colors" href="/archive">Archive</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-controls="mobileNavArchive" 
              aria-expanded={isMobileMenuOpen} 
              className="md:hidden p-2 rounded bg-white/3 text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-tuwa-accent" 
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18"></path>
              </svg>
            </button>

            {/* Mobile Nav Dropdown */}
            {isMobileMenuOpen && (
              <div id="mobileNavArchive" className="fixed inset-x-4 top-20 z-40 rounded-lg bg-[rgba(10,10,11,0.95)] border border-white/5 p-4 shadow-lg md:hidden block" role="menu" aria-labelledby="navToggleArchive">
                <a role="menuitem" href="/" className="block px-3 py-2 rounded text-white hover:bg-white/5">Stories</a>
                <a role="menuitem" href="/archive" className="block px-3 py-2 rounded text-tuwa-muted hover:text-white hover:bg-white/5">Archive</a>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main" role="main" className="pt-32 pb-20 px-6 max-w-3xl mx-auto flex-grow w-full">
        <div className="mb-16 border-b border-white/10 pb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-4">The Archive</h1>
          <p className="text-xl text-tuwa-muted">A complete timeline of everything we've published.</p>
        </div>

        <div id="archive-container" className="space-y-16">
          
          {/* Loading State */}
          {loading && <div className="py-10 text-center text-tuwa-muted animate-pulse">Scanning archives...</div>}
          
          {/* Error State */}
          {error && <div className="text-red-500 py-10">Failed to load archive: {error}</div>}
          
          {/* Empty State */}
          {!loading && !error && archiveData.length === 0 && (
            <div className="text-tuwa-muted">The archive is currently empty.</div>
          )}

          {/* Render Grouped Archive Data */}
          {!loading && !error && archiveData.map((yearGroup) => (
            <section key={yearGroup.year}>
              <h2 className="text-3xl font-bold font-heading text-white mb-8 border-b border-white/5 pb-4">
                {yearGroup.year}
              </h2>
              <div className="space-y-6">
                
                {/* Loop through the articles inside each year */}
                {yearGroup.articles.map((article, index) => {
                  const date = new Date(article.published_at || Date.now());
                  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const tag = article.tags ? article.tags.split(',')[0].trim() : 'Article';

                  return (
                    <a 
                      key={index} 
                      href={`/articles/${article.slug}?`} 
                      className="group flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-8 hover:bg-white/[0.02] p-4 -mx-4 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-6 flex-1">
                        <span className="text-sm text-tuwa-muted w-16 shrink-0 font-medium">{monthDay}</span>
                        <h3 className="text-lg font-medium text-tuwa-text group-hover:text-tuwa-accent transition-colors leading-tight">
                          {article.title}
                        </h3>
                      </div>
                      <div className="hidden sm:flex text-xs text-tuwa-muted shrink-0 uppercase tracking-widest font-bold">
                        {tag}
                      </div>
                    </a>
                  );
                })}

              </div>
            </section>
          ))}

        </div>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="py-12 px-6 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-extrabold tracking-tighter font-heading text-white">OpenTuwa</div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-8 text-xs font-bold tracking-widest uppercase text-tuwa-muted">
            <a className="hover:text-white transition-colors" href="/legal?">Terms & Privacy</a>
            <a className="hover:text-white transition-colors" href="/about">About OpenTuwa</a>
            <a className="hover:text-white transition-colors" href="https://x.com/OpenTuwa" target="_blank" rel="noopener noreferrer">X (formerly Twitter)</a>
          </div>
        </div>
      </footer>
    </div>
  );
}