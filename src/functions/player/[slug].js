export async function onRequestGet(context) {
  const { env, request, params } = context;
  const slug = params.slug;

  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    console.error('Player DB Query failed:', e);
    // Graceful fallback to next if DB fails
    return context.next();
  }

  if (!article) return context.next();

  const origin = new URL(request.url).origin;
  const url = `${origin}/player/${slug}`;
  const title = article.title || 'Video';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  const pubDate = article.published_at || '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: desc,
    thumbnailUrl: image ? [image] : [],
    uploadDate: pubDate,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'OpenTuwa',
      logo: { '@type': 'ImageObject', url: `${origin}/img/logo.png` }
    }
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} | OpenTuwa</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  ${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
  <link rel="canonical" href="${esc(url)}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1 { font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; margin-bottom: 1rem; font-size: 2.25rem; }
    .meta { font-family: Inter, sans-serif; color: #888; margin-bottom: 2rem; border-bottom: 1px solid #222; padding-bottom: 1rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
    p { margin-bottom: 1.25rem; }
    strong { color: #fff; }
    a { color: #3b82f6; text-decoration: none; }
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
        ${pubDate ? ` · ${new Date(pubDate).toDateString()}` : ''}
      </div>
      
      ${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
      
      <p class="lead"><strong>${esc(desc)}</strong></p>
      
      <p><em>This video content is available on the full OpenTuwa experience. <a href="${esc(url)}">Click here to watch.</a></em></p>
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

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
