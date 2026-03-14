import { isBot } from '../_utils/bot-detector.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  if (!isBot(request)) {
    return context.next();
  }

  const origin = new URL(request.url).origin;

  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT title, seo_description, subtitle, excerpt, image_url,
              author, author_name, published_at, updated_at, content_html, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    return context.next();
  }

  if (!article) return context.next();

  const title = article.title || 'Article';
  const desc = article.seo_description || article.subtitle || article.excerpt || title;
  const rawImage = article.image_url || '';
  const image = rawImage ? (rawImage.startsWith('/') ? `${origin}${rawImage}` : rawImage) : '';
  const author = article.author || article.author_name || 'OpenTuwa';
  const pubDate = article.published_at || '';
  const updatedAt = article.updated_at && article.updated_at >= pubDate ? article.updated_at : pubDate;
  const content = article.content_html || `<p>${esc(desc)}</p>`;
  const canonicalUrl = `https://opentuwa.com/articles/${slug}`;
  const twitterCreator = article.author ? `@${article.author}` : '@opentuwa';

  // Parse tags
  let tagsArray = [];
  if (article.tags) {
    try { tagsArray = JSON.parse(article.tags); } catch { tagsArray = String(article.tags).split(',').map(t => t.trim()).filter(Boolean); }
  }
  const keywords = tagsArray.join(', ');

  // Image dimensions
  const imgWidth = image ? '1200' : '512';
  const imgHeight = image ? '630' : '512';
  const ogImage = image || `${origin}/assets/ui/web_512.png`;

  // JSON-LD NewsArticle
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: desc,
    datePublished: pubDate,
    dateModified: updatedAt,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'OpenTuwa',
      logo: { '@type': 'ImageObject', url: 'https://opentuwa.com/assets/ui/web_512.png' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    image: ogImage,
    ...(keywords ? { keywords } : {})
  };

  // Related articles
  let relatedHtml = '';
  try {
    const { results: related } = await env.DB.prepare(
      `SELECT slug, title FROM articles WHERE slug != ? ORDER BY published_at DESC LIMIT 3`
    ).bind(slug).all();
    if (related && related.length > 0) {
      const links = related.map(r => `    <li><a href="/articles/${esc(r.slug)}">${esc(r.title)}</a></li>`).join('\n');
      relatedHtml = `\n  <section>\n    <h2>Related Articles</h2>\n    <ul>\n${links}\n    </ul>\n  </section>`;
    }
  } catch (_) { /* gracefully skip if query fails */ }

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(title)} | OpenTuwa</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="${imgWidth}">
  <meta property="og:image:height" content="${imgHeight}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <meta name="twitter:site" content="@opentuwa">
  <meta name="twitter:creator" content="${esc(twitterCreator)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; line-height: 1.8; margin: 0; padding: 2rem; }
    article { max-width: 700px; margin: 0 auto; }
    h1 { color: #fff; font-size: 2.5rem; line-height: 1.2; margin-bottom: 0.5rem; }
    .meta { color: var(--muted); margin-bottom: 2rem; border-bottom: 1px solid #222; padding-bottom: 1rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }
    p { margin-bottom: 1.5rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <!-- SEO: Req 14.3, 14.4 — article element with h1; Req 14.4 — nav with homepage link; Req 14.5 — html lang="en" on root element -->
  <article>
    <nav><a href="/" style="color:#fff; font-weight:bold; text-decoration:none;">OpenTuwa</a></nav>
    <h1>${esc(title)}</h1>
    <div class="meta">By <strong>${esc(author)}</strong> &bull; ${pubDate ? new Date(pubDate).toDateString() : ''}</div>
    ${rawImage ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
    <div>${content}</div>
  </article>${relatedHtml}
</body>
</html>`;

  return new Response(botHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
