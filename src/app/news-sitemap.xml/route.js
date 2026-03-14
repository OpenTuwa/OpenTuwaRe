import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const SITE_URL = 'https://opentuwa.com';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toISO(val) {
  if (!val) return '';
  try { const d = new Date(val); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch { return ''; }
}

export async function GET() {
  const cutoff2d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
  let articles = [];
  try {
    const { env } = getRequestContext();
    let { results } = await env.DB.prepare(
      'SELECT slug, title, published_at, image_url, tags FROM articles WHERE DATETIME(published_at) >= DATETIME(?) ORDER BY published_at DESC LIMIT 1000'
    ).bind(cutoff2d).all();
    if (!results || results.length === 0) {
      ({ results } = await env.DB.prepare(
        'SELECT slug, title, published_at, image_url, tags FROM articles WHERE DATETIME(published_at) >= DATETIME(?) ORDER BY published_at DESC LIMIT 1000'
      ).bind(cutoff30d).all());
    }
    articles = results || [];
  } catch (e) {
    return new Response(`DB ERROR: ${e?.message || String(e)}`, { status: 500, headers: { 'content-type': 'text/plain' } });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  for (const a of articles) {
    const isoDate = toISO(a.published_at);
    if (!isoDate) continue;
    const imageUrl = a.image_url
      ? (a.image_url.startsWith('http') ? a.image_url : SITE_URL + a.image_url)
      : '';

    let tagsArray = [];
    if (Array.isArray(a.tags)) tagsArray = a.tags;
    else if (typeof a.tags === 'string') tagsArray = a.tags.split(',').map(t => t.trim()).filter(Boolean);
    const keywords = tagsArray.slice(0, 10).join(', ');

    xml += `
  <url>
    <loc>${esc(SITE_URL + '/articles/' + a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenTuwa</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${esc(isoDate)}</news:publication_date>
      <news:title>${esc(a.title || '')}</news:title>${keywords ? `
      <news:keywords>${esc(keywords)}</news:keywords>` : ''}
    </news:news>${imageUrl ? `
    <image:image>
      <image:loc>${esc(imageUrl)}</image:loc>
      <image:title>${esc(a.title || '')}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=900',
    },
  });
}
