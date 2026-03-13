export async function onRequestGet(context) {
  const { request, env } = context;

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
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1, h2 { font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; }
    h1 { border-bottom: 1px solid #222; padding-bottom: 1.5rem; margin-bottom: 2rem; font-size: 2.5rem; }
    section { margin-bottom: 3rem; }
    h2 { font-size: 2rem; margin-bottom: 1rem; color: #888; border-bottom: 1px solid #222; padding-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.75rem 0; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: baseline; }
    a { text-decoration: none; color: #fff; font-size: 1.1rem; transition: color 0.2s; }
    a:hover { color: #3b82f6; }
    small { color: #666; font-family: monospace; font-size: 0.9rem; flex-shrink: 0; margin-left: 1rem; }
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
    <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 2rem;">${escapeHtml(description)}</p>
    
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
