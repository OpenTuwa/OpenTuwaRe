import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useScrollReveal from '../hooks/useScrollReveal';

function ArchiveYearSection({ yearGroup }) {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="reveal relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-tuwa-accent border-2 border-[#0a0a0b]" />

      <h2 className="text-3xl font-bold font-heading text-white mb-8 border-b border-white/5 pb-4">
        {yearGroup.year}
      </h2>
      <div className="space-y-6">
        {yearGroup.articles.map((article, index) => {
          const date = article.published_at 
            ? new Date(article.published_at) 
            : new Date();
          const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          // Strict null check for tags
          const tag = article.tags && typeof article.tags === 'string' 
            ? article.tags.split(',')[0].trim() 
            : 'Article';

          return (
            <a
              key={index}
              href={`/articles/${article.slug}`}
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
  );
}

export default function Archive() {
  const [archiveData, setArchiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SEO
  const siteUrl = 'https://opentuwa.com';
  const title = 'Archive | OpenTuwa';
  const description = 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'OpenTuwa Archive',
    'description': description,
    'url': `${siteUrl}/archive`
  };

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchArchive = async () => {
      try {
        const response = await fetch('/api/article', { signal });
        if (!response.ok) throw new Error('Failed to fetch archive');
        
        const articles = await response.json();

        // Strict array check
        if (!Array.isArray(articles) || articles.length === 0) {
          if (!signal.aborted) {
            setArchiveData([]);
            setLoading(false);
          }
          return;
        }

        const grouped = articles.reduce((acc, article) => {
          const date = article.published_at 
            ? new Date(article.published_at) 
            : new Date();
          const year = date.getFullYear();
          if (!acc[year]) acc[year] = [];
          acc[year].push(article);
          return acc;
        }, {});

        const sortedArchive = Object.keys(grouped)
          .sort((a, b) => b - a)
          .map(year => ({ year, articles: grouped[year] }));

        if (!signal.aborted) {
          setArchiveData(sortedArchive);
          setLoading(false);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          if (!signal.aborted) {
            setError(err.message);
            setLoading(false);
          }
        }
      }
    };

    fetchArchive();

    return () => abortController.abort();
  }, []);

  return (
    <main id="main" className="pt-32 pb-20 px-6 max-w-3xl mx-auto flex-grow w-full">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/archive`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={`${siteUrl}/archive`} />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      <div className="mb-16 border-b border-white/10 pb-10">
        <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-4">The Archive</h1>
        <p className="text-xl text-tuwa-muted">A complete timeline of everything we've published.</p>
      </div>

      {/* Timeline container with vertical line */}
      <div className="relative space-y-16">
        {/* Vertical timeline line */}
        {!loading && archiveData.length > 0 && (
          <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-white/5" />
        )}

        {loading && <div className="py-10 text-center text-tuwa-muted animate-pulse">Scanning archives...</div>}
        {error && <div className="text-red-500 py-10">Failed to load archive: {error}</div>}
        {!loading && !error && archiveData.length === 0 && (
          <div className="text-tuwa-muted">The archive is currently empty.</div>
        )}

        {!loading && !error && archiveData.map((yearGroup) => (
          <ArchiveYearSection key={yearGroup.year} yearGroup={yearGroup} />
        ))}
      </div>
    </main>
  );
}
