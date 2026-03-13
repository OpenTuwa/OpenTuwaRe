async function handleRequest(context) {
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
    // Even if DB fails, try to return something or error out gracefully for the user
    return new Response("<h1>Service Unavailable</h1><p>Our systems are currently under heavy load. Please try again later.</p>", {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'Retry-After': '60' }
    });
  }

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
  // Ensure content_html is a string and handle empty/null cases
  const content = (typeof article.content_html === 'string' && article.content_html.trim().length > 0) 
    ? article.content_html 
    : `<p class="lead">${esc(desc)}</p><p><em>Read the full story on OpenTuwa.</em></p>`;

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
  <style>
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.8; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.75rem; margin-bottom: 1rem; line-height: 1.2; color: #fff; }
    .meta { font-family: Inter, sans-serif; color: #888; margin-bottom: 2rem; border-bottom: 1px solid #222; padding-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
    .meta strong { color: #fff; }
    .lead { font-size: 1.35rem; font-style: italic; color: #ccc; margin-bottom: 2.5rem; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 1.5rem; margin-left: 0; font-style: italic; color: #ddd; background: #111; padding: 1rem 1.5rem; border-radius: 0 4px 4px 0; }
    p { margin-bottom: 1.5rem; font-size: 1.15rem; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    /* Content specific overrides for dark mode */
    main div { color: #e1e1e1; }
    h2, h3, h4 { color: #f0f0f0; margin-top: 2rem; }
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
    <article>
      <h1>${esc(title)}</h1>
      <div class="meta">
        <strong>${esc(author)}</strong>
        ${pubDate ? ` · <time datetime="${pubDate}">${new Date(pubDate).toDateString()}</time>` : ''}
      </div>
      ${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
      
      ${content}
      
    </article>
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

export async function onRequest(context) {
  // Always handle request with SSR, no bot check
  return handleRequest(context);
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
