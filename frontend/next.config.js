/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile images
  },
}

module.exports = nextConfig
