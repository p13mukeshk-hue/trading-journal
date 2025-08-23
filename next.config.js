/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'tradezella.com'],
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    IEX_CLOUD_API_KEY: process.env.IEX_CLOUD_API_KEY,
  },
}

module.exports = nextConfig