export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  try {
    if (!env || !env.DB) throw new Error('DB not configured');
    if (!name) return Response.json({ error: 'Missing author name' }, { status: 400 });

    const { results } = await env.DB.prepare(
      "SELECT * FROM authors WHERE LOWER(name) = LOWER(?)"
    ).bind(name).all();

    if (!results || results.length === 0) {
      // If no dedicated author row, try to derive a minimal author object from articles
      try {
        const { results: artResults } = await env.DB.prepare(
          "SELECT author, image_url FROM articles WHERE LOWER(author) = LOWER(?) LIMIT 1"
        ).bind(name).all();

        if (artResults && artResults.length > 0) {
          const a = artResults[0];
          const avatar_url = a.image_url || '';
          const minimal = { name: name, role: null, bio: null, avatar_url, social_link: null };
          return Response.json(minimal);
        }
      } catch (e) {
        // ignore and fall through to generic fallback
      }

      // Return a neutral JSON fallback (200) so frontend can render safe defaults
      const fallbackNotFound = {
        name: name,
        role: null,
        bio: null,
        avatar_url: '',
        social_link: null
      };
      return Response.json(fallbackNotFound, { status: 200 });
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