import { getRequestContext } from '@cloudflare/next-on-pages';
import { fetchCandidates, RecommendationEngine } from '../../utils/algorithm';
import GraphSchema from '../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../functions/_utils/hreflang.js';
import HeroStory from '../../components/HeroStory';
import SectionGrid from '../../components/SectionGrid';
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

  // Hero: top 9 algorithm-ranked articles for auto-rotating banner
  const heroArticles = articles.slice(0, 9);

  // Section grids: all articles grouped by section/category
  const sections = groupBySection(articles);

  return (
    <>
      <GraphSchema type="homepage" />
      <HeroStory articles={heroArticles} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-24 min-h-screen">
        {articles.length === 0 && (
          <div className="text-center text-tuwa-muted py-20">No stories found.</div>
        )}

        {articles.length > 0 && (
          <SectionGrid sections={sections} />
        )}
      </div>
    </>
  );
}
