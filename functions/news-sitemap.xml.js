export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, title, published_at, image_url, section, category, tags, author, author_name FROM articles WHERE published_at >= ? ORDER BY published_at DESC LIMIT 1000"
    ).bind(cutoff).all();
    articles = results || [];
  } catch (e) { articles = []; }

  // Fallback: no recent articles → get latest 1
  if (articles.length === 0) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug, title, published_at, image_url, section, category, tags, author, author_name FROM articles ORDER BY published_at DESC LIMIT 1"
      ).all();
      articles = results || [];
    } catch (e) { articles = []; }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:geo="http://www.google.com/schemas/sitemap-geo/1.0">`;

  for (const a of articles) {
    const isoDate = toISO(a.published_at);
    if (!isoDate) continue;
    const imageUrl = a.image_url
      ? (a.image_url.startsWith('http') ? a.image_url : origin + a.image_url)
      : '';

    // Parse tags for news:keywords
    let tagsArray = [];
    if (Array.isArray(a.tags)) tagsArray = a.tags;
    else if (typeof a.tags === 'string') tagsArray = a.tags.split(',').map(t => t.trim()).filter(Boolean);
    const keywords = tagsArray.slice(0, 10).join(', ');

    xml += `
  <url>
    <loc>${esc(origin + '/articles/' + a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenTuwa</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${esc(isoDate)}</news:publication_date>
      <news:title>${esc(a.title || '')}</news:title>${keywords ? `
      <news:keywords>${esc(keywords)}</news:keywords>` : ''}${a.section ? `
      <news:genre>News</news:genre>` : ''}
    </news:news>${imageUrl ? `
    <image:image>
      <image:loc>${esc(imageUrl)}</image:loc>
      <image:title>${esc(a.title || '')}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  if (!xml.includes('<url>')) {
    xml += `\n  <url><loc>${esc(origin)}</loc></url>`;
  }

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=900'
    }
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toISO(val) {
  if (!val) return '';
  try { const d = new Date(val); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch (e) { return ''; }
}
