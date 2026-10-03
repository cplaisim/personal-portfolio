/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  agentRules: false,
  // Hides the on-screen Next.js dev badge. Compile and runtime errors are still
  // surfaced; only the indicator goes away.
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;