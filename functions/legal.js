import { isBot } from './_utils/bot-detector.js';

const PAGE_TITLE = 'Legal | OpenTuwa';
const PAGE_DESC = 'Terms of Service, Privacy Policy, and Legal Disclaimers for OpenTuwa.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_512.png';
const CANONICAL = 'https://opentuwa.com/legal';
const FEED_URL = 'https://opentuwa.com/feed.xml';

export async function onRequestGet(context) {
  const { request } = context;

  if (!isBot(request)) {
    return context.next();
  }

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${PAGE_TITLE}</title>
  <meta name="description" content="${PAGE_DESC}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${CANONICAL}">
  <link rel="alternate" type="application/rss+xml" title="OpenTuwa RSS Feed" href="${FEED_URL}">
  <meta property="og:site_name" content="OpenTuwa">
  <meta property="og:title" content="${PAGE_TITLE}">
  <meta property="og:description" content="${PAGE_DESC}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${CANONICAL}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@opentuwa">
  <meta name="twitter:title" content="${PAGE_TITLE}">
  <meta name="twitter:description" content="${PAGE_DESC}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <style>
    :root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#a1a1aa}
    *{box-sizing:border-box}
    body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.6;margin:0;padding:2rem}
    main{max-width:900px;margin:0 auto}
    h1{color:#fff;border-bottom:1px solid #222;padding-bottom:1.5rem;font-size:2.5rem}
    h2{color:#f0f0f0;font-size:1.5rem;margin-top:2rem}
    p{font-size:1.05rem;line-height:1.6}
    nav a{color:#fff;font-weight:700;text-decoration:none;font-size:1.5rem}
    footer{margin-top:4rem;font-size:.8rem;color:var(--muted)}
    footer a{color:var(--muted)}
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site navigation">
      <a href="/" aria-label="OpenTuwa home">OpenTuwa</a>
    </nav>
    <h1>Legal Information</h1>
    <div>
      <h2>Terms of Service</h2>
      <p>Effective as of: August 26, 2025</p>
      <p>Welcome to OpenTuwa. By accessing or using this platform, you agree to these terms.</p>
      <h2>Privacy Policy</h2>
      <p>At OpenTuwa, we believe in data minimization and reader privacy. We collect only what is necessary to operate the service.</p>
    </div>
    <footer>
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
        <a href="/about">About</a> |
        <a href="/archive">Archive</a> |
        <a href="/feed.xml">RSS Feed</a>
      </p>
    </footer>
  </main>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
