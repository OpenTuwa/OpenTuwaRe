import { getRequestContext } from '@cloudflare/next-on-pages';
import { fetchCandidates, RecommendationEngine } from '../../utils/algorithm';
import GraphSchema from '../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../functions/_utils/hreflang.js';
import BreakingNewsTicker from '../../components/BreakingNewsTicker';
import HeroStory from '../../components/HeroStory';
import SectionGrid from '../../components/SectionGrid';
import TrendingRail from '../../components/TrendingRail';
import { groupBySection } from '../../utils/sections';

export const runtime = 'edge';

const BASE_TITLE = 'OpenTuwa | Independent Journalism & Documentaries';
const BASE_DESC = 'Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.';
const CANONICAL_HOME = 'https://opentuwa.com';

export async function generateMetadata({ searchParams }) {
  const { author, tag, q } = await searchParams;
  const isVariant = !!(author || tag || q);

  // Build variant canonical URL when filter params are present
  const variantUrl = isVariant
    ? author
      ? `${CANONICAL_HOME}/?author=${encodeURIComponent(author)}`
      : tag
        ? `${CANONICAL_HOME}/?tag=${encodeURIComponent(tag)}`
        : `${CANONICAL_HOME}/?q=${encodeURIComponent(q)}`
    : null;

  const canonicalUrl = variantUrl ?? CANONICAL_HOME;

  const languages = buildHreflangLanguages(CANONICAL_HOME);

  return {
    title: BASE_TITLE,
    description: BASE_DESC,
    keywords: 'news, journalism, documentaries, independent media, deep dive, analysis, OpenTuwa',
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    // SEO: Req 1.5, 1.6 — noindex variant pages (?author, ?tag, ?q); canonical always set
    robots: isVariant
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title: BASE_TITLE,
      description: BASE_DESC,
      type: 'website',
      url: canonicalUrl,
      images: [
        { url: 'https://opentuwa.com/assets/ui/web_1200.png', width: 1200, height: 630, alt: 'OpenTuwa - Independent Journalism' }
      ],
      siteName: 'OpenTuwa',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: BASE_TITLE,
      description: 'Independent news and journalism covering stories that matter.',
      images: ['https://opentuwa.com/assets/ui/web_1200.png'],
      site: '@opentuwa',
    },
    authors: [{ name: 'OpenTuwa' }],
    creator: 'OpenTuwa',
    publisher: 'OpenTuwa',
    formatDetection: { telephone: false },
  };
}

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

  // Derive ticker: 5 most recently published
  const tickerArticles = [...articles]
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 5);

  // Hero: top trending article
  const heroArticle = articles[0] ?? null;

  // Section grids: remaining articles grouped by section/category
  const sections = groupBySection(articles.slice(1));

  // Trending rail: top 5 by trending score (already sorted)
  const trendingArticles = articles.slice(0, 5);

  // Section labels for Navbar
  const sectionLabels = [...new Set(sections.map(s => s.label))].slice(0, 5);

  return (
    <>
      <GraphSchema type="homepage" />
      <BreakingNewsTicker articles={tickerArticles} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-24 min-h-screen">
        <HeroStory article={heroArticle} />

        {articles.length === 0 && (
          <div className="text-center text-tuwa-muted py-20">No stories found.</div>
        )}

        {articles.length > 0 && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content: section grids */}
            <div className="lg:col-span-3">
              <SectionGrid sections={sections} />
            </div>
            {/* Sidebar: trending rail */}
            <div className="lg:col-span-1">
              <TrendingRail articles={trendingArticles} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
