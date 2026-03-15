export async function onRequestGet() {
  const robotsTxt = `Sitemap: https://opentuwa.com/sitemap-index.xml
Sitemap: https://opentuwa.com/sitemap.xml
Sitemap: https://opentuwa.com/news-sitemap.xml

User-agent: *
Allow: /
Allow: /api/article/
Allow: /api/articles/
Allow: /api/author/
Allow: /api/authors/
Allow: /api/recommendations/
Allow: /api/subscribe/
Allow: /api/track-interaction/
Disallow: /api/
Disallow: /admin/
Disallow: /private/

User-agent: Googlebot
Allow: /
Allow: /api/article/
Allow: /api/articles/
Allow: /api/author/
Allow: /api/authors/
Allow: /api/recommendations/
Disallow: /api/
Disallow: /admin/
Disallow: /private/

User-agent: bingbot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /
`;

  return new Response(robotsTxt, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
