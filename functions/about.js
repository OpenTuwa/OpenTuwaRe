import { isBot } from './_utils/bot-detector.js';
import { buildAboutGraph } from './_utils/schema.js';
import { buildHreflangTags } from './_utils/hreflang.js';
import { buildHead } from './_utils/head.js';
import { SITE_URL, OG_IMAGE } from './_utils/constants.js';

const PAGE_TITLE = 'About OpenTuwa | Independent Journalism';
const PAGE_DESC = 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.';
const CANONICAL = 'https://opentuwa.com/about';

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
  ${buildHead({
    title: PAGE_TITLE,
    desc: PAGE_DESC,
    canonical: CANONICAL,
    hreflang: buildHreflangTags('/about'),
    ogType: 'website',
    ogImage: OG_IMAGE,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    twitterCard: 'summary_large_image',
    jsonLd,
    cssVariant: 'list',
  })}
</head>
<body>
  <nav>
    <a href="/" class="brand" aria-label="OpenTuwa home">OpenTuwa</a>
  </nav>
  <div class="list-wrap">
    <h1>About OpenTuwa</h1>

    <h2>Mission Statement</h2>
    <p>OpenTuwa started as a personal initiative to create a space for substantive journalism — long-form articles, documentaries, and deep research that the mainstream media cycle rarely accommodates.</p>
    <p><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.</strong> In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism.</p>

    <h2>Editorial Team</h2>
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
  </div>
</body>
</html>`;

  return new Response(botHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
