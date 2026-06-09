'use client'

// /reset-password?token=... — form that POSTs to /api/auth/reset to set
// a new password using the token from the email. Token is opaque to the
// client; server validates HMAC + expiry.

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, Check } from 'lucide-react'

function ResetForm() {
  const router = useRouter()
  const search = useSearchParams()
  const token = search.get('token') || ''
  // Preserve the original destination (e.g. a shared-project link) so we
  // forward there after sign-in instead of dropping the user on a blank app.
  const rawCb = search.get('callbackUrl') || ''
  const callbackUrl = rawCb.startsWith('/') && !rawCb.startsWith('//') ? rawCb : ''
  const loginHref = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (!token) {
      setError('Missing reset token. Open the link from your email again.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setDone(true)
      // Give the success state a beat before forwarding to sign-in.
      setTimeout(() => router.push(loginHref), 1800)
    } catch (err: any) {
      setError(err?.message || 'Could not reset password. Try requesting a new link.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-100">
            <div className="font-medium">Password updated.</div>
            <div className="text-emerald-200/70 mt-1">Sending you to sign in…</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-zinc-400 mb-1.5 block">New password</span>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-zinc-400 mb-1.5 block">Confirm password</span>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter the new password"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
        />
      </label>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !password || !confirm}
        className="w-full px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
        ) : (
          'Set new password'
        )}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Choose something you'll remember. Minimum 8 characters.
          </p>
          <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
