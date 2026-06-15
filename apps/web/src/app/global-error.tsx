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
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: '#0a0a0a',
            color: '#ededed',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>{error.message || 'An unexpected error occurred.'}</p>
          {error.digest && <p style={{ margin: 0, opacity: 0.5, fontSize: '0.85rem' }}>ID: {error.digest}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#7c3aed',
                color: '#fff',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#ededed',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
