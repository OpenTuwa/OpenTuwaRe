import { isBot } from '../_utils/bot-detector.js';

async function handleBotRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, content_html, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    console.error('Article DB Query failed:', e);
    // Return 503 Service Unavailable for bots if DB fails, so they retry later
    return new Response("<h1>Service Unavailable</h1><p>Our systems are currently under heavy load. Please try again later.</p>", {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'Retry-After': '60' }
    });
  }

  // If article not found, return 404 explicitly for bots (don't fallback to SPA)
  if (!article) {
    return new Response("<h1>404 - Article Not Found</h1><p>The article you are looking for does not exist.</p>", {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }

  const origin = new URL(request.url).origin;
  const url = `${origin}/articles/${slug}`;
  const title = article.title || 'Article';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  const pubDate = article.published_at || '';
  // Ensure content_html is a string
  const content = typeof article.content_html === 'string' ? article.content_html : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: desc,
    image: image ? [image] : [],
    datePublished: pubDate,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'OpenTuwa',
      logo: { '@type': 'ImageObject', url: `${origin}/img/logo.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} | OpenTuwa</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
  ${pubDate ? `<meta property="article:published_time" content="${esc(pubDate)}">` : ''}
  <meta property="article:author" content="${esc(author)}">
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
  <link rel="canonical" href="${esc(url)}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <article style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
    <h1>${esc(title)}</h1>
    <p><strong>${esc(author)}</strong>${pubDate ? ` · ${new Date(pubDate).toDateString()}` : ''}</p>
    <p>${esc(desc)}</p>
    <hr>
    ${content ? `<div>${content}</div>` : '<p><em>Content is currently unavailable.</em></p>'}
  </article>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

export async function onRequest(context) {
  const { request } = context;
  // 1. Check if it's a bot using the new utility
  if (isBot(request)) {
    return handleBotRequest(context);
  }
  // 2. If not a bot, let the request fall through to the SPA (Static Assets)
  return context.next();
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
