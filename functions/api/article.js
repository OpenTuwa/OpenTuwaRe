export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`
      SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, tags, seo_description 
      FROM articles ORDER BY published_at DESC LIMIT 50
    `).all();
    return Response.json(results);
  } catch (err) {
    return Response.json([]);
  }
}