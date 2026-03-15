export async function onRequestGet(context) {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /feed.xml
Allow: /authors/
Disallow: /api/
Disallow: /_next/static/
Crawl-delay: 10

# AI crawlers
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://opentuwa.com/sitemap-index.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
