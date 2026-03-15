export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  try {
    if (!env || !env.DB) throw new Error('DB not configured');
    if (!name) return Response.json({ error: 'Missing author name' }, { status: 400 });

    const { results } = await env.DB.prepare(
      "SELECT name, author_bio, author_image, author_twitter, author_linkedin, author_facebook, author_youtube, role FROM authors WHERE LOWER(name) = LOWER(?)"
    ).bind(name).all();

    if (!results || results.length === 0) {
      return new Response("Author not found", { status: 404 });
    }

    // Normalize common avatar fields to `avatar_url` for clients
    const row = results[0];
    const avatar_url = row.avatar_url || row.avatar || row.image_url || row.image || '';
    const normalized = { ...row, avatar_url };
    return Response.json(normalized);
  } catch (err) {
    // Fallback if DB is down or author not found
    const fallback = {
      name: name || "Guest Contributor",
      role: "Writer",
      bio: "An insightful contributor to the OpenTuwa network.",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      social_link: "#"
    };
    return Response.json(fallback);
  }
}