import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // Get recent articles (last 2 days for news sitemap)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { results: articles } = await env.DB.prepare(
      `SELECT slug, title, published_at, updated_at FROM articles 
       WHERE published_at >= ? AND published_at IS NOT NULL 
       ORDER BY published_at DESC LIMIT 1000`
    ).bind(twoDaysAgo).all();
    
    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;
    
    for (const article of articles) {
      const pubDate = new Date(article.published_at).toISOString();
      const pubDateFormatted = pubDate.substring(0, 10) + 'T' + pubDate.substring(11, 19) + 'Z';
      
      xml += `
  <url>
    <loc>https://opentuwa.com/articles/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenTuwa</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:genres>PressRelease, Blog, OpEd, Opinion, UserGenerated</news:genres>
      <news:publication_date>${pubDateFormatted}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
      <news:keywords>news, journalism, OpenTuwa</news:keywords>
    </news:news>
  </url>`;
    }
    
    xml += '\n</urlset>';
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new Response('Error generating news sitemap', { status: 500 });
  }
}