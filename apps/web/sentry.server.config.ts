// Server-side Sentry config. Loaded via instrumentation.ts when the Node
// runtime starts. No-ops when SENTRY_DSN is unset so dev / preview deploys
// without a Sentry project still work.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    // Trace ~10% of server requests so the perf tab has signal without
    // burning the quota on every health-check.
    tracesSampleRate: 0.1,
    // Don't ship local source paths into the report.
    sendDefaultPii: false,
    ignoreErrors: [
      // Anon paywall + rate-limit responses are normal traffic, not errors.
      'Authentication required',
      'Rate limit exceeded',
    ],
  })
}
