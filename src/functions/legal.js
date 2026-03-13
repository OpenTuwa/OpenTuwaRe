export async function onRequestGet(context) {
  const { request } = context;

  const url = new URL(request.url);
  const title = 'Legal | OpenTuwa';
  const description = 'Terms of Service, Privacy Policy, and Legal Disclaimers for OpenTuwa.';
  const siteUrl = url.origin;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Legal',
    'description': description,
    'url': `${siteUrl}/legal`
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
  <meta property="og:url" content="${escapeHtml(siteUrl)}/legal">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${escapeHtml(siteUrl)}/legal">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background: #0a0a0b; }
    header, footer { background: #000; color: #fff; padding: 1.5rem; text-align: center; border-bottom: 1px solid #222; }
    footer { border-top: 1px solid #222; border-bottom: none; margin-top: 3rem; }
    header a, footer a { color: #fff; text-decoration: none; margin: 0 0.75rem; font-weight: 500; }
    main { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; min-height: 80vh; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; }
    h1 { border-bottom: 1px solid #222; padding-bottom: 1.5rem; margin-bottom: 2rem; font-size: 2.5rem; }
    h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #f0f0f0; border-bottom: 1px solid #222; padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #ddd; }
    .legal-section { margin-bottom: 3rem; }
    p { margin-bottom: 1.25rem; color: #ccc; }
    ul, ol { padding-left: 1.5rem; color: #ccc; margin-bottom: 1.25rem; }
    li { margin-bottom: 0.5rem; }
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
    <h1>Legal Information</h1>
    
    <div class="legal-section">
      <h2>Terms of Service</h2>
      <p><strong>Effective as of: August 26, 2025</strong></p>
      <p>Hello! Welcome to the Tuwa™ End User Agreement ("Terms") which apply when you use the Tuwa application, a brand of OpenTuwa®. These Terms govern your use of our distraction-free Quran audio streaming and reading services (the "Service").</p>
      
      <h3>1. The Service Provided by Us</h3>
      <p>Tuwa™ provides a specialized, distraction-free environment for Quran audio streaming and text reading. The Service is provided entirely free of charge. To access the full application and maintain personalized settings securely, users must authenticate prior to use.</p>
      
      <h3>2. Your Use of the Service</h3>
      <p>You agree to use the Service solely for personal, non-commercial listening and study. To protect the integrity of our platform and the rights of our content licensors, the following activities are strictly prohibited:</p>
      <ul>
        <li>Using automated tools, scrapers, or crawlers to extract audio, text, or data from the Service.</li>
        <li>Attempting to download, redistribute, or circumvent the security measures protecting our media streams.</li>
        <li>Reverse-engineering, decompiling, or attempting to bypass our application architecture or access controls.</li>
      </ul>

      <h3>3. Content and Intellectual Property Rights</h3>
      <p>The Tuwa™ platform, including its interface, design, software, and brand elements, is the proprietary intellectual property of OpenTuwa®. The audio recitations and translated texts are licensed content and remain the exclusive property of their respective owners or rights holders.</p>
      
      <h3>4. Problems and Disputes</h3>
      <p>The Service is provided on an "as is" and "as available" basis without warranties of any kind. To the maximum extent permitted by applicable law, OpenTuwa® shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the Service. This Agreement shall be governed by and construed in accordance with the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Johor, Malaysia.</p>
    </div>

    <div class="legal-section">
      <h2>Privacy Policy</h2>
      <p><strong>Effective as of: August 26, 2025</strong></p>
      <p>At Tuwa™, we believe in data minimization. This Privacy Policy outlines our strict practices regarding the limited information we process to keep our Service running securely.</p>
      
      <h3>1. Personal Data We Collect</h3>
      <ul>
        <li><strong>Information You Provide:</strong> When you utilize our search functionality, queries are processed in real-time. We do not store these search logs on our servers.</li>
        <li><strong>Security & Infrastructure Data:</strong> To secure our platform, we collect standard network data (e.g., IP address, basic device identifiers). This is processed dynamically to authorize secure media streams.</li>
        <li><strong>Authentication Data:</strong> Upon login, we receive a secure session token. We do not read, store, or process your external personal profile data, emails, or passwords.</li>
      </ul>

      <h3>2. Our Purpose for Using Data</h3>
      <p>The minimal data we interact with is strictly utilized to authenticate your secure access to the application, protect licensed audio content from unauthorized distribution, and analyze aggregate, non-identifiable usage trends to maintain server stability.</p>
      
      <h3>3. Keeping Your Data Safe</h3>
      <p>We do not sell your personal data. Infrastructure data is processed solely to operate secure hosting and authentication. We utilize industry-standard encryption (HTTPS/TLS) and strict access controls to protect all data in transit.</p>
    </div>

    <div class="legal-section">
      <h2>Algorithm & AI Disclosure</h2>
      <p><strong>BY ACCESSING OR USING THIS PLATFORM, YOU ACKNOWLEDGE AND AGREE TO THE FOLLOWING TERMS:</strong></p>
      <ol>
        <li><strong>Automated Processing:</strong> This platform utilizes an artificial intelligence-based recommendation system ("Algorithm") that analyzes available content and user interactions to generate suggestions. This process is fully automated.</li>
        <li><strong>No Liability for Output:</strong> The Algorithm may generate recommendations that are unexpected, inaccurate, or objectionable. The website operator expressly disclaims all liability for any content suggested by the Algorithm or any reliance thereon. You use this website and engage with its content at your sole discretion and risk.</li>
        <li><strong>Implied Consent:</strong> Your access constitutes your explicit consent to the data processing described in our Privacy Policy, including the use of cookies and the collection of interaction data for the purpose of training, refining, and operating the Algorithm.</li>
      </ol>
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
