export async function onRequestGet(context) {
  const { request } = context;
  const origin = new URL(request.url).origin;
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /feed.xml
Disallow: /api/
Disallow: /_next/

# AI crawlers
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${origin}/sitemap-index.xml
Sitemap: ${origin}/sitemap.xml
Sitemap: ${origin}/news-sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
