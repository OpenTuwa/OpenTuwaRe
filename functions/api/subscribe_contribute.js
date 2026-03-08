export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // 1. Parse the incoming JSON
    const { email } = await request.json();

    // 2. Basic Validation
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: "Please enter a valid email." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Insert into D1 Database
    try {
      await env.DB.prepare(
        "INSERT INTO subscribers_contribute (email) VALUES (?)"
      ).bind(email).run();

      return new Response(JSON.stringify({ success: true, message: "Welcome to the Lab!" }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (dbError) {
      // 4. Handle Duplicates (Unique Constraint)
      if (dbError.message && dbError.message.includes('UNIQUE constraint')) {
        return new Response(JSON.stringify({ success: true, message: "You are already subscribed." }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw dbError; // Re-throw other errors
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error. Please try again." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}