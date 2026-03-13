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
    return context.next();
  }

  if (!article) return context.next();

  const title = article.title || 'Video';
  const desc = article.seo_description || article.subtitle || '';
  const image = article.image_url || '';
  const author = article.author || 'OpenTuwa';
  
  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <article>
        <h1>${esc(title)}</h1>
        <p><strong>${esc(author)}</strong></p>
        <p>${esc(desc)}</p>
        ${image ? `<img src="${esc(image)}" style="max-width:100%; border-radius:8px;">` : ''}
      </article>
    </main>
  `;

  const response = await context.next();

  if (!response.headers.get('content-type')?.includes('text/html')) {
    return new Response(innerHtml, { headers: { 'content-type': 'text/html' } });
  }

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title + " | OpenTuwa"); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
    .on('div#root', { element(e) { e.setInnerContent(innerHtml, { html: true }); } })
    .transform(response);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
