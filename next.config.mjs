/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow Playwright / local tooling that may hit the dev server via 127.0.0.1.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
