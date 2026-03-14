export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, published_at, image_url, title FROM articles ORDER BY published_at DESC"
    ).bind().all();
    articles = results || [];
  } catch (e) { articles = []; }

  const staticPages = ['/', '/about', '/archive', '/legal'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  for (const page of staticPages) {
    const lastmod = page === '/' ? new Date().toISOString() : null;
    xml += `
  <url>
    <loc>${esc(origin + page)}</loc>${lastmod ? `
    <lastmod>${esc(lastmod)}</lastmod>` : ''}
    <changefreq>${page === '/' ? 'daily' : 'monthly'}</changefreq>
    <priority>${page === '/' ? '1.0' : '0.5'}</priority>
  </url>`;
  }

  for (const a of articles) {
    const lastmod = toISO(a.published_at);
    const imageUrl = a.image_url
      ? (a.image_url.startsWith('http') ? a.image_url : origin + a.image_url)
      : '';
    
    xml += `
  <url>
    <loc>${esc(origin + '/articles/' + a.slug)}</loc>${lastmod ? `
    <lastmod>${esc(lastmod)}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageUrl ? `
    <image:image>
      <image:loc>${esc(imageUrl)}</image:loc>
      <image:title>${esc(a.title || '')}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
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
