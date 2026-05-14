// Edge-runtime Sentry config (middleware + edge routes). Loaded via
// instrumentation.ts. Same no-op-without-DSN pattern as the server config.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}
