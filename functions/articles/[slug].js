import { isBot } from '../_utils/bot-detector.js';
import { buildArticleGraph } from '../_utils/schema.js';
import { buildHreflangTags } from '../_utils/hreflang.js';
import { buildHead } from '../_utils/head.js';

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
              author, author_name, author_twitter, published_at, updated_at, content_html, tags, section,
              category, category_slug, is_breaking, created_at,
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
  const twitterCreator = article.author_twitter
    ? (article.author_twitter.startsWith('@') ? article.author_twitter : `@${article.author_twitter}`)
    : '@opentuwa';

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
  // Silo: fetch 3 most recent articles in the same category
  let siloArticles = [];
  try {
    const categoryFilter = article.category_slug || article.category || article.section;
    if (categoryFilter) {
      const col = article.category_slug ? 'category_slug' : (article.category ? 'category' : 'section');
      const { results: silo } = await env.DB.prepare(
        `SELECT slug, title FROM articles WHERE ${col} = ? AND slug != ? ORDER BY published_at DESC LIMIT 3`
      ).bind(categoryFilter, slug).all();
      siloArticles = silo || [];
    }
  } catch (_) { /* gracefully skip */ }

  const relatedLinks = siloArticles
    .filter(r => r?.slug)
    .map(r => `${SITE_URL}/articles/${r.slug}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': buildArticleGraph(article, SITE_URL, relatedLinks),
  };

  // Further Reading section
  let relatedHtml = '';
  if (siloArticles.length > 0) {
    const links = siloArticles
      .filter(r => r?.slug)
      .map(r => `    <li><a href="/articles/${esc(r.slug)}">${esc(r.title || 'Article')}</a></li>`)
      .join('\n');
    relatedHtml = `\n  <section aria-label="Further reading">\n    <h2>Further Reading</h2>\n    <ul>\n${links}\n    </ul>\n  </section>`;
  }

  const authorSlugStr = authorDisplay.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const extraMeta = [
    pubDate   ? `<meta property="article:published_time" content="${esc(pubDate)}">` : '',
    updatedAt ? `<meta property="article:modified_time" content="${esc(updatedAt)}">` : '',
    article.section ? `<meta property="article:section" content="${esc(article.section)}">` : '',
    `<meta property="article:author" content="${esc(`${SITE_URL}/authors/${authorSlugStr}`)}">`,
    ...tagsArray.map(t => `<meta property="article:tag" content="${esc(t)}">`),
    `<meta name="author" content="${esc(authorDisplay)}">`,
  ].filter(Boolean).join('\n  ');

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  ${buildHead({
    title: `${esc(title)} | ${SITE_NAME}`,
    desc: esc(desc),
    canonical: canonicalUrl,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    hreflang: buildHreflangTags(`/articles/${slug}`, availableTranslations),
    ogType: 'article',
    ogImage: esc(ogImage),
    ogImageWidth: imgWidth,
    ogImageHeight: imgHeight,
    ogImageAlt: esc(title),
    twitterCard: 'summary_large_image',
    twitterCreator: esc(twitterCreator),
    jsonLd: JSON.stringify(jsonLd),
    extraMeta,
    cssVariant: 'article',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="${SITE_NAME} home">${SITE_NAME}</a>
  </nav>
  <div class="article-wrap">
    <h1>${esc(title)}</h1>
    <div class="article-meta">
      By <strong>${esc(authorDisplay)}</strong>
      ${pubDate ? ` &bull; <time datetime="${esc(pubDate)}">${new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>` : ''}
      ${article.section ? ` &bull; ${esc(article.section)}` : ''}
    </div>
    ${rawImage ? `<img src="${esc(image)}" alt="${esc(title)}" width="1200" height="630" class="hero-img" loading="eager">` : ''}
    <div>${content}</div>
  </div>${relatedHtml}
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
