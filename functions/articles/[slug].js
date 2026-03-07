export async function onRequestGet(context) {
  const { env, params, request } = context;
  // Detect common crawler user-agents; only return prerendered HTML for bots
  const ua = (request && request.headers && request.headers.get('user-agent')) || '';
  const botRegex = /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|googlebot|bingbot|duckduckbot|applebot)/i;
  if (!botRegex.test(ua)) {
    if (context && typeof context.next === 'function') {
      return await context.next();
    }
    // If we cannot delegate, let the browser handle (avoid returning prerender HTML)
    return new Response(null, { status: 204 });
  }
  try {
    const slug = params.slug;
    const { results } = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).all();
    if (!results || results.length === 0) return new Response('Not found', { status: 404 });
    const article = results[0];

    const title = article.title || 'Article';
    const description = article.seo_description || article.subtitle || (article.excerpt || '');
    const image = article.image_url || '';
    const url = new URL(request.url).toString();

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${escapeHtml(title)} | OpenTuwa</title>
      <meta name="description" content="${escapeHtml(description)}">
      <meta property="og:type" content="article">
      <meta property="og:title" content="${escapeHtml(title)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
      <meta property="og:url" content="${escapeHtml(url)}">
      <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
      <meta name="twitter:title" content="${escapeHtml(title)}">
      <meta name="twitter:description" content="${escapeHtml(description)}">
      ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
      <link rel="canonical" href="${escapeHtml(url)}">
    </head><body>
      <main style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:4rem auto;padding:1rem;">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="${escapeHtml(url)}">Read on OpenTuwa</a></p>
      </main>
    </body></html>`;

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
