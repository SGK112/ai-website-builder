'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FilePlus2, Upload, Loader2, Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseProjectZip, type ImportedProject } from '@/lib/import-project'

interface Props {
  isDark: boolean
  open: boolean
  onClose: () => void
  onStartNew: () => void
  onImported: (project: ImportedProject) => void
}

// The "+New" chooser: start a blank project, or import an existing one (a .zip
// today; GitHub is wired as "coming soon" so the path is visible). Keeps the
// import logic (unzip + map) in lib/import-project so this stays presentational.
export function NewProjectChooser({ isDark, open, onClose, onStartNew, onImported }: Props) {
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-5',
              isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">New project</h2>
              <button onClick={() => !busy && onClose()} className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-100 text-slate-500')}>
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

              <button className={cn(optionClass, 'cursor-not-allowed')} disabled title="GitHub import is coming next">
                <div className={cn('mt-0.5 p-2 rounded-lg', isDark ? 'bg-white/5 text-zinc-500' : 'bg-slate-100 text-slate-400')}>
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">Import from GitHub <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full', isDark ? 'bg-white/10 text-zinc-400' : 'bg-slate-200 text-slate-600')}>Soon</span></div>
                  <div className={cn('text-xs mt-0.5', isDark ? 'text-zinc-500' : 'text-slate-400')}>Pull a repo straight in.</div>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
