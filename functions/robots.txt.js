export async function onRequestGet() {
  const robotsTxt = `Sitemap: https://opentuwa.com/sitemap-index.xml
Sitemap: https://opentuwa.com/sitemap.xml
Sitemap: https://opentuwa.com/news-sitemap.xml

User-agent: *
Allow: /
Allow: /feed.xml
Allow: /authors/
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /
`;

  return new Response(robotsTxt, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
