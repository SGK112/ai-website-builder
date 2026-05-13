'use client'

import { useState, useEffect } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, User, Loader2, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Where to send the user after they sign up — defaults to /workspace.
  // Validated to be a same-origin path so we can't be open-redirected.
  const rawNext = searchParams.get('next') || '/workspace'
  const callbackUrl = rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/workspace'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // Track which OAuth providers are actually configured server-side. NextAuth
  // exposes them via /api/auth/providers; we hide unconfigured buttons so users
  // don't click GitHub/Google and get a silent failure.
  const [availableProviders, setAvailableProviders] = useState<Set<string>>(new Set())

  useEffect(() => {
    getProviders().then(p => {
      if (p) setAvailableProviders(new Set(Object.keys(p)))
    }).catch(() => {})
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading('credentials')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      setSuccess(true)
      // Auto sign in after signup
      setTimeout(async () => {
        await signIn('credentials', {
          email,
          password,
          callbackUrl,
        })
      }, 1500)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    setIsLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (err) {
      console.error(err)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090b] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Webstew!</h1>
          <p className="text-slate-500 dark:text-zinc-400">Signing you in…</p>
        </motion.div>
      </div>
    )
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
          Back to Webstew
        </Link>

        {/* Card */}
        <div className="bg-white border border-slate-200 shadow-xl shadow-slate-900/5 dark:bg-zinc-900/80 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-none rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join Webstew</h1>
            <p className="text-slate-500 dark:text-zinc-400">
              Save the site you just built and keep iterating.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* OAuth Buttons — only render configured providers */}
          {(availableProviders.has('google') || availableProviders.has('github')) && (
            <div className="space-y-3 mb-6">
              {availableProviders.has('google') && (
                <button
                  onClick={() => handleOAuthSignup('google')}
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
                  onClick={() => handleOAuthSignup('github')}
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
                <span className="px-4 bg-white text-slate-500 dark:bg-zinc-900 dark:text-zinc-500">or sign up with email</span>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading !== null || !name || !email || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'credentials' ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Create Webstew account'
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">Privacy Policy</a>
          </p>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
