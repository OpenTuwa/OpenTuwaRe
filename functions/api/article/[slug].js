export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = params.slug;

  try {
    if (!env || !env.DB) throw new Error('DB not configured');

    const { results } = await env.DB.prepare(
      "SELECT * FROM articles WHERE slug = ?"
    ).bind(slug).all();

    if (!results || results.length === 0) {
      return new Response("Article not found", { status: 404 });
    }

    return Response.json(results[0]);
  } catch (err) {
    // Upgraded FAANG-style fallback
    const fallback = {
      title: "Sample OpenTuwa Article",
      subtitle: "System Diagnostics & Fallback Mode",
      author: "System Admin",
      published_at: new Date().toISOString(),
      read_time_minutes: 2,
      tags: "System,Diagnostic",
      seo_description: "Fallback article loaded due to database unavailability.",
      image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      content_html: "<p>The article database is not available. This is a static fallback so you can view the cinematic page layout while debugging DB configuration.</p>"
    };
    return Response.json(fallback);
  }
}