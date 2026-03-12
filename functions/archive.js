import { isBot } from './_utils/bot-detector.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isBot(request)) {
    return context.next();
  }

  const url = new URL(request.url);
  const title = 'Archive | OpenTuwa';
  const description = 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.';
  const siteUrl = url.origin;

  let articles = [];
  try {
    // Get all articles for the archive, sorted by date
    const { results } = await env.DB.prepare(
      "SELECT title, slug, published_at FROM articles ORDER BY published_at DESC"
    ).all();
    articles = results || [];
  } catch (err) {
    console.error('DB Query failed:', err);
    // Graceful fallback
    return context.next();
  }

  // Group by Year for display
  const grouped = articles.reduce((acc, article) => {
    const date = new Date(article.published_at || Date.now());
    const year = date.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(article);
    return acc;
  }, {});
  
  const years = Object.keys(grouped).sort((a, b) => b - a);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'OpenTuwa Archive',
    'description': description,
    'url': `${siteUrl}/archive`
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(siteUrl)}/archive">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${escapeHtml(siteUrl)}/archive">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <main style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
    <h1>Archive</h1>
    <p>${escapeHtml(description)}</p>
    
    ${years.map(year => `
      <section>
        <h2>${year}</h2>
        <ul>
          ${grouped[year].map(article => `
            <li>
              <a href="/articles/${escapeHtml(article.slug)}">
                ${escapeHtml(article.title)}
              </a>
              <small> - ${new Date(article.published_at).toLocaleDateString()}</small>
            </li>
          `).join('')}
        </ul>
      </section>
    `).join('')}

    <hr>
    <p><a href="/">Back to Home</a></p>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
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
