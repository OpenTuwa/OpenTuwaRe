// Google Indexing API ping endpoint
// POST /api/index-ping
// Body: { url: string, type: 'URL_UPDATED' | 'URL_DELETED' }
// Auth: Uses GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY from Cloudflare Secrets
// Generates a short-lived JWT to authenticate with Google's Indexing API.

const GOOGLE_INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

// ─── JWT helpers (Web Crypto API — available in Workers) ─────────────────────

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds and signs a JWT for Google service-account auth.
 * @param {string} clientEmail
 * @param {string} privateKeyPem  - PEM string (with or without header/footer)
 * @returns {Promise<string>}     - signed JWT
 */
async function buildJwt(clientEmail, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64  = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Strip PEM headers/footers and decode
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    enc.encode(signingInput)
  );

  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Exchanges a signed JWT for a short-lived Google OAuth2 access token.
 */
async function getAccessToken(clientEmail, privateKeyPem) {
  const jwt = await buildJwt(clientEmail, privateKeyPem);

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { env, request } = context;

  // CORS preflight passthrough

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { url, type } = body ?? {};

  if (!url || typeof url !== 'string') {
    return json({ error: 'Missing or invalid "url" field' }, 400);
  }
  if (!url.startsWith('https://opentuwa.com/')) {
    return json({ error: 'URL not allowed — must be an opentuwa.com URL' }, 403);
  }
  if (type !== 'URL_UPDATED' && type !== 'URL_DELETED') {
    return json({ error: '"type" must be URL_UPDATED or URL_DELETED' }, 400);
  }

  const clientEmail = env.GOOGLE_CLIENT_EMAIL;
  const privateKey  = env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return json({ error: 'Google credentials not configured' }, 500);
  }

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);

    const pingRes = await fetch(GOOGLE_INDEXING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type }),
    });

    const pingBody = await pingRes.json();

    if (!pingRes.ok) {
      return json({ error: 'Google Indexing API error', details: pingBody }, pingRes.status);
    }

    return json({ success: true, result: pingBody });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
