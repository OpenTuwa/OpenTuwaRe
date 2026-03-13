export async function onRequestGet(context) {
  const { request } = context;
  const title = 'About OpenTuwa | Independent Journalism';
  const description = 'OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.';

  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">About OpenTuwa</h1>
      <div style="color:#e1e1e1; font-family:Inter, sans-serif; font-size:1.1rem; line-height:1.6;">
        <p style="font-size:1.3rem; margin-bottom:2rem;"><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.</strong></p>
        <p>In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism.</p>
        <h2 style="color:#f0f0f0; margin-top:2rem;">Our Core Values</h2>
        <ul style="padding-left:1.5rem; margin-bottom:2rem;">
          <li><strong>Independence:</strong> Reader-supported.</li>
          <li><strong>Depth:</strong> Comprehensive analysis.</li>
          <li><strong>Transparency:</strong> Open algorithms.</li>
        </ul>
      </div>
    </main>
  `;

  const response = await context.next();

  if (!response.headers.get('content-type')?.includes('text/html')) {
    return new Response(innerHtml, { headers: { 'content-type': 'text/html' } });
  }

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', description); } })
    .on('div#root', { element(e) { e.setInnerContent(innerHtml, { html: true }); } })
    .transform(response);
}
