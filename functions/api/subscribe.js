export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) return new Response("Invalid", { status: 400 });
    await env.DB.prepare("INSERT INTO subscribers (email) VALUES (?)").bind(email).run();
    return Response.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return Response.json({ success: true, message: "Already subscribed!" });
    return new Response("Error", { status: 500 });
  }
}