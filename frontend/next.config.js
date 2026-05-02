// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      // ── Add this line to proxy ALL /api/* to backend ──
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      // ── Keep existing uploads proxy ──
      {
        source: '/uploads/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/:path*`
          : 'http://localhost:5000/uploads/:path*',
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;