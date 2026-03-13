export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(params.slug).all();
    if (!results || results.length === 0) return new Response("Not found", { status: 404 });
    return Response.json(results[0]);
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}