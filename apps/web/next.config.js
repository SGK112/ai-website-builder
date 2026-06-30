const path = require('path')

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ai-website-builder/database", "@ai-website-builder/ai-agents", "@ai-website-builder/shared", "@ai-website-builder/deploy-utils"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Externalize pino + ffmpeg-static. ffmpeg-static MUST be external — if Next
    // bundles it, its binary-path computation points into .next/server/... where
    // the binary doesn't exist (spawn ENOENT). External → require() resolves the
    // real binary in node_modules at runtime.
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'ffmpeg-static'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // WebContainer cross-origin isolation — required for SharedArrayBuffer.
        // Scoped to the builder surfaces so the rest of the site isn't forced
        // into cross-origin isolation (which would break third-party iframes /
        // images elsewhere). `credentialless` is more permissive than
        // `require-corp` — third-party resources still load, just without
        // credentials. WebContainers supports it since v1.2.
        source: '/app-builder/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/app-builder',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // /workspace now hosts multi-target generation (Astro/Next/React/Expo)
        // which uses WebContainer for live preview — same isolation rules apply.
        source: '/workspace/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/workspace',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // (/video no longer sets COOP/COEP — rendering moved server-side, so it
      //  doesn't need SharedArrayBuffer, and the headers could complicate the
      //  cross-origin clip previews.)
    ]
  },
  // Powered by header disabled for security
  poweredByHeader: false,
  // Dev only: keep compiled pages in memory much longer so navigating away from
  // the big workspace route and back doesn't trigger a full recompile each time.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 8,
  },
}

// Wrap with Sentry only when a DSN is configured. Keeps `next build`/`next dev`
// runnable in environments (local, CI) without Sentry env vars.
const { withSentryConfig } = require('@sentry/nextjs')
const sentryEnabled = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      // Source map upload — only when SENTRY_AUTH_TOKEN is present in CI.
      // Without it the plugin no-ops gracefully and reports keep working,
      // they just won't have source-mapped stack traces.
      widenClientFileUpload: true,
      // Tunnel through our own domain so ad-blockers / privacy extensions
      // don't drop client error reports.
      tunnelRoute: '/monitoring',
      hideSourceMaps: true,
      // Tree-shake Sentry's debug logging out of the prod bundle. (Replaces the
      // deprecated top-level `disableLogger` removed in a future @sentry/nextjs.)
      webpack: {
        treeshake: {
          removeDebugLogging: true,
        },
      },
    })
  : nextConfig
