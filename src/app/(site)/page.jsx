import { getRequestContext } from '@cloudflare/next-on-pages';
import ArticleCard from '../../components/ArticleCard';
import { fetchCandidates, RecommendationEngine } from '../../../utils/algorithm';
import { HomeSEOHead, OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '../../../components/StructuredData';

export const runtime = 'edge';

export const metadata = {
  title: 'OpenTuwa | Independent Journalism & Documentaries',
  description: 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.',
};

export default async function HomePage({ searchParams }) {
  const { q, author, tag } = await searchParams;
  let articles = [];

  try {
    const { env } = getRequestContext();

    console.log('[HomePage] Fetching articles with params:', { q, author, tag });

    // Pass author and tag to fetchCandidates
    const rawResults = await fetchCandidates(env, 100, q, author, tag);
    console.log('[HomePage] Raw results count:', rawResults?.length || 0);

    const engine = new RecommendationEngine(rawResults);
    articles = engine.getTrending(100);
    console.log('[HomePage] Trending articles count:', articles?.length || 0);

  } catch (err) {
    console.error('[HomePage] Error fetching articles:', err.message, err.stack);
  }

  return (
    <>
      <HomeSEOHead />
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema isArticle={false} />
      <main className="max-w-7xl mx-auto px-6 py-24 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <ArticleCard key={article.slug} article={article} index={i} />
          ))}
        </div>
        {articles.length === 0 && (
          <div className="text-center text-tuwa-muted py-20">
            No stories found.
          </div>
        )}
      </main>
    </>
  );
}
