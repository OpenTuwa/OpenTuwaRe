import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    
    // Get all articles with proper date handling
    const { results: articles } = await env.DB.prepare(
      `SELECT slug, updated_at, published_at FROM articles WHERE published_at IS NOT NULL ORDER BY updated_at DESC`
    ).all();
    
    // Get current date for lastmod
    const now = new Date().toISOString().split('T')[0];
    
    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add homepage
    xml += `
  <url>
    <loc>https://opentuwa.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    // Add static pages
    const staticPages = [
      { path: '/about', changefreq: 'monthly', priority: 0.5 },
      { path: '/archive', changefreq: 'monthly', priority: 0.5 },
      { path: '/legal', changefreq: 'monthly', priority: 0.5 }
    ];
    
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>https://opentuwa.com${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }
    
    // Add articles
    for (const article of articles) {
      // Use updated_at if available and valid, otherwise use published_at, fallback to now
      let lastMod = now;
      if (article.updated_at) {
        try {
          const updatedDate = new Date(article.updated_at);
          if (!isNaN(updatedDate.getTime())) {
            lastMod = updatedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // fallback to published_at
        }
      }
      
      if (lastMod === now && article.published_at) {
        try {
          const publishedDate = new Date(article.published_at);
          if (!isNaN(publishedDate.getTime())) {
            lastMod = publishedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // keep fallback
        }
      }
      
      xml += `
  <url>
    <loc>https://opentuwa.com/articles/${article.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    xml += '\n</urlset>';
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}