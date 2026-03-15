export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, subtitle, seo_description, content_html, image_url, image_alt,
              author, published_at, updated_at, section, category, category_slug,
              tags, read_time_minutes, is_breaking, available_translations
       FROM articles WHERE slug = ?`
    ).bind(params.slug).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: "Article not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(results[0]), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(`Error fetching article ${params.slug}:`, err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}