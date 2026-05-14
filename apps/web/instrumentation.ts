// Next.js 13.4+ entry point for runtime instrumentation. Loaded once at
// server startup. Branches on runtime so the right Sentry SDK init runs.
// See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captures errors thrown inside Server Components / Server Actions /
// route handlers and forwards them to Sentry's Node SDK.
export { captureRequestError as onRequestError } from '@sentry/nextjs'
