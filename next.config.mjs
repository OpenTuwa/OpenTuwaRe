import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// This allows you to use D1, Vectorize, and AI locally when running `npm run dev`
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
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