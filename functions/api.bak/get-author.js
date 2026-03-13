export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get("name");

  if (!name) {
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  }

  try {
    // specific fetch from your new authors table
    const { results } = await env.DB.prepare(
      "SELECT * FROM authors WHERE name = ?"
    ).bind(name).all();

    if (!results || results.length === 0) {
      // Return null if author not found in specific table, frontend handles fallback
      return new Response(JSON.stringify(null), { status: 200 });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}