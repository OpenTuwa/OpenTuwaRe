/**
 * GET /api/validate-schema
 * Pulls a random article from D1, builds the JSON-LD @graph, and returns it
 * as pure JSON for manual testing in the Google Rich Results tool.
 *
 * Usage: open https://opentuwa.com/api/validate-schema in a browser,
 * copy the output, paste into https://search.google.com/test/rich-results
 *
 * TEMPORARY — remove after validation is complete.
 */
import { buildArticleGraph } from '../_utils/schema.js';

const SITE_URL = 'https://opentuwa.com';

export async function onRequest({ env, request }) {
  // Only allow in non-production or with a secret token to avoid public exposure
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const expectedToken = env.VALIDATE_TOKEN || 'dev-only';
  if (token !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  let article = null;
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM articles WHERE slug IS NOT NULL ORDER BY RANDOM() LIMIT 1`
    ).all();
    article = results?.[0] || null;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'DB query failed', detail: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!article) {
    return new Response(JSON.stringify({ error: 'No articles found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const graph = buildArticleGraph(article, SITE_URL);
  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  return new Response(JSON.stringify(jsonLd, null, 2), {
    headers: {
      'content-type': 'application/json',
      'x-article-slug': article.slug || '',
    },
  });
}
