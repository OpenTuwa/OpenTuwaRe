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
    // Continue to next (likely SPA 404 or shell)
    return context.next();
  }

  if (!article) {
    // Let the SPA handle the 404
    return context.next();
  }

  const title = article.title || 'Article';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  const pubDate = article.published_at || '';
  const content = (typeof article.content_html === 'string' && article.content_html.trim().length > 0) 
    ? article.content_html 
    : `<p class="lead">${esc(desc)}</p>`;

  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <article>
        <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.75rem; margin-bottom: 1rem; line-height: 1.2; color: #fff;">${esc(title)}</h1>
        <div style="color: #888; margin-bottom: 2rem; border-bottom: 1px solid #222; padding-bottom: 1.5rem;">
          <strong>${esc(author)}</strong>
          ${pubDate ? ` · ${new Date(pubDate).toDateString()}` : ''}
        </div>
        ${image ? `<img src="${esc(image)}" alt="${esc(title)}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0;">` : ''}
        <div style="color: #e1e1e1; font-family: Inter, sans-serif; line-height: 1.8; font-size: 1.1rem;">
          ${content}
        </div>
      </article>
    </main>
  `;

  // Fetch the SPA Shell
  const response = await context.next();

  if (!response.headers.get('content-type')?.includes('text/html')) {
    return new Response(innerHtml, { headers: { 'content-type': 'text/html' } });
  }

  // Inject Content (Hydration)
  return new HTMLRewriter()
    .on('title', {
      element(e) { e.setInnerContent(title + " | OpenTuwa"); }
    })
    .on('meta[name="description"]', {
      element(e) { e.setAttribute('content', desc); }
    })
    .on('head', {
      element(e) {
        e.append(`<meta property="og:title" content="${esc(title)}">`, { html: true });
        e.append(`<meta property="og:description" content="${esc(desc)}">`, { html: true });
        if (image) e.append(`<meta property="og:image" content="${esc(image)}">`, { html: true });
        e.append(`<meta property="article:published_time" content="${esc(pubDate)}">`, { html: true });
      }
    })
    .on('div#root', {
      element(e) {
        e.setInnerContent(innerHtml, { html: true });
      }
    })
    .transform(response);
}

export async function onRequest(context) {
  return handleRequest(context);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
