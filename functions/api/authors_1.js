export async function onRequestGet(context) {
  const { env, request } = context;
  const { searchParams } = new URL(request.url);
  const nameFilter = searchParams.get('name');

  try {
    if (nameFilter) {
      // 1. Fetch the specific author your React app is asking for
      const author = await env.DB.prepare(
        "SELECT name, author_bio, author_image, author_twitter, author_linkedin, author_facebook, author_youtube, role, avatar_url FROM authors WHERE name = ?"
      ).bind(nameFilter).first();

      if (!author) {
        return new Response(JSON.stringify({ error: "Author not found" }), { status: 404 });
      }

      // 2. AUTO-FIX: Map database 'avatar_url' to the 'avatar' key React wants
      // And swap the broken jsdelivr link for a working local path
      author.avatar = author.avatar_url;
      if (author.avatar && author.avatar.includes('jsdelivr')) {
        author.avatar = author.avatar.replace('https://cdn.jsdelivr.net/gh/OpenTuwa/OpenTuwaRe@main/', '/');
      }

      return Response.json(author);
    }

    // If no name is provided, return all authors as usual
    const { results } = await env.DB.prepare(
      "SELECT name, author_bio, author_image, author_twitter, author_linkedin, author_facebook, author_youtube, role, avatar_url FROM authors ORDER BY id ASC"
    ).all();
    const authors = (results || []).map(a => {
      a.avatar = a.avatar_url;
      if (a.avatar && a.avatar.includes('jsdelivr')) {
        a.avatar = a.avatar.replace('https://cdn.jsdelivr.net/gh/OpenTuwa/OpenTuwaRe@main/', '/');
      }
      return a;
    });
    return Response.json(authors);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}