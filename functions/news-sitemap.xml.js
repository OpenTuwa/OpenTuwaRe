export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  // Google News sitemaps should only include articles from the last 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let articles = [];
  try {
const { results } = await env.DB.prepare(
  "SELECT slug, title, published_at, image_url FROM articles WHERE published_at >= ? ORDER BY published_at DESC LIMIT 1000"
).bind(cutoff).all();
    articles = results || [];
  } catch (e) {
    // Fallback: get recent articles without date filter and filter in JS
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug, title, published_at, created_at, date_published, image_url FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 50"
      ).bind().all();
      articles = (results || []).filter(a => {
        const d = new Date(a.published_at || a.created_at || a.date_published);
        return !isNaN(d.getTime()) && (Date.now() - d.getTime()) < 48 * 60 * 60 * 1000;
      });
    } catch (e2) { articles = []; }
  }

  // --- NEW FIX: Prevent empty sitemap ---
  // If no articles were published in the last 48 hours, the sitemap is empty.
  // The XML schema requires at least one <url> tag, so we fetch the most recent article as a fallback.
  if (articles.length === 0) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug, title, published_at, created_at, date_published, image_url FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 1"
      ).all();
      articles = results || [];
    } catch (e3) { 
      // Failsafe in case DB is completely empty
    }
  }
  // --------------------------------------

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  for (const a of articles) {
    const pubDate = a.published_at || a.created_at || a.date_published;
    const isoDate = toISO(pubDate);
    if (!isoDate) continue;
    
    xml += `
  <url>
    <loc>${esc(origin + '/articles/' + a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenTuwa</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${esc(isoDate)}</news:publication_date>
      <news:title>${esc(a.title || '')}</news:title>
    </news:news>
    ${a.image_url ? `
    <image:image>
      <image:loc>${esc(a.image_url)}</image:loc>
      <image:title>${esc(a.title || '')}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  // Final failsafe: If the database is completely empty and no URL was added,
  // insert a dummy URL so it doesn't crash GSC.
  if (!xml.includes('<url>')) {
    xml += `
  <url>
    <loc>${esc(origin)}</loc>
  </url>`;
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