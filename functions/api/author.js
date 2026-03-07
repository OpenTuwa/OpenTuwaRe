export async function onRequestGet(context) {
  const { request, env } = context;
  const name = new URL(request.url).searchParams.get('name');
  if (!name || name.trim() === '') return new Response('Missing name', { status: 400 });
  try {
    // Case-insensitive lookup using COLLATE NOCASE for SQLite/D1
    const { results } = await env.DB.prepare("SELECT * FROM authors WHERE name = ? COLLATE NOCASE").bind(name).all();
    if (!results || results.length === 0) return new Response('Not found', { status: 404 });
    return Response.json(results[0]);
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}