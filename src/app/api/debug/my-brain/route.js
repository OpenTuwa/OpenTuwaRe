import { NextResponse } from 'next/server';

// REQUIRED BY CLOUDFLARE PAGES: Forces Next.js to build this for the Edge V8 isolate
export const runtime = 'edge';

export async function GET(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'test_user';
  const kvKey = `user_vector:${userId}`;

  try {
    // In Next.js Edge Runtime on Cloudflare, bindings are usually exposed on process.env
    // Ensure "BRAIN_KV" matches the exact KV binding name in your Cloudflare Dashboard/wrangler.toml
    const brainKv = process.env.BRAIN_KV;

    if (!brainKv) {
      return NextResponse.json({ 
        status: "error", 
        message: "BRAIN_KV binding is missing! Please make sure your KV namespace is bound to your Cloudflare Pages project." 
      }, { status: 500 });
    }

    // Fetch the brain vector from Cloudflare KV
    const userVector = await brainKv.get(kvKey, "json");

    if (!userVector) {
      return NextResponse.json({
        status: "empty",
        message: `No brain vector found for user: ${userId}. They need to read or share an article first to initialize their brain!`,
        dimensions: 0,
        vector_preview: []
      });
    }

    // Math proofs to show the AI is mutating
    const nonZeroCount = userVector.filter(v => v !== 0).length;
    const averageWeight = userVector.reduce((a, b) => a + b, 0) / userVector.length;

    return NextResponse.json({
      status: "active",
      user_id: userId,
      dimensions: userVector.length, 
      active_nodes: nonZeroCount,
      average_weight: averageWeight.toFixed(6),
      vector_preview_start: userVector.slice(0, 5),
      vector_preview_end: userVector.slice(-5)
    });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}