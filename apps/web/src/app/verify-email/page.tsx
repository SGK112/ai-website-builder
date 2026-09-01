'use client'

// /verify-email?token=... — landing page for the email verification link.
// Calls GET /api/auth/verify on mount, shows success / expired / invalid.

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react'

function VerifyInner() {
  const token = useSearchParams().get('token') || ''
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token in the link.')
      return
    }
    let alive = true
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!alive) return
        if (r.ok && data.ok) {
          setState('ok')
        } else {
          setState('error')
          setMessage(data.error || 'Verification failed.')
        }
      })
      .catch(() => {
        if (alive) { setState('error'); setMessage('Network error — try the link again.') }
      })
    return () => { alive = false }
  }, [token])

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl text-center">
      {state === 'loading' && (
        <>
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
          <div className="text-sm text-muted-foreground">Verifying your email…</div>
        </>
      )}
      {state === 'ok' && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Email verified ✓</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You're all set — AI site generation is unlocked.
          </p>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold"
          >
            Start building
            <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Verification failed</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground text-sm font-medium border border-border"
          >
            Back to sign in — you can resend the verification email there
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading…</div>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  )
}
