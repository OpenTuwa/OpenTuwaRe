import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request) {
  const { env } = getRequestContext();
  
  // Import the Cloudflare function
  const { onRequestGet } = await import('../../../../functions/api/recommendations.js');
  
  // Create context matching Cloudflare Pages Functions format
  const context = {
    request,
    env
  };
  
  return onRequestGet(context);
}
