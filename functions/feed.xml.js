export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, title, seo_description, subtitle, excerpt, author_name, author, published_at, created_at, date_published, image_url, content_html, tags, section, category FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 50"
    ).bind().all();
    articles = results || [];
  } catch (e) { articles = []; }

  const now = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>OpenTuwa</title>
    <link>${esc(origin)}</link>
    <description>Independent news and journalism covering stories that matter.</description>
    <language>en</language>
    <lastBuildDate>${esc(now)}</lastBuildDate>
    <atom:link href="${esc(origin + '/feed.xml')}" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://raw.githubusercontent.com/Quran-lite-pages-dev/Quran-lite.pages.dev/refs/heads/master/assets/ui/web.png</url>
      <title>OpenTuwa</title>
      <link>${esc(origin)}</link>
    </image>`;

  for (const a of articles) {
    const link = origin + '/articles/' + a.slug;
    const pubDate = toRFC822(a.published_at || a.created_at || a.date_published) || now;
    const desc = a.seo_description || a.subtitle || a.excerpt || 'Read the full article on OpenTuwa.';
    const author = a.author_name || a.author || 'OpenTuwa';
    const imageUrl = a.image_url || '';
    const content = a.content_html || desc;
    
    // Process tags for categories
    let categories = [];
    if (a.section) categories.push(a.section);
    if (a.category && a.category !== a.section) categories.push(a.category);
    
    try {
      if (a.tags) {
        if (typeof a.tags === 'string') {
           // Try JSON first then comma-split
           try {
             const parsed = JSON.parse(a.tags);
             if (Array.isArray(parsed)) categories.push(...parsed);
           } catch(e) {
             categories.push(...a.tags.split(','));
           }
        } else if (Array.isArray(a.tags)) {
           categories.push(...a.tags);
        }
      }
    } catch(e) {}
    
    // Dedup and clean
    categories = [...new Set(categories.map(c => String(c).trim()).filter(Boolean))];

    xml += `
    <item>
      <title>${esc(a.title || 'Untitled')}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${esc(pubDate)}</pubDate>
      <description>${esc(desc)}</description>
      <dc:creator>${esc(author)}</dc:creator>
      ${categories.map(c => `<category>${esc(c)}</category>`).join('')}
      <content:encoded><![CDATA[${content}]]></content:encoded>
      ${imageUrl ? `<media:content url="${esc(imageUrl)}" medium="image"/>` : ''}
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
