export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) {
      const { results } = await env.DB.prepare(`
        SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
               m.total_views, m.total_reads, m.total_shares, m.engagement_score 
        FROM articles a
        LEFT JOIN algo_metrics m ON a.slug = m.article_slug
        ORDER BY a.published_at DESC LIMIT 50
      `).all();
      return Response.json(results);
    }

    // search across multiple fields: title, subtitle, seo_description, content_html, tags, image fields
    const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const sql = `
      SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
             m.total_views, m.total_reads, m.total_shares, m.engagement_score
      FROM articles a
      LEFT JOIN algo_metrics m ON a.slug = m.article_slug
      WHERE (
        a.title LIKE ? ESCAPE '\\' OR
        a.subtitle LIKE ? ESCAPE '\\' OR
        a.seo_description LIKE ? ESCAPE '\\' OR
        a.content_html LIKE ? ESCAPE '\\' OR
        a.tags LIKE ? ESCAPE '\\' OR
        a.image_url LIKE ? ESCAPE '\\' OR
        a.image_alt LIKE ? ESCAPE '\\' OR
        a.content_html LIKE ? ESCAPE '\\' -- also search media filenames/iframe srcs inside content_html
      )
      ORDER BY a.published_at DESC
      LIMIT 100
    `;
    const { results } = await env.DB.prepare(sql).bind(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard).all();
    return Response.json(results);
  } catch (err) {
    return Response.json([]);
  }
}