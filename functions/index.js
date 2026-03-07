export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    const tag = url.searchParams.get('tag');

    if (author && author.trim() !== '') {
      // lookup author in DB
      const { results } = await env.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(author).all();
      const a = (results && results[0]) || null;
      const name = a?.name || author;
      const bio = a?.bio || `Articles by ${name}`;
      const avatar = a?.avatar_url || a?.avatar || a?.image_url || '';

      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escapeHtml(name)} | OpenTuwa</title>
        <meta name="description" content="${escapeHtml(bio)}">
        <meta property="og:type" content="profile">
        <meta property="og:title" content="${escapeHtml(name)} | OpenTuwa">
        <meta property="og:description" content="${escapeHtml(bio)}">
        ${avatar ? `<meta property="og:image" content="${escapeHtml(avatar)}">` : ''}
        <meta property="og:url" content="${escapeHtml(url.toString())}">
        <meta name="twitter:card" content="${avatar ? 'summary_large_image' : 'summary'}">
        <meta name="twitter:title" content="${escapeHtml(name)} | OpenTuwa">
        <meta name="twitter:description" content="${escapeHtml(bio)}">
        ${avatar ? `<meta name="twitter:image" content="${escapeHtml(avatar)}">` : ''}
        <link rel="canonical" href="${escapeHtml(url.toString())}">
      </head><body>
        <main style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:4rem auto;padding:1rem;">
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(bio)}</p>
          <p><a href="${escapeHtml(url.toString())}">View stories by ${escapeHtml(name)}</a></p>
        </main>
      </body></html>`;

      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    if (tag && tag.trim() !== '') {
      const title = `Tagged: ${tag} | OpenTuwa`;
      const desc = `Stories and articles related to ${tag}`;
      const urlStr = url.toString();
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <meta name="description" content="${escapeHtml(desc)}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(desc)}">
        <meta property="og:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop">
        <meta property="og:url" content="${escapeHtml(urlStr)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(title)}">
        <meta name="twitter:description" content="${escapeHtml(desc)}">
        <link rel="canonical" href="${escapeHtml(urlStr)}">
      </head><body>
        <main style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:4rem auto;padding:1rem;">
          <h1>Tagged: ${escapeHtml(tag)}</h1>
          <p>${escapeHtml(desc)}</p>
          <p><a href="${escapeHtml(urlStr)}">View stories tagged ${escapeHtml(tag)}</a></p>
        </main>
      </body></html>`;

      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    // If no author/tag, fallback to letting static index load (delegate to other handlers)
    return fetch(request);
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
