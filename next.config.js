/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable in development for faster builds
  swcMinify: true,
  // Configure to use src directory
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  env: {
    NEXT_PUBLIC_CART_API_BASE_URL: process.env.NEXT_PUBLIC_CART_API_BASE_URL || 'http://localhost:3000',
  },
  // Optimize for development
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev }) => {
      if (dev) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    }
  }),
  // Configure for production deployment
  output: 'standalone',
  // Add any other configuration options
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig