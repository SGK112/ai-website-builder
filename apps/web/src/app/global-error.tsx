'use client'

// Root-layout-level error boundary. Catches the case where the layout
// itself throws, which the standard `error.tsx` (mounted *inside* the
// layout) can't reach. Required by @sentry/nextjs to capture every
// crash, not just route-level ones.

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{error.message || 'An unexpected error occurred.'}</p>
          {error.digest && <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>ID: {error.digest}</p>}
        </div>
      </body>
    </html>
  )
}
