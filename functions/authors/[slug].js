import { isBot } from '../_utils/bot-detector.js';
import { buildAuthorGraph } from '../_utils/schema.js';
import { buildHreflangTags } from '../_utils/hreflang.js';
import { buildHead } from '../_utils/head.js';
import { SITE_NAME, SITE_URL } from '../_utils/constants.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  if (!isBot(request)) {
    return context.next();
  }

  // authors table has no slug column — scan all and match by name-derived slug
  function nameToSlug(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  let author = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT name, role, bio, author_bio, avatar_url, author_image,
              author_twitter, author_linkedin, author_facebook, author_youtube, author_signal
       FROM authors LIMIT 200`
    ).all();
    const match = results?.find(a => nameToSlug(a.name) === slug) || null;
    if (!match) return context.next();
    // Normalise: prefer author_image, fall back to avatar_url
    match._image = match.author_image || match.avatar_url || null;
    // Normalise bio: prefer author_bio, fall back to bio
    match._bio = match.author_bio || match.bio || null;
    author = match;
  } catch (e) {
    return context.next();
  }

  if (!author) return context.next();

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, published_at FROM articles
       WHERE author = ? OR author_name = ? ORDER BY published_at DESC LIMIT 10`
    ).bind(author.name, author.name).all();
    articles = results || [];
  } catch (_) {}

  const authorName = author.name || slug;
  const canonicalUrl = `${SITE_URL}/authors/${slug}`;
  const pageTitle = `${authorName} — ${SITE_NAME}`;
  const pageDesc = author._bio || `Articles by ${authorName} on ${SITE_NAME}.`;
  const ogImage = author._image || `${SITE_URL}/assets/ui/web_1200.png`;
  // Don't declare dimensions for user-supplied author images — aspect ratio is unknown.
  const ogImgWidth = author._image ? '' : '1200';
  const ogImgHeight = author._image ? '' : '630';
  const twitterCardType = author._image ? 'summary' : 'summary_large_image';

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
    twitterCard: twitterCardType,
    jsonLd,
    cssVariant: 'author',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
  </nav>
  <div class="author-wrap">
    ${author._image ? `<img src="${esc(author._image)}" alt="${esc(authorName)}" class="avatar">` : ''}
    <h1>${esc(authorName)}</h1>
    ${author._bio ? `<p class="bio">${esc(author._bio)}</p>` : ''}
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
