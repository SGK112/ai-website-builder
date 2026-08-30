'use client'

// Pick a repo from the ones the user actually has, instead of hand-typing
// "github.com/owner/repo" and hoping. Doubles as the branch picker — cloning
// the default branch when the work is on `develop` is a silent wrong answer.
//
// Falls back to a URL field: org repos the token can't list, or someone
// else's public repo, still need a way in.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, Loader2, Search, Lock, GitBranch, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalA11y } from '@/hooks/useModalA11y'

export interface RepoSummary {
  fullName: string
  owner: string
  name: string
  private: boolean
  defaultBranch: string
  description: string | null
  pushedAt: string | null
  url: string
}

interface Props {
  isDark: boolean
  open: boolean
  busy?: boolean
  title?: string
  confirmLabel?: string
  onClose: () => void
  onPick: (repoUrl: string, branch: string) => void
}

function relative(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function GithubRepoPicker({
  isDark, open, busy = false, title = 'Choose a repository',
  confirmLabel = 'Import', onClose, onPick,
}: Props) {
  const panelRef = useModalA11y<HTMLDivElement>(open, () => { if (!busy) onClose() })
  const [repos, setRepos] = useState<RepoSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsGithub, setNeedsGithub] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<RepoSummary | null>(null)
  const [branches, setBranches] = useState<string[]>([])
  const [branch, setBranch] = useState('')
  const [manualUrl, setManualUrl] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery(''); setSelected(null); setBranches([]); setBranch('')
      setManualUrl(''); setError(null); setNeedsGithub(false)
    }
  }, [open])

  const load = useCallback(async () => {
    setLoading(true); setError(null); setNeedsGithub(false)
    try {
      const res = await fetch('/api/github/repos')
      const data = await res.json()
      if (!res.ok) {
        setNeedsGithub(!!data?.needsGithub)
        throw new Error(data?.error || 'Could not load your repositories')
      }
      setRepos(data.repos || [])
    } catch (e: any) {
      setError(e?.message || 'Could not load your repositories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (open) load() }, [open, load])

  // Branches load lazily — one extra call per repo the user actually opens.
  const selectRepo = useCallback(async (repo: RepoSummary) => {
    setSelected(repo)
    setBranch(repo.defaultBranch)
    setBranches([repo.defaultBranch])
    try {
      const res = await fetch(`/api/github/repos?owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.branches) && data.branches.length) setBranches(data.branches)
    } catch { /* keep the default branch — the picker still works */ }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos
    return repos.filter(r => r.fullName.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  }, [repos, query])

  const inputClass = cn(
    'w-full px-3 py-2 rounded-lg text-sm border outline-none',
    isDark
      ? 'bg-black/30 border-white/10 text-white placeholder:text-zinc-500 focus:border-violet-500/50'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-400',
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-labelledby="repo-picker-title"
            className={cn(
              'w-full max-w-lg max-h-[85dvh] flex flex-col rounded-2xl border shadow-2xl',
              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 id="repo-picker-title" className="text-base font-semibold flex items-center gap-2">
                <Github className="w-4 h-4" /> {title}
              </h2>
              <button aria-label="Close" onClick={() => !busy && onClose()}
                className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-100 text-slate-500')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-zinc-500' : 'text-slate-400')} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your repositories"
                  className={cn(inputClass, 'pl-9')}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 min-h-[120px]">
              {loading && (
                <div className={cn('flex items-center gap-2 py-8 justify-center text-sm', isDark ? 'text-zinc-400' : 'text-slate-500')}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your repositories…
                </div>
              )}

              {!loading && error && (
                <div className={cn('py-6 text-sm space-y-3', isDark ? 'text-zinc-300' : 'text-slate-700')}>
                  <p className="text-red-500 text-xs">{error}</p>
                  {needsGithub && (
                    <a
                      href="/login?callbackUrl=/workspace"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Github className="w-4 h-4" /> Connect GitHub
                    </a>
                  )}
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <p className={cn('py-8 text-center text-sm', isDark ? 'text-zinc-500' : 'text-slate-500')}>
                  {repos.length === 0 ? 'No repositories found on this account.' : 'No repositories match that search.'}
                </p>
              )}

              <div className="space-y-1.5 pb-2">
                {!loading && filtered.map((r) => {
                  const isSel = selected?.fullName === r.fullName
                  return (
                    <button
                      key={r.fullName}
                      onClick={() => selectRepo(r)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                        isSel
                          ? isDark ? 'bg-violet-500/15 border-violet-500/50' : 'bg-violet-50 border-violet-300'
                          : isDark ? 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]' : 'bg-white border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{r.fullName}</span>
                        {r.private && <Lock className={cn('w-3 h-3 shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')} />}
                        <span className={cn('ml-auto text-[10px] shrink-0', isDark ? 'text-zinc-500' : 'text-slate-400')}>{relative(r.pushedAt)}</span>
                      </div>
                      {r.description && (
                        <p className={cn('text-[11px] mt-0.5 truncate', isDark ? 'text-zinc-500' : 'text-slate-500')}>{r.description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={cn('p-5 pt-3 border-t space-y-3', isDark ? 'border-white/10' : 'border-slate-200')}>
              {selected && (
                <label className="flex items-center gap-2 text-xs">
                  <GitBranch className={cn('w-3.5 h-3.5 shrink-0', isDark ? 'text-zinc-400' : 'text-slate-500')} />
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Branch</span>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className={cn(
                      'flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs border outline-none',
                      isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900',
                    )}
                  >
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
              )}

              <div className="flex gap-2">
                <input
                  value={manualUrl}
                  onChange={(e) => { setManualUrl(e.target.value); if (e.target.value) setSelected(null) }}
                  placeholder="…or paste github.com/owner/repo"
                  className={cn(inputClass, 'flex-1 min-w-0 text-xs')}
                />
              </div>

              <button
                disabled={busy || (!selected && !manualUrl.trim())}
                onClick={() => {
                  if (manualUrl.trim()) onPick(manualUrl.trim(), branch || '')
                  else if (selected) onPick(selected.url, branch || selected.defaultBranch)
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
