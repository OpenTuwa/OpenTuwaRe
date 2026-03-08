import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [articles, setArticles] = useState([]);
  const [authorData, setAuthorData] = useState(null); // State for author profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Grab parameters from URL (?author=..., ?tag=..., ?q=...)
  const [searchParams] = useSearchParams();
  const authorParam = searchParams.get('author');
  const tagParam = searchParams.get('tag');
  const queryParam = searchParams.get('q');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Articles
        const resArticles = await fetch('/api/article');
        let data = await resArticles.json();

        // 2. Fetch Author Profile if authorParam exists
        if (authorParam) {
          try {
            const resAuthor = await fetch(`/api/authors_1?name=${encodeURIComponent(authorParam)}`);
            if (resAuthor.ok) {
              const auth = await resAuthor.json();
              setAuthorData(auth);
            }
          } catch (e) { console.error("Author fetch failed", e); }
        } else {
          setAuthorData(null);
        }

        // 3. APPLY FILTERS
        if (authorParam) {
          data = data.filter(a => a.author === authorParam);
        }
        if (tagParam) {
          data = data.filter(a => a.tags && a.tags.toLowerCase().includes(tagParam.toLowerCase()));
        }
        if (queryParam) {
          const q = queryParam.toLowerCase();
          data = data.filter(a => 
            a.title.toLowerCase().includes(q) || 
            (a.subtitle && a.subtitle.toLowerCase().includes(q))
          );
        }

        setArticles(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [authorParam, tagParam, queryParam]); // Re-run when URL changes

  return (
    <div className="tuwa-upgrade bg-[#0a0a0b] min-h-screen text-white">
      {/* Navigation (Simplified for brevity - keep your existing nav code here) */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/80 border-b border-white/5 h-20 flex items-center px-6">
        <a href="/" className="text-2xl font-extrabold tracking-tighter font-heading text-white">Tuwa</a>
      </header>

      <main id="main" className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* AUTHOR PROFILE HEADER (Shows only if ?author= is in URL) */}
        {authorParam && authorData && (
          <div className="mb-20 text-center max-w-2xl mx-auto animate-fade-in">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-tuwa-accent blur-xl opacity-20 rounded-full"></div>
              <img 
                src={authorData.avatar_url || '/img/default-avatar.png'} 
                alt={authorData.name} 
                className="relative w-32 h-32 rounded-full object-cover border-2 border-white/10 shadow-2xl"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-white mb-3">{authorData.name}</h1>
            <div className="text-tuwa-accent font-bold tracking-widest uppercase text-xs mb-4">{authorData.role || 'Contributor'}</div>
            <p className="text-lg text-tuwa-muted mb-6 leading-relaxed">{authorData.bio}</p>
{/* NEW: Social Links Section */}
    {authorData.social_link && (
      <div className="flex justify-center gap-4">
        <a 
          href={authorData.social_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
        >
          {/* X (formerly Twitter) Icon */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-sm font-medium">Follow on X</span>
        </a>
      </div>
    )}
          </div>
        )}

        {/* DEFAULT HEADER (Shows if no author profile) */}
        {!authorData && (
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-4">
              {tagParam ? `Topic: ${tagParam}` : queryParam ? `Search: ${queryParam}` : 'Latest Stories'}
            </h1>
            <p className="text-xl text-tuwa-muted">Insights and perspectives from the network.</p>
          </div>
        )}

        {/* ARTICLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full py-20 text-center text-tuwa-muted animate-pulse">Loading...</div>
          ) : articles.length > 0 ? (
            articles.map((article, index) => (
              <a key={index} href={`/articles/${article.slug}`} className="group block">
                <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative bg-tuwa-gray border border-white/5">
                  <img 
                    src={article.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                </div>
                <h2 className="text-2xl font-bold font-heading mb-2 group-hover:text-tuwa-accent transition-colors leading-tight">
                  {article.title}
                </h2>
                <p className="text-tuwa-muted text-sm line-clamp-2">{article.subtitle}</p>
              </a>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-tuwa-muted">No stories found matching your criteria.</div>
          )}
        </div>
      </main>
    </div>
  );
}