import { isBot } from '../_utils/bot-detector.js';

export async function onRequest(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  if (!isBot(request)) {
    return context.next();
  }

  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, content_html, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    return context.next();
  }

  if (!article) return context.next();

  const title = article.title || 'Article';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  const pubDate = article.published_at || '';
  const content = article.content_html || `<p>${esc(desc)}</p>`;

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(title)} | OpenTuwa</title>
  <meta name="description" content="${esc(desc)}">
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
  <article>
    <nav><a href="/" style="color:#fff; font-weight:bold; text-decoration:none;">OpenTuwa</a></nav>
    <h1>${esc(title)}</h1>
    <div class="meta">By <strong>${esc(author)}</strong> &bull; ${pubDate ? new Date(pubDate).toDateString() : ''}</div>
    ${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
    <div>${content}</div>
  </article>
</body>
</html>`;

  return new Response(botHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
