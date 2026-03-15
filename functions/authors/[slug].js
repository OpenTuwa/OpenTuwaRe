import { isBot } from '../_utils/bot-detector.js';
import { buildAuthorGraph } from '../_utils/schema.js';
import { buildHreflangTags } from '../_utils/hreflang.js';

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
  <meta charset="utf-8">
  <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="87b34ddf-45f5-47fc-8a13-87fcb9d1aa85" type="text/javascript" async></script>
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/ui/web_512.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/ui/web_512.png">
  <link rel="apple-touch-icon" href="/assets/ui/web_512.png">
  <meta name="theme-color" content="#0a0a0b">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildHreflangTags(`/authors/${slug}`)}
  <link rel="alternate" type="application/rss+xml" title="${SITE_NAME} RSS Feed" href="${FEED_URL}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(pageDesc)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="${ogImgWidth}">
  <meta property="og:image:height" content="${ogImgHeight}">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:site" content="@opentuwa">
  <meta name="twitter:title" content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(pageDesc)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#c4c4c4;--accent:#3b82f6}
    *{box-sizing:border-box}
    body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;line-height:1.8;margin:0;padding:2rem}
    main{max-width:700px;margin:0 auto}
    h1{color:#fff;font-size:2rem;margin-bottom:.5rem}
    h2{color:#fff;font-size:1.25rem;margin-top:2rem}
    .bio{color:var(--muted);margin-bottom:1.5rem}
    .avatar{border-radius:50%;width:80px;height:80px;object-fit:cover;margin-bottom:1rem}
    ul{padding-left:1.5rem}
    li{margin-bottom:.75rem}
    .meta{font-size:.8rem;color:var(--muted);margin-left:.5rem}
    a{color:var(--accent)}
    nav a{color:#fff;font-weight:700;text-decoration:none}
    footer{max-width:700px;margin:3rem auto 0;font-size:.8rem;color:var(--muted)}
    footer a{color:var(--muted)}
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site navigation">
      <a href="/" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
    </nav>
    ${author.author_image ? `<img src="${esc(author.author_image)}" alt="${esc(authorName)}" class="avatar">` : ''}
    <h1>${esc(authorName)}</h1>
    ${author.author_bio ? `<p class="bio">${esc(author.author_bio)}</p>` : ''}
    <h2>Articles</h2>
    ${articleListHtml}
  </main>
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
