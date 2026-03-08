export async function onRequestGet(context) {
  const { env } = context;
  try {
    const url = new URL(context.request.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) {
      const { results } = await env.DB.prepare(`
        SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, tags, seo_description 
        FROM articles ORDER BY published_at DESC LIMIT 50
      `).all();
      return Response.json(results);
    }

    // search across multiple fields: title, subtitle, seo_description, content_html, tags, image fields
    const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const sql = `
      SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, tags, seo_description
      FROM articles
      WHERE (
        title LIKE ? ESCAPE '\\' OR
        subtitle LIKE ? ESCAPE '\\' OR
        seo_description LIKE ? ESCAPE '\\' OR
        content_html LIKE ? ESCAPE '\\' OR
        tags LIKE ? ESCAPE '\\' OR
        image_url LIKE ? ESCAPE '\\' OR
        image_alt LIKE ? ESCAPE '\\' OR
        content_html LIKE ? ESCAPE '\\' -- also search media filenames/iframe srcs inside content_html
      )
      ORDER BY published_at DESC
      LIMIT 100
    `;
    const { results } = await env.DB.prepare(sql).bind(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard).all();
    return Response.json(results);
  } catch (err) {
    return Response.json([]);
  }
}