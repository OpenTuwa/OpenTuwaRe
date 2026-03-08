export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, title, seo_description, subtitle, excerpt, author_name, author, published_at, created_at, date_published, content_html FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 50"
    ).bind().all();
    articles = results || [];
  } catch (e) { articles = []; }

  const now = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenTuwa</title>
    <link>${esc(origin)}</link>
    <description>News and articles from OpenTuwa</description>
    <language>en</language>
    <lastBuildDate>${esc(now)}</lastBuildDate>
    <atom:link href="${esc(origin + '/feed.xml')}" rel="self" type="application/rss+xml"/>`;

  for (const a of articles) {
    const link = origin + '/articles/' + a.slug;
    const pubDate = toRFC822(a.published_at || a.created_at || a.date_published);
    const desc = a.seo_description || a.subtitle || a.excerpt || '';
    const author = a.author_name || a.author || 'OpenTuwa';
    xml += `
    <item>
      <title>${esc(a.title || '')}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>${pubDate ? `
      <pubDate>${esc(pubDate)}</pubDate>` : ''}
      <description>${esc(desc)}</description>
      <author>${esc(author)}</author>
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=1800'
    }
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toRFC822(val) {
  if (!val) return '';
  try { const d = new Date(val); return isNaN(d.getTime()) ? '' : d.toUTCString(); } catch (e) { return ''; }
}
