/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverMinification: true,
  },
  reactStrictMode: true,
}

module.exports = nextConfig
