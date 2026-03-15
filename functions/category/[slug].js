import { isBot } from '../_utils/bot-detector.js';
import { buildHreflangTags } from '../_utils/hreflang.js';
import { buildHead } from '../_utils/head.js';
import { SITE_NAME, SITE_URL } from '../_utils/constants.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params?.slug;

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing category slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Real users get the Next.js SPA
  if (!isBot(request)) {
    return context.next();
  }

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, subtitle, seo_description, published_at, image_url, author
       FROM articles
       WHERE category_slug = ? OR LOWER(category) = LOWER(?)
       ORDER BY published_at DESC
       LIMIT 30`
    ).bind(slug, slug.replace(/-/g, ' ')).all();
    articles = results || [];
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (articles.length === 0) {
    return context.next(); // let Next.js render the empty state
  }

  const categoryLabel = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const canonicalUrl = `${SITE_URL}/category/${slug}`;
  const pageTitle = `${categoryLabel} | ${SITE_NAME}`;
  const pageDesc = `Browse all ${categoryLabel} articles on ${SITE_NAME}.`;

  const articleListHtml = articles.map(a => {
    const aSlug  = a?.slug;
    const aTitle = a?.title || 'Untitled';
    const aDesc  = a?.seo_description || a?.subtitle || '';
    const aPub   = a?.published_at
      ? new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    if (!aSlug) return '';
    return `
    <article>
      <h3><a href="/articles/${esc(aSlug)}">${esc(aTitle)}</a></h3>
      ${aDesc ? `<p>${esc(aDesc)}</p>` : ''}
      ${aPub  ? `<div class="meta">${aPub}</div>` : ''}
    </article>`;
  }).filter(Boolean).join('');

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  ${buildHead({
    title: esc(pageTitle),
    desc: esc(pageDesc),
    canonical: canonicalUrl,
    hreflang: buildHreflangTags(`/category/${slug}`),
    ogType: 'website',
    ogImage: `${SITE_URL}/assets/ui/web_1200.png`,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    twitterCard: 'summary_large_image',
    cssVariant: 'list',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
  </nav>
  <div class="list-wrap">
    <h1>${esc(categoryLabel)}</h1>
    ${articleListHtml || '<p>No articles found in this category.</p>'}
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
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
