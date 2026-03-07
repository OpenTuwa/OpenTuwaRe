export async function onRequestGet(context) {
  const { env, params, request } = context;
  try {
    const slug = params.slug;
    const { results } = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).all();
    if (!results || results.length === 0) return new Response('Not found', { status: 404 });
    const article = results[0];

    // Try to find a direct MP4 in content_html or dedicated field
    const htmlContent = (article.content_html || '').toString();
    let videoSrc = '';
    let sMatch = htmlContent.match(/<video\b[^>]*\bsrc=["']([^"']+)["']/i);
    if (sMatch && sMatch[1]) videoSrc = sMatch[1];
    if (!videoSrc) {
      sMatch = htmlContent.match(/<source\b[^>]*\bsrc=["']([^"']+)["']/i);
      if (sMatch && sMatch[1]) videoSrc = sMatch[1];
    }
    // Also allow an explicit video_url column
    if (!videoSrc && article.video_url) videoSrc = article.video_url;

    if (!videoSrc) return new Response('No video', { status: 404 });

    // Normalize protocol-relative URLs
    if (videoSrc.startsWith('//')) videoSrc = 'https:' + videoSrc;

    const origin = new URL(request.url).origin;
    const title = article.title || 'Video';

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${escapeHtml(title)} — Player</title>
      <meta name="robots" content="noindex,nofollow">
      <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh}video{width:100%;height:100%;max-width:1280px;max-height:720px}</style>
    </head><body>
      <video controls playsinline controlsList="nodownload" preload="metadata" src="${escapeHtml(videoSrc)}"></video>
    </body></html>`;

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
