import { isBot } from './_utils/bot-detector.js';
import { buildHomepageGraph } from './_utils/schema.js';

const SITE_NAME = 'OpenTuwa';
const SITE_URL = 'https://opentuwa.com';
const SITE_DESC = 'Discover stories, documentaries, and articles on OpenTuwa. Substantive journalism and rigorous intellectual inquiry.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_512.png';
const FEED_URL = 'https://opentuwa.com/feed.xml';

export async function onRequestGet(context) {
  const { request, env } = context;

  // Real users get the Next.js SPA
  if (!isBot(request)) {
    return context.next();
  }

  const url = new URL(request.url);
  const author = url.searchParams.get('author');
  const tag = url.searchParams.get('tag');
  const q = url.searchParams.get('q');

  let articles = [];
  let pageTitle = `${SITE_NAME} | Independent Journalism & Documentaries`;
  let pageDesc = SITE_DESC;
  let innerHtml = '';
  // author/tag/search variants are thin-content — noindex to avoid diluting crawl budget
  const isVariant = !!(author || tag || q);
  const robotsContent = isVariant
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1';

  try {
    if (author && author.trim() !== '') {
      let a = null;
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM authors WHERE LOWER(name) = LOWER(?)'
        ).bind(author).all();
        a = (results && results[0]) || null;
      } catch (e) {}
      const name = a?.name || author;
      pageTitle = `${name} | ${SITE_NAME} Author`;
      pageDesc = a?.bio || `Read articles and stories by ${name} on ${SITE_NAME}.`;
      const { results } = await env.DB.prepare(
        'SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20'
      ).bind(name).all();
      articles = results || [];
      innerHtml = `<h1>${esc(name)}</h1><p class="lead">${esc(pageDesc)}</p><hr/><h2>Latest Stories</h2>${renderList(articles)}`;
    } else if (tag && tag.trim() !== '') {
      pageTitle = `${tag} — Topic | ${SITE_NAME}`;
      pageDesc = `Latest stories, documentaries and articles about ${tag} on ${SITE_NAME}.`;
      const { results } = await env.DB.prepare(
        'SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20'
      ).bind(`%${tag}%`).all();
      articles = results || [];
      innerHtml = `<h1>Topic: ${esc(tag)}</h1><p class="lead">${esc(pageDesc)}</p><hr/>${renderList(articles)}`;
    } else {
      const { results } = await env.DB.prepare(
        'SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20'
      ).all();
      articles = results || [];
      innerHtml = `<h1>Latest Stories</h1><p class="lead">${esc(pageDesc)}</p><hr/>${renderList(articles)}`;
    }
  } catch (err) {
    return context.next();
  }

  // Canonical: only the bare homepage is canonical; variants get their own URL but are noindex
  const canonicalUrl = author
    ? `https://opentuwa.com/?author=${encodeURIComponent(author)}`
    : tag
      ? `https://opentuwa.com/?tag=${encodeURIComponent(tag)}`
      : 'https://opentuwa.com';

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}">
  <meta name="robots" content="${robotsContent}">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <link rel="alternate" type="application/rss+xml" title="${SITE_NAME} RSS Feed" href="${FEED_URL}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(pageDesc)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@opentuwa">
  <meta name="twitter:title" content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(pageDesc)}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': buildHomepageGraph(SITE_URL) })}</script>
  <style>
    :root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#c4c4c4;--accent:#3b82f6}
    *{box-sizing:border-box}
    body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.6;margin:0;padding:2rem}
    main{max-width:800px;margin:0 auto}
    h1{color:#fff;font-size:2.5rem;margin-bottom:1rem}
    h2{color:#fff;margin-top:2rem}
    .lead{font-size:1.25rem;color:var(--muted);margin-bottom:2rem}
    article{margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid #222}
    article h3{margin:0 0 .5rem;font-size:1.5rem}
    article a{color:#fff;text-decoration:none}
    article a:hover{color:var(--accent)}
    .meta{font-size:.875rem;color:var(--muted)}
    hr{border:0;border-top:1px solid #222;margin:2rem 0}
    nav a{color:#fff;font-weight:700;text-decoration:none;font-size:1.5rem}
    footer{margin-top:4rem;font-size:.8rem;color:var(--muted)}
    footer a{color:var(--muted)}
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site navigation">
      <a href="/" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
      &nbsp;&nbsp;
      <a href="/archive" style="font-size:1rem;font-weight:400;color:var(--muted)">Archive</a>
      &nbsp;&nbsp;
      <a href="/about" style="font-size:1rem;font-weight:400;color:var(--muted)">About</a>
    </nav>
    ${innerHtml}
    <footer>
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
        <a href="/legal">Legal</a> |
        <a href="/about">About</a> |
        <a href="/archive">Archive</a> |
        <a href="/feed.xml">RSS Feed</a>
      </p>
    </footer>
  </main>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

function renderList(articles) {
  if (!articles || articles.length === 0) return '<p>No stories found.</p>';
  return articles.map(a => `
    <article>
      <h3><a href="/articles/${esc(a.slug)}">${esc(a.title)}</a></h3>
      ${a.subtitle ? `<p>${esc(a.subtitle)}</p>` : ''}
      <div class="meta">${a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
    </article>`
  ).join('');
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
