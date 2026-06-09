'use client'

import { useState, useEffect } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { WebstewLogo } from '@/components/brand/WebstewLogo'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  // Honor either ?callbackUrl= (NextAuth's own param) or ?next= (used by our
  // middleware redirects). Validated to be same-origin to prevent open redirect.
  const rawNext = searchParams.get('callbackUrl') || searchParams.get('next') || '/workspace'
  const callbackUrl = rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/workspace'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  // Hide OAuth buttons for providers that aren't configured server-side.
  const [availableProviders, setAvailableProviders] = useState<Set<string>>(new Set())
  // In-page error from a redirect:false credentials sign-in (the URL `error`
  // param only covers OAuth redirects). EMAIL_NOT_VERIFIED gets special UI.
  const [loginError, setLoginError] = useState<string | null>(null)
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent'>('idle')

  useEffect(() => {
    getProviders().then(p => {
      if (p) setAvailableProviders(new Set(Object.keys(p)))
    }).catch(() => {})
  }, [])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('credentials')
    setLoginError(null)
    setResend('idle')
    try {
      // redirect:false so we can read the authorize() error — NextAuth
      // surfaces the thrown message (e.g. EMAIL_NOT_VERIFIED) here.
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok && !res.error) {
        window.location.href = callbackUrl
        return
      }
      setLoginError(res?.error || 'CredentialsSignin')
    } catch (err) {
      console.error(err)
      setLoginError('CredentialsSignin')
    } finally {
      setIsLoading(null)
    }
  }

  // Resend the verification email — needed because a gated-out user has no
  // session, so /api/auth/verify accepts the email in the body for this case.
  const handleResendVerification = async () => {
    if (!email.trim()) {
      setLoginError('Enter your email above first, then resend.')
      return
    }
    setResend('sending')
    try {
      await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setResend('sent')
    } catch {
      setResend('idle')
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <WebstewLogo size="sm" isDark={false} className="dark:hidden" />
          <WebstewLogo size="sm" isDark={true} className="hidden dark:inline-flex" />
        </Link>

        {/* Card */}
        <div className="bg-white border border-slate-200 shadow-xl shadow-slate-900/5 dark:bg-zinc-900/80 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-none rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <WebstewLogo size="md" isDark={false} className="dark:hidden" />
              <WebstewLogo size="md" isDark={true} className="hidden dark:inline-flex" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-500 dark:text-zinc-400">Sign in to keep building.</p>
          </div>

          {/* Error message — surface NextAuth's error code so we can debug
              what's actually failing instead of hiding it behind "An error
              occurred". Common codes:
              - CredentialsSignin: wrong email/password
              - OAuthAccountNotLinked: an account with this email already
                exists but was created with a different sign-in method
              - OAuthSignin/OAuthCallback: OAuth provider rejected the request
                (most often: callback URL on the OAuth app doesn't match the
                deployed URL, or env vars not set on the server)
              - Configuration: NextAuth itself is misconfigured (NEXTAUTH_SECRET,
                NEXTAUTH_URL, or DB unreachable)
              - Default: catch-all */}
          {/* Unverified email — a distinct, friendly state with a resend
              action, not a red "error". The login authorize() throws
              EMAIL_NOT_VERIFIED for accounts that signed up but haven't
              clicked their verification link. */}
          {(loginError === 'EMAIL_NOT_VERIFIED') && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
              <div className="font-medium mb-1">Verify your email to sign in</div>
              <div className="text-xs leading-relaxed">
                When you signed up we emailed you a verification link. Click it,
                then sign in. Didn&apos;t get it? Check spam, or resend below.
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resend !== 'idle'}
                className="mt-2 text-xs font-semibold underline underline-offset-2 disabled:opacity-60"
              >
                {resend === 'sent'
                  ? 'Verification email sent ✓'
                  : resend === 'sending'
                    ? 'Sending…'
                    : 'Resend the verification email'}
              </button>
            </div>
          )}

          {(() => { const shown = (loginError && loginError !== 'EMAIL_NOT_VERIFIED') ? loginError : (loginError ? null : error); return shown && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <div className="font-medium mb-1">
                {(shown === 'CredentialsSignin' || shown === 'Invalid email or password') && 'Invalid email or password'}
                {shown === 'OAuthAccountNotLinked' && 'This email is already registered with a different sign-in method'}
                {(shown === 'OAuthSignin' || shown === 'OAuthCallback') && 'OAuth provider rejected the sign-in'}
                {shown === 'Configuration' && 'Server misconfigured — contact admin'}
                {shown === 'AccessDenied' && 'Access denied'}
                {shown === 'auth_callback_failed' && 'Authentication failed. Please try again.'}
                {!['CredentialsSignin','Invalid email or password','OAuthAccountNotLinked','OAuthSignin','OAuthCallback','Configuration','AccessDenied','auth_callback_failed'].includes(shown) && 'Sign-in failed'}
              </div>
              <div className="text-xs text-red-500/80 dark:text-red-400/70 font-mono">
                Error code: {shown}
              </div>
              {(shown === 'OAuthSignin' || shown === 'OAuthCallback' || shown === 'Configuration') && (
                <div className="text-xs text-red-500/90 dark:text-red-400/80 mt-2 leading-relaxed">
                  Likely fix: confirm the OAuth callback URL on the provider matches{' '}
                  <code className="px-1 py-0.5 bg-red-500/10 rounded">https://&lt;your-domain&gt;/api/auth/callback/&lt;provider&gt;</code>
                  {' '}and that GITHUB_ID / GITHUB_SECRET (or Google equivalents) are set on the server.
                </div>
              )}
            </div>
          ) })()}

          {/* OAuth Buttons — only render configured providers */}
          {(availableProviders.has('google') || availableProviders.has('github')) && (
            <div className="space-y-3 mb-6">
              {availableProviders.has('google') && (
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 dark:bg-white dark:hover:bg-zinc-100 dark:border-transparent font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              )}

              {availableProviders.has('github') && (
                <button
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isLoading === 'github' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  )}
                  Continue with GitHub
                </button>
              )}
            </div>
          )}

          {/* Divider — only when OAuth buttons render above */}
          {(availableProviders.has('google') || availableProviders.has('github')) && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 dark:bg-zinc-900 dark:text-zinc-500">or continue with email</span>
            </div>
          </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400">Password</label>
                <Link
                  href={`/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-xs text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading !== null || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'credentials' ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
