import { isBot } from '../_utils/bot-detector.js';
import { buildAuthorGraph } from '../_utils/schema.js';
import { buildHreflangTags } from '../_utils/hreflang.js';
import { buildHead } from '../_utils/head.js';

const SITE_NAME = 'OpenTuwa';
const SITE_URL = 'https://opentuwa.com';
const FEED_URL = 'https://opentuwa.com/feed.xml';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  if (!isBot(request)) {
    return context.next();
  }

  let author = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT name, author_bio, author_image, author_twitter, author_linkedin,
              author_facebook, author_youtube
       FROM authors WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    author = results?.[0] || null;
  } catch (e) {
    return context.next();
  }

  if (!author) return context.next();

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, published_at FROM articles
       WHERE author = ? ORDER BY published_at DESC LIMIT 10`
    ).bind(author.name).all();
    articles = results || [];
  } catch (_) {}

  const authorName = author.name || slug;
  const canonicalUrl = `${SITE_URL}/authors/${slug}`;
  const pageTitle = `${authorName} — ${SITE_NAME}`;
  const pageDesc = `Articles by ${authorName} on ${SITE_NAME}.`;
  const ogImage = author.author_image || `${SITE_URL}/assets/ui/web_512.png`;
  const ogImgWidth = author.author_image ? '400' : '512';
  const ogImgHeight = author.author_image ? '400' : '512';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': buildAuthorGraph(author, slug, SITE_URL),
  });

  const articleListHtml = articles.length > 0
    ? `<ul>${articles.map(a =>
        `<li><a href="/articles/${esc(a.slug)}">${esc(a.title)}</a>${a.published_at
          ? ` <span class="meta">${new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>`
          : ''}</li>`
      ).join('\n')}</ul>`
    : '<p>No articles found.</p>';

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  ${buildHead({
    title: esc(pageTitle),
    desc: esc(pageDesc),
    canonical: canonicalUrl,
    hreflang: buildHreflangTags(`/authors/${slug}`),
    ogType: 'profile',
    ogImage: esc(ogImage),
    ogImageWidth: ogImgWidth,
    ogImageHeight: ogImgHeight,
    twitterCard: 'summary',
    jsonLd,
    cssVariant: 'author',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
  </nav>
  <div class="author-wrap">
    ${author.author_image ? `<img src="${esc(author.author_image)}" alt="${esc(authorName)}" class="avatar">` : ''}
    <h1>${esc(authorName)}</h1>
    ${author.author_bio ? `<p class="bio">${esc(author.author_bio)}</p>` : ''}
    <h2>Articles</h2>
    ${articleListHtml}
  </div>
  <footer>
    <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
      <a href="/legal">Legal</a> |
      <a href="/about">About</a> |
      <a href="/archive">Archive</a>
    </p>
  </footer>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
