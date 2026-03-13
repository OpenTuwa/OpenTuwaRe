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
    const { results } = await env.DB.prepare(
      "SELECT title, slug, published_at FROM articles ORDER BY published_at DESC"
    ).all();
    articles = results || [];
  } catch (err) {
    console.error('DB Query failed:', err);
    return context.next();
  }

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
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9f9f9; }
    header, footer { background: #111; color: #fff; padding: 1rem; text-align: center; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.5rem; }
    main { max-width: 800px; margin: 2rem auto; padding: 2rem; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    h1, h2 { font-family: sans-serif; color: #111; }
    h1 { border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    section { margin-bottom: 2rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
    a { text-decoration: none; color: #111; }
    a:hover { color: #0056b3; text-decoration: underline; }
    small { color: #666; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/"><strong>OpenTuwa</strong></a>
      <a href="/archive">Archive</a>
      <a href="/about">About</a>
      <a href="/legal">Legal</a>
    </nav>
  </header>
  <main>
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
              <small>${new Date(article.published_at).toLocaleDateString()}</small>
            </li>
          `).join('')}
        </ul>
      </section>
    `).join('')}

  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} OpenTuwa. All rights reserved.</p>
    <p>
      <a href="/">Home</a> | 
      <a href="/about">About</a> | 
      <a href="/legal">Legal</a>
    </p>
  </footer>
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
