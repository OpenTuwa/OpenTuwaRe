import { isBot } from './_utils/bot-detector.js';

const PAGE_TITLE = 'About OpenTuwa | Independent Journalism';
const PAGE_DESC = 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_512.png';
const CANONICAL = 'https://opentuwa.com/about';

export async function onRequestGet(context) {
  const { request } = context;

  if (!isBot(request)) {
    return context.next();
  }

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${PAGE_TITLE}</title>
  <meta name="description" content="${PAGE_DESC}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${CANONICAL}">
  <meta property="og:title" content="${PAGE_TITLE}">
  <meta property="og:description" content="${PAGE_DESC}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${CANONICAL}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${PAGE_TITLE}">
  <meta name="twitter:description" content="${PAGE_DESC}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <meta name="twitter:site" content="@opentuwa">
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; }
    main { max-width: 900px; margin: 0 auto; }
    h1 { color: #fff; border-bottom: 1px solid #222; padding-bottom: 1.5rem; font-size: 2.5rem; }
    h2 { color: #f0f0f0; margin-top: 2rem; }
    p { font-size: 1.1rem; line-height: 1.6; }
    ul { padding-left: 1.5rem; margin-bottom: 2rem; }
    nav a { color: #fff; font-weight: bold; text-decoration: none; font-size: 1.5rem; }
  </style>
</head>
<body>
  <main>
    <nav><a href="/">OpenTuwa</a></nav>
    <h1>About OpenTuwa</h1>
    <p><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.</strong></p>
    <p>In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism.</p>
    <h2>Our Core Values</h2>
    <ul>
      <li><strong>Independence:</strong> Reader-supported.</li>
      <li><strong>Depth:</strong> Comprehensive analysis.</li>
      <li><strong>Transparency:</strong> Open algorithms.</li>
    </ul>
    <footer style="margin-top:4rem; font-size:0.8rem; color:var(--muted);">
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media. <a href="/legal" style="color:var(--muted);">Legal</a> | <a href="/archive" style="color:var(--muted);">Archive</a></p>
    </footer>
  </main>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
