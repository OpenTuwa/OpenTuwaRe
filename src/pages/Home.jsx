import React, { useState, useEffect } from 'react';

export default function Home() {
  // 1. React State for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 2. React State for Articles Database
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetching Data from your existing Cloudflare API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/article');
        const data = await response.json();
        setArticles(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="tuwa-upgrade bg-[rgba(10,10,11,1)] min-h-screen text-white">
      {/* Skip to content */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-24 focus:left-6 z-60 bg-white/5 text-white px-3 py-2 rounded">
        Skip to content
      </a>

      {/* Header & Navigation */}
      <header role="banner" className="fixed top-0 w-full z-50 backdrop-blur-md bg-[rgba(10,10,11,0.8)] border-b border-white/5">
        <nav role="navigation" aria-label="Main" className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a className="text-2xl font-extrabold tracking-tighter font-heading text-white" href="/">Tuwa</a>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-tuwa-muted">
              <a className="text-white transition-colors" href="/">Stories</a>
              <a className="hover:text-white transition-colors" href="/archive">Archive</a>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 rounded bg-white/3 text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-tuwa-accent" 
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18"></path>
              </svg>
            </button>

            {/* Mobile Dropdown */}
            {isMobileMenuOpen && (
              <div className="fixed inset-x-4 top-20 z-40 rounded-lg bg-[rgba(10,10,11,0.95)] border border-white/5 p-4 shadow-lg md:hidden block" role="menu">
                <a role="menuitem" href="/" className="block px-3 py-2 rounded text-white hover:bg-white/5">Stories</a>
                <a role="menuitem" href="/archive" className="block px-3 py-2 rounded text-tuwa-muted hover:text-white hover:bg-white/5">Archive</a>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main" role="main" className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        
        {/* Header Text */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-4">Latest Stories</h1>
          <p className="text-xl text-tuwa-muted">Insights, deep dives, and perspectives from the OpenTuwa network.</p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {loading && <div className="col-span-full py-20 text-center text-tuwa-muted animate-pulse">Loading stories...</div>}
          
          {error && <div className="col-span-full py-20 text-center text-red-500">Failed to load stories: {error}</div>}
          
          {!loading && !error && articles.length === 0 && (
            <div className="col-span-full py-20 text-center text-tuwa-muted">No stories found.</div>
          )}

          {!loading && !error && articles.map((article, index) => (
            <a key={index} href={`/articles/${article.slug}`} className="group block card-hover relative">
              <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative bg-tuwa-gray border border-white/5">
                <img 
                  src={article.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'} 
                  alt={article.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out" 
                  loading="lazy" 
                />
              </div>
              <h2 className="text-2xl font-bold font-heading text-white mb-2 group-hover:text-tuwa-accent transition-colors leading-tight">
                {article.title}
              </h2>
              <p className="text-tuwa-muted text-sm line-clamp-2 mb-4">
                {article.subtitle || article.seo_description}
              </p>
              <div className="flex items-center text-xs text-tuwa-muted font-medium">
                <span className="hover:text-white transition-all">{article.author || 'Tuwa Media'}</span>
                <span className="px-2">•</span>
                <span>{article.read_time_minutes || 5} min read</span>
              </div>
            </a>
          ))}

        </div>
      </main>
    </div>
  );
}