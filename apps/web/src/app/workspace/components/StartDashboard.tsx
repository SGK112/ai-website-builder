'use client'

// StartDashboard — the workspace's no-project empty state. A full-screen,
// centered build dashboard (Lovable-style): its own top bar (logo · theme ·
// projects · account), one greeting, one focal build input, starter chips, and
// recipes below. Replaces the two-pane IDE while there's nothing built; page.tsx
// unmounts it the instant a build exists. Its own top bar is required because,
// full-screen, it covers the workspace header (theme + account live here now).
//
// DESIGN: one accent (violet) + neutrals, generous whitespace, one radius.

import type { ComponentType, KeyboardEvent } from 'react'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowUp, Plus, Sparkles, Mic, Sun, Moon, FolderOpen, LogOut, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StartRecipe {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  isPremade?: boolean
}

interface StartDashboardProps {
  isDark: boolean
  userName?: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onSeedPrompt: (text: string) => void
  recipes: StartRecipe[]
  onPickRecipe: (id: string) => void
  onOpenConnectors?: () => void
  onToggleTheme?: () => void
  onViewProjects?: () => void
  busy?: boolean
}

const STARTER_CHIPS = ['Portfolio site', 'Online store', 'SaaS landing page', 'Restaurant menu', 'Mobile app']

export function StartDashboard({
  isDark, userName, value, onChange, onSubmit, onSeedPrompt,
  recipes, onPickRecipe, onOpenConnectors, onToggleTheme, onViewProjects, busy,
}: StartDashboardProps) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const name = userName || session?.user?.name || ''
  const first = name.trim().split(/\s+/)[0]
  const initials = (name.trim().split(/\s+/).map((w) => w[0]).join('') || 'U').slice(0, 2).toUpperCase()

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !busy) onSubmit()
    }
  }

  const iconBtn = cn(
    'w-9 h-9 rounded-lg grid place-items-center transition-colors',
    isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
  )

  return (
    <div className={cn('h-full flex flex-col relative overflow-hidden', isDark ? 'bg-zinc-950' : 'bg-[#FBF9F6]')}>
      {/* soft warm→violet wash confined to the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[58%]"
        style={{
          background:
            'radial-gradient(120% 90% at 72% -18%, color-mix(in srgb, #7C3AED 18%, transparent), transparent 60%), radial-gradient(90% 70% at 22% -12%, color-mix(in srgb, #F59E0B 12%, transparent), transparent 62%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 34%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 34%, transparent 100%)',
        }}
      />

      {/* ── top bar ── */}
      <div className="relative z-20 flex items-center justify-between px-4 h-14 shrink-0">
        <a href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-base shadow-sm">🍲</span>
          <span className={cn('text-[15px] font-semibold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>webstew</span>
        </a>
        <div className="flex items-center gap-1.5">
          {onViewProjects && (
            <button onClick={onViewProjects} className={cn(
              'hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium transition-colors',
              isDark ? 'text-zinc-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'
            )}>
              <FolderOpen className="w-4 h-4" /> Projects
            </button>
          )}
          {onToggleTheme && (
            <button onClick={onToggleTheme} className={iconBtn} aria-label="Toggle theme">
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
          )}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account"
                className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-semibold bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm"
              >
                {initials}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className={cn(
                    'absolute right-0 mt-2 w-44 rounded-xl border shadow-lg z-20 overflow-hidden',
                    isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
                  )}>
                    <div className={cn('px-3 py-2.5 text-xs border-b truncate', isDark ? 'border-white/10 text-zinc-400' : 'border-slate-100 text-slate-500')}>
                      {session.user.email || name}
                    </div>
                    <a href="/profile" className={cn('flex items-center gap-2 px-3 py-2.5 text-sm', isDark ? 'text-zinc-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}>
                      <UserIcon className="w-4 h-4" /> Profile
                    </a>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm', isDark ? 'text-zinc-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}>
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <a href="/login" className={cn('px-3 h-9 grid place-items-center rounded-lg text-[13px] font-medium', isDark ? 'text-zinc-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5')}>Log in</a>
              <a href="/signup" className="px-3.5 h-9 grid place-items-center rounded-lg text-[13px] font-semibold bg-violet-600 hover:bg-violet-700 text-white">Sign up</a>
            </div>
          )}
        </div>
      </div>

      {/* ── scrollable body: hero centered, recipes below ── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* hero — vertically centered in the available space */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-4 pb-8">
            {onOpenConnectors && (
              <button
                onClick={onOpenConnectors}
                className={cn(
                  'inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[13px] font-medium mb-7 transition-colors',
                  isDark ? 'bg-white/[0.04] border-white/10 text-zinc-200 hover:bg-white/[0.07]' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                Connect your tools
                <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>→</span>
              </button>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className={cn('text-center font-semibold tracking-[-0.03em] leading-[1.03] text-[clamp(28px,4vw,44px)] mb-7', isDark ? 'text-white' : 'text-slate-900')}
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Let&apos;s cook something{first ? <>, <span className="text-violet-600 dark:text-violet-400">{first}</span></> : ''}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
              className="w-full max-w-2xl"
            >
              <div className={cn(
                'rounded-[20px] border p-4 transition-shadow focus-within:ring-4',
                isDark
                  ? 'bg-zinc-900 border-white/10 focus-within:border-violet-500/50 focus-within:ring-violet-500/15'
                  : 'bg-white border-slate-200 shadow-[0_2px_4px_rgba(28,25,23,0.05),0_18px_40px_-16px_rgba(28,25,23,0.2)] focus-within:border-violet-300 focus-within:ring-violet-100'
              )}>
                <textarea
                  rows={1} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKey}
                  placeholder="Describe the site or app you want — the chef will cook it."
                  className={cn('w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none min-h-[46px]', isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400')}
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('w-8 h-8 rounded-lg border grid place-items-center', isDark ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-400')} aria-hidden>
                    <Plus className="w-4 h-4" />
                  </span>
                  <div className="flex-1" />
                  <span className={cn('hidden sm:grid place-items-center w-8 h-8', isDark ? 'text-zinc-400' : 'text-slate-400')} aria-hidden><Mic className="w-4 h-4" /></span>
                  <button
                    onClick={onSubmit} disabled={!value.trim() || busy} aria-label="Build it"
                    className={cn('w-9 h-9 rounded-full grid place-items-center shrink-0 transition-all',
                      value.trim() && !busy ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 hover:scale-105' : isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-400')}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {STARTER_CHIPS.map((c) => (
                  <button key={c} onClick={() => onSeedPrompt(`Build a ${c.toLowerCase()}`)}
                    className={cn('text-[12.5px] rounded-full border px-3.5 py-1.5 transition-colors',
                      isDark ? 'border-white/10 text-zinc-400 hover:text-white hover:border-violet-400/40' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-violet-300 bg-white/70')}>
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* recipes — pinned below the centered hero, always in view on load */}
          {recipes.length > 0 && (
            <div className="w-full max-w-3xl mx-auto px-6 pb-10">
              <p className={cn('text-[10.5px] font-semibold uppercase tracking-[0.09em] mb-3', isDark ? 'text-zinc-500' : 'text-slate-500')}>Start from a recipe</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recipes.slice(0, 4).map((r) => {
                  const Icon = r.icon
                  return (
                    <button key={r.id} onClick={() => onPickRecipe(r.id)}
                      className={cn('group relative text-left rounded-2xl border p-3.5 transition-all',
                        isDark ? 'bg-white/[0.03] border-white/[0.06] hover:border-violet-400/40 hover:bg-violet-500/[0.06]' : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-md')}>
                      {r.isPremade && (
                        <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 text-[8px] font-bold tracking-wider rounded bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30">INSTANT</span>
                      )}
                      <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 grid place-items-center mb-2.5"><Icon className="w-4 h-4" /></span>
                      <span className={cn('block text-[13px] font-medium', isDark ? 'text-white' : 'text-slate-800')}>{r.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
