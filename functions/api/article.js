// functions/api/articles.js
export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.DB) throw new Error('DB not configured');

    // CRITICAL FOR SCALE: Do NOT select 'content_html' here. 
    // Only select what you need for the preview cards.
    const { results } = await env.DB.prepare(`
      SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, tags 
      FROM articles 
      ORDER BY published_at DESC 
      LIMIT 20
    `).all();

    return Response.json(results);
  } catch (err) {
    // Fallback for testing UI without DB
    const fallback = [{
      slug: "sample-article",
      title: "The Future of Open Source",
      subtitle: "How decentralized tools are changing the landscape.",
      author: "System Admin",
      published_at: new Date().toISOString(),
      read_time_minutes: 5,
      tags: "Tech,Design",
      image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
    }];
    return Response.json(fallback);
  }
}