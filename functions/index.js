import { isBot } from './_utils/bot-detector.js';
import { buildHomepageGraph } from './_utils/schema.js';
import { buildHreflangTags } from './_utils/hreflang.js';
import { buildHead } from './_utils/head.js';

const SITE_NAME = 'OpenTuwa';
const SITE_URL = 'https://opentuwa.com';
const SITE_DESC = 'Discover stories, documentaries, and articles on OpenTuwa. Substantive journalism and rigorous intellectual inquiry.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_1200.png';
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
  ${buildHead({
    title: esc(pageTitle),
    desc: esc(pageDesc),
    canonical: esc(canonicalUrl),
    robots: robotsContent,
    hreflang: buildHreflangTags('/'),
    ogType: 'website',
    ogImage: OG_IMAGE,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    twitterCard: 'summary_large_image',
    jsonLd: JSON.stringify({ '@context': 'https://schema.org', '@graph': buildHomepageGraph(SITE_URL) }),
    cssVariant: 'list',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
    <a href="/archive" class="secondary">Archive</a>
    <a href="/about" class="secondary">About</a>
  </nav>
  <div class="list-wrap">
    ${innerHtml}
    <footer>
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
        <a href="/legal">Legal</a> |
        <a href="/about">About</a> |
        <a href="/archive">Archive</a> |
        <a href="/feed.xml">RSS Feed</a>
      </p>
    </footer>
  </div>
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
