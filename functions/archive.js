import { isBot } from './_utils/bot-detector.js';

const PAGE_TITLE = 'Archive | OpenTuwa';
const PAGE_DESC = 'A complete timeline of all articles, documentaries, and stories published on OpenTuwa.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_512.png';
const CANONICAL = 'https://opentuwa.com/archive';

export async function onRequestGet(context) {
  const { request, env } = context;

  // Pass through to Next.js for real users
  if (!isBot(request)) {
    return context.next();
  }

  // Bot SSR: query all articles ordered by recency
  let articles = [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT title, slug, published_at FROM articles ORDER BY published_at DESC'
    ).all();
    articles = results || [];
  } catch (err) {
    articles = [];
  }

  const articleLinks = articles.map(a =>
    `<li style="padding:0.75rem 0; border-bottom:1px solid #1a1a1a; display:flex; justify-content:space-between; align-items:center;">
      <a href="/articles/${escapeHtml(a.slug)}" style="color:#fff; text-decoration:none; font-size:1.1rem;">${escapeHtml(a.title)}</a>
      <small style="color:#666; font-family:monospace; margin-left:1rem;">${a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}</small>
    </li>`
  ).join('');

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(PAGE_TITLE)}</title>
  <meta name="description" content="${escapeHtml(PAGE_DESC)}">
  <link rel="canonical" href="${CANONICAL}">
  <meta property="og:title" content="${escapeHtml(PAGE_TITLE)}">
  <meta property="og:description" content="${escapeHtml(PAGE_DESC)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${CANONICAL}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(PAGE_TITLE)}">
  <meta name="twitter:description" content="${escapeHtml(PAGE_DESC)}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; }
    main { max-width: 900px; margin: 0 auto; }
    h1 { color: #fff; font-size: 2.5rem; margin-bottom: 1rem; border-bottom: 1px solid #222; padding-bottom: 1.5rem; }
    h2 { color: #888; font-size: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #222; }
    ul { list-style: none; padding: 0; }
    nav a { color: #fff; font-weight: bold; text-decoration: none; font-size: 1.5rem; }
  </style>
</head>
<body>
  <main>
    <nav><a href="/">OpenTuwa</a></nav>
    <h1>Archive</h1>
    <p style="color:#ccc; font-size:1.2rem; margin-bottom:2rem;">${escapeHtml(PAGE_DESC)}</p>
    <ul>${articleLinks}</ul>
    <footer style="margin-top:4rem; font-size:0.8rem; color:var(--muted);">
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media. <a href="/legal" style="color:var(--muted);">Legal</a> | <a href="/about" style="color:var(--muted);">About</a></p>
    </footer>
  </main>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
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
