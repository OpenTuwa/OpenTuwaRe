import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import GraphSchema from '../../../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../../../functions/_utils/hreflang.js';

export const runtime = 'edge';

const SITE_URL = 'https://opentuwa.com';

async function getAuthorData(slug, env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT name, author_bio, author_image, author_twitter, author_linkedin,
              author_facebook, author_youtube
       FROM authors WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    return results?.[0] || null;
  } catch (e) {
    return null;
  }
}

async function getAuthorArticles(authorName, env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, published_at, seo_description, subtitle
       FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20`
    ).bind(authorName).all();
    return results || [];
  } catch (e) {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let author = null;
  try {
    const { env } = getRequestContext();
    author = await getAuthorData(slug, env);
  } catch (e) {}

  if (!author) return { title: 'Author Not Found' };

  const authorUrl = `${SITE_URL}/authors/${slug}`;
  const pageTitle = `${author.name} — OpenTuwa`;
  const pageDesc = author.author_bio || `Articles by ${author.name} on OpenTuwa.`;
  const ogImage = author.author_image || `${SITE_URL}/assets/ui/web_1200.png`;
  const imgWidth = author.author_image ? undefined : 1200;
  const imgHeight = author.author_image ? undefined : 630;

  const languages = buildHreflangLanguages(authorUrl);

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: authorUrl,
      languages,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      type: 'profile',
      url: authorUrl,
      images: [{ url: ogImage, width: imgWidth, height: imgHeight, alt: author.name }],
      siteName: 'OpenTuwa',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',      title: pageTitle,
      description: pageDesc,
      images: [ogImage],
      site: '@opentuwa',
    },
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const { env } = getRequestContext();

  const author = await getAuthorData(slug, env);
  if (!author) notFound();

  const articles = await getAuthorArticles(author.name, env);

  return (
    <>
      <GraphSchema type="author" data={{ author, slug }} />
      <main className="max-w-3xl mx-auto px-6 py-16">
        {author.author_image && (
          <img
            src={author.author_image}
            alt={author.name}
            width={80}
            height={80}
            className="rounded-full mb-4 object-cover"
          />
        )}
        <h1 className="text-3xl font-bold text-white mb-2">{author.name}</h1>
        {author.author_bio && (
          <div itemprop="description" className="text-tuwa-muted mb-6">{author.author_bio}</div>
        )}
        {(author.author_twitter || author.author_linkedin || author.author_facebook || author.author_youtube) && (
          <div className="flex gap-4 mb-6 text-sm">
            {author.author_twitter && (
              <a itemprop="sameAs" href={`https://twitter.com/${author.author_twitter.replace('@', '')}`} rel="noopener noreferrer" className="text-tuwa-accent hover:text-white transition-colors">Twitter/X</a>
            )}
            {author.author_linkedin && (
              <a itemprop="sameAs" href={author.author_linkedin} rel="noopener noreferrer" className="text-tuwa-accent hover:text-white transition-colors">LinkedIn</a>
            )}
            {author.author_facebook && (
              <a itemprop="sameAs" href={author.author_facebook} rel="noopener noreferrer" className="text-tuwa-accent hover:text-white transition-colors">Facebook</a>
            )}
            {author.author_youtube && (
              <a itemprop="sameAs" href={author.author_youtube} rel="noopener noreferrer" className="text-tuwa-accent hover:text-white transition-colors">YouTube</a>
            )}
          </div>
        )}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Articles</h2>
        {articles.length > 0 ? (
          <ul className="space-y-4">
            {articles.map(a => (
              <li key={a.slug}>
                <a href={`/articles/${a.slug}`} className="text-tuwa-accent hover:text-white transition-colors font-medium">
                  {a.title}
                </a>
                {a.published_at && (
                  <span className="text-tuwa-muted text-sm ml-2">
                    {new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
                {(a.seo_description || a.subtitle) && (
                  <p className="text-tuwa-muted text-sm mt-1">{a.seo_description || a.subtitle}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-tuwa-muted">No articles found.</p>
        )}
      </main>
    </>
  );
}
