'use client'

// /forgot-password — minimal email form. POSTs to /api/auth/forgot which
// always returns 200 (anti-enumeration). User sees the same "check your
// inbox" success regardless of whether the address actually has an account.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Preserve where the user was headed (e.g. a shared-project link) through the
  // reset detour. Read from the URL on mount (window, not useSearchParams, to
  // avoid the Suspense-boundary requirement).
  const [callbackUrl, setCallbackUrl] = useState('/workspace')
  useEffect(() => {
    const cb = new URLSearchParams(window.location.search).get('callbackUrl')
    if (cb && cb.startsWith('/') && !cb.startsWith('//')) setCallbackUrl(cb)
  }, [])
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), callbackUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href={loginHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/80 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the email you signed up with. We'll send a reset link if an account exists.
          </p>

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800 dark:text-emerald-100">
                  <div className="font-medium">Check your inbox</div>
                  <div className="text-emerald-700/70 dark:text-emerald-200/70 mt-1">
                    If <span className="font-mono">{email}</span> has an account, a reset link is on its way. The link expires in 1 hour.
                  </div>
                </div>
              </div>
              <Link
                href={loginHref}
                className="block text-center px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground text-sm font-medium border border-border"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                />
              </label>

              {error && (
                <div className="text-sm text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
