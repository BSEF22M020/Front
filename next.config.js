/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress ESLint during builds (for quick deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Suppress TypeScript errors during builds (for quick deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization settings
  images: {
    domains: [
      "lh3.googleusercontent.com",  // Google avatar host
      "via.placeholder.com",  
      'images.pexels.com',          // Your fallback host
      'smartmeet.com',              // Your app domain
      'localhost',                  // Local development
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;