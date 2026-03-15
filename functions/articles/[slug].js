import { isBot } from '../_utils/bot-detector.js';
import { buildArticleGraph } from '../_utils/schema.js';
import { buildHreflangTags } from '../_utils/hreflang.js';

const SITE_NAME = 'OpenTuwa';
const SITE_URL = 'https://opentuwa.com';
const LOGO_URL = 'https://opentuwa.com/assets/ui/web_512.png';
const FEED_URL = 'https://opentuwa.com/feed.xml';

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
              author, author_name, published_at, updated_at, content_html, tags, section,
              available_translations
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
  const authorDisplay = article.author || article.author_name || SITE_NAME;
  const pubDate = article.published_at || '';
  const updatedAt = article.updated_at && article.updated_at >= pubDate ? article.updated_at : pubDate;
  const content = article.content_html || `<p>${esc(desc)}</p>`;
  const canonicalUrl = `${SITE_URL}/articles/${slug}`;
  const twitterCreator = article.author ? `@${article.author}` : '@opentuwa';

  // Parse tags defensively
  let tagsArray = [];
  if (article.tags) {
    try { tagsArray = JSON.parse(article.tags); } catch {
      tagsArray = String(article.tags).split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  const keywords = tagsArray.join(', ');

  // Parse available_translations defensively
  let availableTranslations = null;
  if (article.available_translations) {
    try {
      availableTranslations = typeof article.available_translations === 'string'
        ? JSON.parse(article.available_translations)
        : article.available_translations;
    } catch (_) {
      availableTranslations = null;
    }
  }

  // OG image: use article's own image at 1200×630, fall back to logo at 512×512
  const hasImage = !!image;
  const ogImage = hasImage ? image : `${SITE_URL}/assets/ui/web_512.png`;
  const imgWidth = hasImage ? '1200' : '512';
  const imgHeight = hasImage ? '630' : '512';

  // JSON-LD @graph — built from shared schema utility for bot/React parity
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': buildArticleGraph(article, SITE_URL),
  };

  // Related articles
  let relatedHtml = '';
  try {
    const { results: related } = await env.DB.prepare(
      `SELECT slug, title, published_at FROM articles WHERE slug != ? ORDER BY published_at DESC LIMIT 3`
    ).bind(slug).all();
    if (related && related.length > 0) {
      const links = related.map(r =>
        `    <li><a href="/articles/${esc(r.slug)}">${esc(r.title)}</a></li>`
      ).join('\n');
      relatedHtml = `\n  <section aria-label="Related articles">\n    <h2>Related Articles</h2>\n    <ul>\n${links}\n    </ul>\n  </section>`;
    }
  } catch (_) { /* gracefully skip */ }

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
  <title>${esc(title)} | ${SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="${esc(authorDisplay)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${canonicalUrl}">
  ${buildHreflangTags(`/articles/${slug}`, availableTranslations)}
  <link rel="alternate" type="application/rss+xml" title="${SITE_NAME} RSS Feed" href="${FEED_URL}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="${imgWidth}">
  <meta property="og:image:height" content="${imgHeight}">
  <meta property="og:image:alt" content="${esc(title)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  ${pubDate ? `<meta property="article:published_time" content="${esc(pubDate)}">` : ''}
  ${updatedAt ? `<meta property="article:modified_time" content="${esc(updatedAt)}">` : ''}
  ${article.section ? `<meta property="article:section" content="${esc(article.section)}">` : ''}
  ${tagsArray.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@opentuwa">
  <meta name="twitter:creator" content="${esc(twitterCreator)}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <meta name="twitter:image:alt" content="${esc(title)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#c4c4c4;--accent:#3b82f6}
    *{box-sizing:border-box}
    body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;line-height:1.8;margin:0;padding:2rem}
    article{max-width:700px;margin:0 auto}
    h1{color:#fff;font-size:2.5rem;line-height:1.2;margin-bottom:.5rem}
    h2{color:#fff;font-size:1.5rem;margin-top:2rem}
    .meta{color:var(--muted);margin-bottom:2rem;border-bottom:1px solid #222;padding-bottom:1rem}
    img{max-width:100%;height:auto;border-radius:8px;margin:2rem 0}
    p{margin-bottom:1.5rem}
    a{color:var(--accent)}
    nav a{color:#fff;font-weight:700;text-decoration:none}
    section{max-width:700px;margin:2rem auto;padding:1.5rem;border-top:1px solid #222}
    section ul{padding-left:1.5rem}
    section li{margin-bottom:.75rem}
    footer{max-width:700px;margin:3rem auto 0;font-size:.8rem;color:var(--muted)}
    footer a{color:var(--muted)}
  </style>
</head>
<body>
  <article>
    <nav aria-label="Site navigation">
      <a href="/" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
    </nav>
    <h1>${esc(title)}</h1>
    <div class="meta">
      By <strong>${esc(authorDisplay)}</strong>
      ${pubDate ? ` &bull; <time datetime="${esc(pubDate)}">${new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>` : ''}
      ${article.section ? ` &bull; ${esc(article.section)}` : ''}
    </div>
    ${rawImage ? `<img src="${esc(image)}" alt="${esc(title)}" width="1200" height="630" loading="eager">` : ''}
    <div>${content}</div>
  </article>${relatedHtml}
  <footer>
    <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
      <a href="/legal">Legal</a> |
      <a href="/about">About</a> |
      <a href="/archive">Archive</a> |
      <a href="/feed.xml">RSS Feed</a>
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
