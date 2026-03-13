import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(request) {
  const { env } = getRequestContext();
  
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: "Please enter a valid email." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      await env.DB.prepare(
        "INSERT INTO subscribers (email) VALUES (?)"
      ).bind(email).run();

      return new Response(JSON.stringify({ success: true, message: "Welcome to the Lab!" }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (dbError) {
      if (dbError.message && dbError.message.includes('UNIQUE constraint')) {
        return new Response(JSON.stringify({ success: true, message: "You are already subscribed." }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw dbError;
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error. Please try again." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
