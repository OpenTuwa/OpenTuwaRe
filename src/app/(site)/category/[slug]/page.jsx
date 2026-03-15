import { getRequestContext } from '@cloudflare/next-on-pages';
import GraphSchema from '../../../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../../../functions/_utils/hreflang.js';

export const runtime = 'edge';

const SITE_URL = 'https://opentuwa.com';

function toLabel(slug) {
  return String(slug || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

async function getArticlesByCategory(slug, env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, subtitle, seo_description, published_at, image_url, author
       FROM articles
       WHERE category_slug = ? OR LOWER(category) = LOWER(?)
       ORDER BY published_at DESC
       LIMIT 30`
    ).bind(slug, slug.replace(/-/g, ' ')).all();
    return results || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || 'news';
  const label = toLabel(slug);
  const canonicalUrl = `${SITE_URL}/category/${slug}`;

  return {
    title: `${label} | OpenTuwa`,
    description: `Browse all ${label} articles on OpenTuwa.`,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangLanguages(canonicalUrl),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${label} | OpenTuwa`,
      description: `Browse all ${label} articles on OpenTuwa.`,
      type: 'website',
      url: canonicalUrl,
      siteName: 'OpenTuwa',
    },
  };
}

export default async function CategoryPage({ params }) {
  const slug = params?.slug;

  if (!slug) {
    return <p className="text-tuwa-muted p-8">Invalid category.</p>;
  }

  let articles = [];
  try {
    const { env } = getRequestContext();
    articles = await getArticlesByCategory(slug, env);
  } catch {
    // fail silently — render empty state below
  }

  const categoryLabel = toLabel(slug);

  return (
    <>
      <GraphSchema type="archive" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">{categoryLabel}</h1>
        {articles.length === 0 ? (
          <p className="text-tuwa-muted">No articles found in this category.</p>
        ) : (
          <ul className="space-y-8">
            {articles.map((article) => {
              const articleSlug = article?.slug;
              const articleTitle = article?.title || 'Untitled';
              const articleDesc = article?.seo_description || article?.subtitle || null;
              const pubDate = article?.published_at
                ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : null;

              if (!articleSlug) return null;

              return (
                <li key={articleSlug} className="border-b border-white/10 pb-8">
                  <a
                    href={`/articles/${articleSlug}`}
                    className="text-xl font-semibold text-white hover:text-tuwa-accent transition-colors"
                  >
                    {articleTitle}
                  </a>
                  {articleDesc && (
                    <p className="text-tuwa-muted text-sm mt-1">{articleDesc}</p>
                  )}
                  {pubDate && (
                    <time className="text-tuwa-muted text-xs mt-1 block">{pubDate}</time>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
