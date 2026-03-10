import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ArticleCard from '../components/ArticleCard';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonImage from '../components/SkeletonImage';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [authorData, setAuthorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const authorParam = searchParams.get('author');
  const tagParam = searchParams.get('tag');
  const queryParam = searchParams.get('q');

  // Prepare SEO Data
  const siteUrl = 'https://opentuwa.com'; // In prod, use window.location.origin or env var
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;

  let title = 'OpenTuwa | Independent Journalism & Documentaries';
  let description = 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.';
  let schema = [];

  // 1. Global Organization Schema (Always present on home/root)
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'OpenTuwa',
    'url': siteUrl,
    'logo': {
      '@type': 'ImageObject',
      'url': `${siteUrl}/img/logo.png`,
      'width': 600,
      'height': 60
    },
    'sameAs': [
      'https://twitter.com/OpenTuwa',
      'https://www.facebook.com/OpenTuwa',
      'https://www.instagram.com/OpenTuwa',
      'https://www.youtube.com/@OpenTuwa'
    ]
  };

  if (authorParam && authorData) {
    title = `${authorData.name} - Author Profile | OpenTuwa`;
    description = authorData.bio || `Read articles and stories by ${authorData.name} on OpenTuwa.`;
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      'mainEntity': {
        '@type': 'Person',
        'name': authorData.name,
        'description': authorData.bio,
        'image': authorData.avatar_url || authorData.avatar,
        'url': currentUrl,
        'sameAs': authorData.social_link ? [authorData.social_link] : []
      }
    });
  } else if (tagParam) {
    title = `${tagParam} - Topic | OpenTuwa`;
    description = `Latest stories, documentaries and articles about ${tagParam}.`;
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': `Stories about ${tagParam}`,
      'description': description,
      'url': currentUrl
    });
  } else if (queryParam) {
    title = `Search results for "${queryParam}" | OpenTuwa`;
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      'name': title,
      'url': currentUrl
    });
  } else {
    // Default Home
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'OpenTuwa',
      'url': siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
    schema.push(orgSchema);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resArticles = await fetch('/api/article');
        let data = await resArticles.json();

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

        if (authorParam) data = data.filter(a => a.author === authorParam);
        if (tagParam) data = data.filter(a => a.tags && a.tags.toLowerCase().includes(tagParam.toLowerCase()));
        if (queryParam) {
          const q = queryParam.toLowerCase();
          data = data.filter(a => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q)));
        }

        setArticles(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [authorParam, tagParam, queryParam]);

  return (
    <main id="main" className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={currentUrl} />
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(s)}
          </script>
        ))}
      </Helmet>

      {/* Author Profile Header */}
      {authorParam && authorData && (
        <div className="mb-20 text-center max-w-2xl mx-auto animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-tuwa-accent blur-xl opacity-20 rounded-full"></div>
            <SkeletonImage
              src={authorData.avatar_url || '/img/default-avatar.png'}
              alt={authorData.name}
              className="relative w-32 h-32 rounded-full object-cover border-2 border-white/10 shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-white mb-3 flex items-center justify-center gap-2">
            {authorData.name}
            {(authorData.role === 'Founder and Editor-in-Chief' || authorData.role === 'Developer') && (
              <svg className="w-6 h-6 flex-shrink-0 text-[#1D9BF0]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  {/* The circle inherits the blue text color from the parent SVG */}
  <circle cx="12" cy="12" r="12" fill="currentColor" />
  
  {/* The path explicitly forces a white stroke and no fill */}
  <path d="M9.5 12.5L11 14L15 10" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
</svg>
            )}
          </h1>
          <div className="text-tuwa-accent font-bold tracking-widest uppercase text-xs mb-4">{authorData.role || 'Contributor'}</div>
          <p className="text-lg text-tuwa-muted mb-6 leading-relaxed">{authorData.bio}</p>
          {authorData.social_link && (
            <div className="flex justify-center gap-4">
              <a href={authorData.social_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span className="text-sm font-medium">Follow on X</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Default Header */}
      {!authorData && (
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-white mb-4">
            {tagParam ? `Topic: ${tagParam}` : queryParam ? `Search: ${queryParam}` : 'Latest Stories'}
          </h1>
          <p className="text-xl text-tuwa-muted">Insights and perspectives from the network.</p>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <SkeletonCard count={6} />
        ) : articles.length > 0 ? (
          articles.map((article, index) => (
            <ArticleCard key={article.slug || index} article={article} index={index} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-tuwa-muted">No stories found matching your criteria.</div>
        )}
      </div>
    </main>
  );
}
