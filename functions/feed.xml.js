// SEO: Req 11.1-11.7 — all required RSS feed fields present
// Req 11.1: <title>, <link>, <guid isPermaLink="true">, <pubDate>, <description>, <dc:creator> per item
// Req 11.2: <media:content> with absolute image URL and medium="image" when image_url present
// Req 11.3: <atom:link rel="self"> in channel
// Req 11.4: <language>en-us</language> in channel
// Req 11.5: <category> elements per tag
// Req 11.6: Content-Type: application/rss+xml; charset=utf-8 response header
// Req 11.7: LIMIT 50 most recently published articles
export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, title, seo_description, subtitle, excerpt, author_name, author, published_at, created_at, date_published, image_url, content_html, tags, section, category, read_time_minutes FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 50"
    ).bind().all();
    articles = results || [];
  } catch (e) { articles = []; }

  const now = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0">
  <channel>
    <title>OpenTuwa</title>
    <link>${esc(origin)}</link>
    <description>Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} OpenTuwa. All rights reserved.</copyright>
    <lastBuildDate>${esc(now)}</lastBuildDate>
    <atom:link href="${esc(origin + '/feed.xml')}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${esc(origin + '/assets/ui/web_512.png')}</url>
      <title>OpenTuwa</title>
      <link>${esc(origin)}</link>
      <width>512</width>
      <height>512</height>
    </image>
    <itunes:author>OpenTuwa</itunes:author>
    <itunes:summary>Independent news and journalism covering stories that matter. Deep dives, documentaries, and analysis.</itunes:summary>
    <itunes:explicit>clean</itunes:explicit>
    <itunes:category text="News">
      <itunes:category text="Politics"/>
      <itunes:category text="Technology"/>
      <itunes:category text="World"/>
    </itunes:category>`;

  for (const a of articles) {
    const link = origin + '/articles/' + a.slug;
    const pubDate = toRFC822(a.published_at || a.created_at || a.date_published) || now;
    const desc = a.seo_description || a.subtitle || a.excerpt || 'Read the full article on OpenTuwa.';
    const author = a.author_name || a.author || 'OpenTuwa';
    // Resolve image_url to absolute URL (Req 11.2)
    const imageUrl = a.image_url
      ? (a.image_url.startsWith('http') ? a.image_url : origin + a.image_url)
      : '';
    const content = a.content_html || desc;
    const readTime = a.read_time_minutes || 5;
    
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
      <dc:date>${esc(pubDate)}</dc:date>
      ${categories.map(c => `<category>${esc(c)}</category>`).join('')}
      <content:encoded><![CDATA[${content}]]></content:encoded>
      ${imageUrl ? `<media:content url="${esc(imageUrl)}" medium="image" type="image/jpeg"/>` : ''}
      ${imageUrl ? `<media:thumbnail url="${esc(imageUrl)}" width="300" height="169"/>` : ''}
      <itunes:duration>${esc(readTime * 60)}</itunes:duration>
      <itunes:author>${esc(author)}</itunes:author>
      <itunes:subtitle>${esc(desc.substring(0, 200))}</itunes:subtitle>
      <itunes:summary>${esc(desc)}</itunes:summary>
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
