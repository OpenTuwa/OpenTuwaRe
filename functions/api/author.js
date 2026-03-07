export async function onRequestGet(context) {
  const { request, env } = context;
  const name = new URL(request.url).searchParams.get('name');
  if (!name || name.trim() === '') return new Response('Missing name', { status: 400 });
  try {
    // Case-insensitive lookup using LOWER() to be compatible across SQLite/D1
    const { results } = await env.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(name).all();
    if (!results || results.length === 0) return new Response('Not found', { status: 404 });

    const raw = results[0];
    // Normalize avatar/image fields so frontends can rely on `avatar_url`
    const avatar_url = raw.avatar_url || raw.avatar || raw.image_url || raw.image || '';
    const normalized = { ...raw, name: (raw.name || '').trim(), avatar_url };
    return Response.json(normalized);
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}