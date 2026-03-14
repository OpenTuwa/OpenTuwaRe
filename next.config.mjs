import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Configure development to use remote Cloudflare resources
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform({
    persist: { path: '.wrangler/state/v3' },
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: "export",
  images: {
    unoptimized: true
  }
};

export default nextConfig;