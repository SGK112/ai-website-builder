const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ai-website-builder/database", "@ai-website-builder/ai-agents", "@ai-website-builder/shared", "@ai-website-builder/deploy-utils"],
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

module.exports = nextConfig
