export async function onRequestGet(context) {
  const { env } = context;
  const title = 'Archive | OpenTuwa';
  const description = 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.';

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT title, slug, published_at FROM articles ORDER BY published_at DESC"
    ).all();
    articles = results || [];
  } catch (err) { articles = []; }

  const grouped = articles.reduce((acc, article) => {
    const date = new Date(article.published_at || Date.now());
    const year = date.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(article);
    return acc;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => b - a);

  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">Archive</h1>
      <p style="color:#ccc; font-size:1.2rem; margin-bottom:2rem;">${description}</p>
      ${years.map(year => `
        <section style="margin-bottom:3rem;">
          <h2 style="color:#888; font-size:2rem; margin-bottom:1rem; border-bottom:1px solid #222;">${year}</h2>
          <ul style="list-style:none; padding:0;">
            ${grouped[year].map(article => `
              <li style="padding:0.75rem 0; border-bottom:1px solid #1a1a1a; display:flex; justify-content:space-between;">
                <a href="/articles/${article.slug}" style="color:#fff; text-decoration:none; font-size:1.1rem;">${article.title}</a>
                <small style="color:#666; font-family:monospace;">${new Date(article.published_at).toLocaleDateString()}</small>
              </li>
            `).join('')}
          </ul>
        </section>
      `).join('')}
    </main>
  `;

  const response = await context.next();

  if (!response.headers.get('content-type')?.includes('text/html')) {
    return new Response(innerHtml, { headers: { 'content-type': 'text/html' } });
  }

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', description); } })
    .on('div#root', { element(e) { e.setInnerContent(innerHtml, { html: true }); } })
    .transform(response);
}
