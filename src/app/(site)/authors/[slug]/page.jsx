import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GraphSchema from '../../../../components/GraphSchema';
import { buildHreflangLanguages } from '../../../../../functions/_utils/hreflang.js';

export const runtime = 'edge';

const SITE_URL = 'https://opentuwa.com';

// Authors table has no slug column — derive slug from name
function nameToSlug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function getAuthorData(slug, env) {
  try {
    // authors table has no slug column — scan all and match by name-derived slug
    const { results } = await env.DB.prepare(
      `SELECT name, role, bio, author_bio, avatar_url, author_image,
              author_twitter, author_linkedin, author_facebook, author_youtube
       FROM authors LIMIT 200`
    ).all();
    const match = results?.find(a => nameToSlug(a.name) === slug) || null;
    if (!match) return null;
    // Normalise: prefer author_image, fall back to avatar_url
    match._image = match.author_image || match.avatar_url || null;
    // Normalise bio: prefer author_bio, fall back to bio
    match._bio = match.author_bio || match.bio || null;
    return match;
  } catch (e) {
    return null;
  }
}

async function getAuthorArticles(authorName, env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, published_at, seo_description, subtitle, image_url, section, category
       FROM articles WHERE author = ? OR author_name = ?
       ORDER BY published_at DESC LIMIT 30`
    ).bind(authorName, authorName).all();
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
  const pageDesc = author._bio || `Articles by ${author.name} on OpenTuwa.`;
  const ogImage = author._image || `${SITE_URL}/assets/ui/web_1200.png`;

  const languages = buildHreflangLanguages(authorUrl);

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: { canonical: authorUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      type: 'profile',
      url: authorUrl,
      images: [{ url: ogImage, alt: author.name }],
      siteName: 'OpenTuwa',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
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
  const initials = author.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <GraphSchema type="author" data={{ author, slug }} />
      <main className="min-h-screen pt-28 pb-24">

        {/* Author header */}
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="flex items-start gap-6">
            {author._image ? (
              <img
                src={author._image}
                alt={author.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-tuwa-accent flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-1">{author.name}</h1>
              {author.role && (
                <p className="text-tuwa-accent text-sm font-medium mb-3">{author.role}</p>
              )}
              {author._bio && (
                <p className="text-tuwa-muted text-sm leading-relaxed max-w-2xl">{author._bio}</p>
              )}

              {/* Social links */}
              {(author.author_twitter || author.author_linkedin || author.author_facebook || author.author_youtube) && (
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium">
                  {author.author_twitter && (
                    <a
                      href={`https://twitter.com/${author.author_twitter.replace('@', '')}`}
                      rel="noopener noreferrer"
                      className="text-tuwa-muted hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Twitter / X
                    </a>
                  )}
                  {author.author_linkedin && (
                    <a href={author.author_linkedin} rel="noopener noreferrer" className="text-tuwa-muted hover:text-white transition-colors">LinkedIn</a>
                  )}
                  {author.author_facebook && (
                    <a href={author.author_facebook} rel="noopener noreferrer" className="text-tuwa-muted hover:text-white transition-colors">Facebook</a>
                  )}
                  {author.author_youtube && (
                    <a href={author.author_youtube} rel="noopener noreferrer" className="text-tuwa-muted hover:text-white transition-colors">YouTube</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-1 h-5 bg-tuwa-accent inline-block" />
            <span className="uppercase tracking-widest font-bold text-sm text-white">
              Articles ({articles.length})
            </span>
          </div>
        </div>

        {/* Article list */}
        <div className="max-w-4xl mx-auto px-6">
          {articles.length === 0 ? (
            <p className="text-tuwa-muted">No articles found.</p>
          ) : (
            <div className="space-y-0 divide-y divide-white/5">
              {articles.map(a => {
                const date = a.published_at
                  ? new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null;
                const section = a.section || a.category || null;

                return (
                  <Link
                    key={a.slug}
                    href={`/articles/${a.slug}`}
                    className="flex items-start gap-4 py-5 group hover:bg-white/[0.02] -mx-3 px-3 rounded transition-colors"
                  >
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        alt={a.title}
                        width={80}
                        height={54}
                        className="w-20 h-14 object-cover rounded shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {section && (
                        <span className="text-tuwa-accent text-[10px] font-bold uppercase tracking-widest block mb-1">{section}</span>
                      )}
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-tuwa-accent transition-colors">
                        {a.title}
                      </p>
                      {(a.seo_description || a.subtitle) && (
                        <p className="text-tuwa-muted text-xs mt-1 line-clamp-1">{a.seo_description || a.subtitle}</p>
                      )}
                      {date && <p className="text-white/30 text-xs mt-1">{date}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
