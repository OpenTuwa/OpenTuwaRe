import { isBot } from './_utils/bot-detector.js';
import { buildAboutGraph } from './_utils/schema.js';
import { buildHreflangTags } from './_utils/hreflang.js';

const PAGE_TITLE = 'About OpenTuwa | Independent Journalism';
const PAGE_DESC = 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.';
const OG_IMAGE = 'https://opentuwa.com/assets/ui/web_512.png';
const CANONICAL = 'https://opentuwa.com/about';
const SITE_URL = 'https://opentuwa.com';
const FEED_URL = 'https://opentuwa.com/feed.xml';

export async function onRequestGet(context) {
  const { request } = context;

  if (!isBot(request)) {
    return context.next();
  }

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': buildAboutGraph(SITE_URL),
  });

  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="87b34ddf-45f5-47fc-8a13-87fcb9d1aa85" type="text/javascript" async></script>
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/ui/web_512.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/ui/web_512.png">
  <link rel="apple-touch-icon" href="/assets/ui/web_512.png">
  <meta name="theme-color" content="#0a0a0b">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${PAGE_TITLE}</title>
  <meta name="description" content="${PAGE_DESC}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${CANONICAL}">
  ${buildHreflangTags('/about')}
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
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root{--bg:#0a0a0b;--text:#e5e5e5;--muted:#c4c4c4;--accent:#3b82f6}
    *{box-sizing:border-box}
    body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.6;margin:0;padding:2rem}
    main{max-width:900px;margin:0 auto}
    h1{color:#fff;border-bottom:1px solid #222;padding-bottom:1.5rem;font-size:2.5rem}
    h2{color:#f0f0f0;margin-top:2rem}
    p{font-size:1.1rem;line-height:1.6}
    ul{padding-left:1.5rem;margin-bottom:2rem}
    nav a{color:#fff;font-weight:700;text-decoration:none;font-size:1.5rem}
    a{color:var(--accent)}
    footer{margin-top:4rem;font-size:.8rem;color:var(--muted)}
    footer a{color:var(--muted)}
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site navigation">
      <a href="/" aria-label="OpenTuwa home">OpenTuwa</a>
    </nav>
    <h1>About OpenTuwa</h1>

    <h2>Mission Statement</h2>
    <p>OpenTuwa started as a personal initiative to create a space for substantive journalism — long-form articles, documentaries, and deep research that the mainstream media cycle rarely accommodates.</p>
    <p><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.</strong> In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism.</p>

    <h2>Editorial Team</h2>
    <!-- TODO: Replace with real founder bio -->
    <p><strong>Haykal M. Zaidi</strong> is the founder and editor of OpenTuwa, an independent platform for long-form journalism, documentaries, and deep research.</p>
    <p>Follow on <a href="https://twitter.com/opentuwa" rel="noopener noreferrer">Twitter/X @opentuwa</a>.</p>

    <h2>Our Core Values</h2>
    <ul>
      <li><strong>Independence:</strong> Reader-supported.</li>
      <li><strong>Depth:</strong> Comprehensive analysis.</li>
      <li><strong>Transparency:</strong> Open algorithms.</li>
    </ul>

    <footer>
      <p>&copy; ${new Date().getFullYear()} OpenTuwa Media.
        <a href="/legal">Legal</a> |
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
