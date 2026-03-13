export async function onRequestGet(context) {
  const title = 'Legal | OpenTuwa';
  const description = 'Terms of Service, Privacy Policy, and Legal Disclaimers for OpenTuwa.';

  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">Legal Information</h1>
      <div style="color:#e1e1e1; font-family:Inter, sans-serif;">
        <div style="margin-bottom:3rem;">
          <h2 style="color:#f0f0f0; font-size:1.5rem;">Terms of Service</h2>
          <p>Effective as of: August 26, 2025</p>
          <p>Welcome to OpenTuwa...</p>
        </div>
        <div>
          <h2 style="color:#f0f0f0; font-size:1.5rem;">Privacy Policy</h2>
          <p>At OpenTuwa, we believe in data minimization...</p>
        </div>
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
