/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployments
  experimental: {
    // Optimize for AWS Lambda/Fargate
    serverMinification: true,
  },
  reactStrictMode: true,
  // Expose environment variables to runtime (needed for Amplify SSR)
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEMO_MODE: process.env.DEMO_MODE,
  },
}

module.exports = nextConfig
