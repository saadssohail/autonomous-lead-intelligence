/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployments
  experimental: {
    // Optimize for AWS Lambda/Fargate
    serverMinification: true,
  },
  reactStrictMode: true,
}

module.exports = nextConfig
