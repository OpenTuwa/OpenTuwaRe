import { getRequestContext } from '@cloudflare/next-on-pages';
import ArticleCard from '../../components/ArticleCard';
import { fetchCandidates, RecommendationEngine } from '../../utils/algorithm';
import { BreadcrumbSchema } from '../../components/StructuredData';

export const runtime = 'edge';

export const metadata = {
  title: 'OpenTuwa | Independent Journalism & Documentaries',
  description: 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.',
  keywords: 'news, journalism, documentaries, independent media, deep dive, analysis, OpenTuwa',
  alternates: { canonical: 'https://opentuwa.com' }, // SEO: Req 13.1, 13.6 — canonical URL, no trailing slash
  robots: { index: true, follow: true },
  openGraph: {
    title: 'OpenTuwa | Independent Journalism & Documentaries',
    description: 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.',
    type: 'website',
    url: 'https://opentuwa.com',
    images: [{ url: 'https://opentuwa.com/assets/ui/web_512.png', width: 512, height: 512, alt: 'OpenTuwa - Independent Journalism' }],
    siteName: 'OpenTuwa',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenTuwa | Independent Journalism & Documentaries',
    description: 'Independent news and journalism covering stories that matter.',
    images: ['https://opentuwa.com/assets/ui/web_512.png'],
    site: '@opentuwa',
  },
};

export default async function HomePage({ searchParams }) {
  const { q, author, tag } = await searchParams;
  let articles = [];

  try {
    const { env } = getRequestContext();
    const rawResults = await fetchCandidates(env, 100, q, author, tag);
    const engine = new RecommendationEngine(rawResults);
    articles = engine.getTrending(100);
  } catch (err) {
    console.error('[HomePage] Error fetching articles:', err.message, err.stack);
  }

  return (
    <>
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
