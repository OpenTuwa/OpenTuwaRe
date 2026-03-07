export async function onRequestGet(context) {
  const { request, env } = context;
  const name = new URL(request.url).searchParams.get('name');
  try {
    const { results } = await env.DB.prepare("SELECT * FROM authors WHERE name = ?").bind(name).all();
    if (!results || results.length === 0) return new Response("Not found", { status: 404 });
    return Response.json(results[0]);
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}