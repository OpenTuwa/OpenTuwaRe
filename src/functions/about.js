export async function onRequestGet(context) {
  const { request } = context;

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
  <style>
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; }
    h1 { border-bottom: 1px solid #222; padding-bottom: 1.5rem; margin-bottom: 2rem; font-size: 2.5rem; }
    h2 { font-size: 1.75rem; margin-top: 2.5rem; margin-bottom: 1rem; color: #f0f0f0; }
    .content-section { margin-bottom: 2rem; }
    p { margin-bottom: 1.5rem; font-size: 1.1rem; color: #ccc; }
    .lead { font-size: 1.3rem; font-weight: 400; color: #fff; line-height: 1.5; margin-bottom: 2rem; }
    ul { padding-left: 1.5rem; color: #ccc; }
    li { margin-bottom: 0.75rem; }
    strong { color: #fff; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/"><strong>OpenTuwa</strong></a>
      <a href="/archive">Archive</a>
      <a href="/about">About</a>
      <a href="/legal">Legal</a>
    </nav>
  </header>
  <main>
    <h1>About OpenTuwa</h1>
    
    <div class="content-section">
      <p class="lead"><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. We are built for deep thought, not fast cycles.</strong></p>
      
      <p>In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism and rigorous intellectual inquiry. Our mission is to surface stories that challenge assumptions, expand worldviews, and provide the context often missing from the daily news cycle.</p>
    </div>

    <div class="content-section">
      <h2>Our Core Values</h2>
      <ul>
        <li><strong>Independence:</strong> We are reader-supported and free from corporate influence.</li>
        <li><strong>Depth:</strong> We value comprehensive analysis over hot takes.</li>
        <li><strong>Transparency:</strong> Our algorithms and editorial processes are open and accountable.</li>
        <li><strong>Global Perspective:</strong> We seek voices from across the globe, not just the usual power centers.</li>
      </ul>
    </div>

    <div class="content-section">
      <h2>The Project</h2>
      <p>OpenTuwa started as a personal initiative to cut through the noise. Most of the internet is focused on fast reactions and daily news cycles. This platform is built for the opposite: stepping back and taking the time to write, research, and think deeply about history, society, and philosophy.</p>
      <p>It is a ground-up, independent project. There is no corporate backing or massive editorial board behind this—just a dedication to exploring concepts thoroughly through articles and contextual media.</p>
    </div>

    <div class="content-section">
      <h2>An Open Platform</h2>
      <p>The "Open" in OpenTuwa means exactly that. While it began as a solo effort, the architecture of this site is built to host multiple voices.</p>
      <p>It is an open space for independent writers, researchers, and creators who want to publish their articles or share their media. By bringing together different contributors over time, the goal is to build a modest but rigorous library of critical thought.</p>
    </div>

    <div class="content-section">
      <h2>Neural Gravity</h2>
      <p>Our "Neural Gravity" recommendation engine is designed to break filter bubbles, balancing popularity with intellectual density. We prioritize content that demonstrates depth, nuance, and factual integrity over sensationalism.</p>
    </div>

  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} OpenTuwa. All rights reserved.</p>
    <p>
      <a href="/">Home</a> | 
      <a href="/about">About</a> | 
      <a href="/legal">Legal</a>
    </p>
  </footer>
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
