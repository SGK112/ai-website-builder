'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FilePlus2, Upload, Loader2, Github } from 'lucide-react'
import { GithubRepoPicker } from './GithubRepoPicker'
import { cn } from '@/lib/utils'
import { parseProjectZip, type ImportedProject } from '@/lib/import-project'
import { useModalA11y } from '@/hooks/useModalA11y'

interface Props {
  isDark: boolean
  open: boolean
  onClose: () => void
  onStartNew: () => void
  onImported: (project: ImportedProject) => void
  // Called with the repo an import came from, so the new project can be linked
  // to it (pull/push/webhook all need a link to exist).
  onRepoImported?: (repoUrl: string, branch: string) => void
}

// The "+New" chooser: start a blank project, or import an existing one (a .zip
// today; GitHub is wired as "coming soon" so the path is visible). Keeps the
// import logic (unzip + map) in lib/import-project so this stays presentational.
export function NewProjectChooser({ isDark, open, onClose, onStartNew, onImported, onRepoImported }: Props) {
  const zipInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useModalA11y<HTMLDivElement>(open, () => { if (!busy) onClose() })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Reset transient state each time the chooser closes.
  useEffect(() => {
    if (!open) { setPickerOpen(false); setError(null); setBusy(false) }
  }, [open])

  const handleZip = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onImported(await parseProjectZip(file))
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Could not read that archive.')
    } finally {
      setBusy(false)
    }
  }

  const handleGithub = async (repoUrl: string, branch: string) => {
    if (!repoUrl.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/projects/import-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), branch: branch || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Import failed')
      onImported(data.project)
      // Remember where it came from so the clone stays connected to its repo.
      if (data.repo) onRepoImported?.(`https://github.com/${data.repo.fullName}`, data.repo.branch)
      setPickerOpen(false)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Could not import that repo.')
    } finally {
      setBusy(false)
    }
  }

  const optionClass = cn(
    'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all disabled:opacity-50',
    isDark
      ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-violet-500/40'
      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-violet-300',
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            className={cn(
              'w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border shadow-2xl p-5',
              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="new-project-title" className="text-base font-semibold">New project</h2>
              <button aria-label="Close" onClick={() => !busy && onClose()} className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-100 text-slate-500')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button className={optionClass} disabled={busy} onClick={() => { onStartNew(); onClose() }}>
                <div className={cn('mt-0.5 p-2 rounded-lg', isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700')}>
                  <FilePlus2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Start new</div>
                  <div className={cn('text-xs mt-0.5', isDark ? 'text-zinc-400' : 'text-slate-500')}>A blank canvas — describe what to cook up.</div>
                </div>
              </button>

              <button className={optionClass} disabled={busy} onClick={() => zipInputRef.current?.click()}>
                <div className={cn('mt-0.5 p-2 rounded-lg', isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium">{busy ? 'Importing…' : 'Import existing project'}</div>
                  <div className={cn('text-xs mt-0.5', isDark ? 'text-zinc-400' : 'text-slate-500')}>Upload a .zip from your computer. Static sites render right away.</div>
                </div>
              </button>

              <button className={optionClass} disabled={busy} onClick={() => { setPickerOpen(true); setError(null) }}>
                <div className={cn('mt-0.5 p-2 rounded-lg', isDark ? 'bg-white/5 text-zinc-300' : 'bg-slate-100 text-slate-700')}>
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Clone from GitHub</div>
                  <div className={cn('text-xs mt-0.5', isDark ? 'text-zinc-400' : 'text-slate-500')}>Pick one of your repos, edit it here, push your commits back.</div>
                </div>
              </button>

            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => { handleZip(e.target.files?.[0]); e.target.value = '' }}
            />

            <GithubRepoPicker
              isDark={isDark}
              open={pickerOpen}
              busy={busy}
              title="Clone a repository"
              confirmLabel="Clone into Webstew"
              onClose={() => setPickerOpen(false)}
              onPick={handleGithub}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
