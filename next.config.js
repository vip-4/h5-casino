/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.yourgame.com'
      }
    ]
  }
};

module.exports = nextConfig;