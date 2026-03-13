export async function onRequestGet(context) {
  const { request } = context;
  const origin = new URL(request.url).origin;
  
  const robotsTxt = `User-agent: *
Allow: /

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
