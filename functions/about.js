import { isBot } from './_utils/bot-detector.js';

export async function onRequestGet(context) {
  const { request } = context;

  if (!isBot(request)) {
    return context.next();
  }

  const url = new URL(request.url);
  const title = 'About OpenTuwa | Independent Journalism';
  const description = 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.';
  const siteUrl = url.origin;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    'name': 'About OpenTuwa',
    'description': description,
    'url': `${siteUrl}/about`,
    'mainEntity': {
      '@type': 'Organization',
      'name': 'OpenTuwa',
      'foundingDate': '2023',
      'url': siteUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/img/logo.png`
      }
    }
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(siteUrl)}/about">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${escapeHtml(siteUrl)}/about">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <main style="font-family:Georgia,serif;max-width:800px;margin:4rem auto;padding:1rem;">
    <h1>About OpenTuwa</h1>
    <p>${escapeHtml(description)}</p>
    <p>
      OpenTuwa is dedicated to independent journalism, deep research, and exploring the foundational ideas that shape our world. 
      We believe in slow news, critical thinking, and the power of well-crafted stories.
    </p>
    <hr>
    <p><a href="/">Back to Home</a></p>
  </main>
</body>
</html>`;

  return new Response(html, {
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
