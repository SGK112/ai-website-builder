'use client'

// ConversionScopeModal — the clarity step for website→app conversion.
//
// "Convert to App" used to fire a generic "convert everything" prompt at
// the generator. For a large site that produced an Expo app too big to
// finish (the continuation passes still ran out). This modal scopes the
// job FIRST: the user picks which screens to include, the content mode,
// and what the contact buttons do. A scoped conversion is a smaller, far
// more reliable generation — and the app the user actually wants.
//
// Conversions target mobile (Expo) only — a website→app conversion is a
// mobile app. Re-platforming to another web framework is a separate flow.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, X, Check, AlertTriangle } from 'lucide-react'

export interface ConversionScope {
  screens: string[]
  contentMode: 'real' | 'placeholder'
  contactAction: 'call' | 'email' | 'both' | 'info'
}

interface ConversionScopeModalProps {
  open: boolean
  isDark: boolean
  siteName: string
  sections: string[]
  onClose: () => void
  onConvert: (scope: ConversionScope) => void
}

// Beyond this, a conversion starts to strain the generation budget — so we
// pre-select only this many and nudge the user to keep it focused.
const SUGGESTED_MAX = 5

const CONTACT_OPTIONS: { id: ConversionScope['contactAction']; label: string }[] = [
  { id: 'call',  label: 'Call' },
  { id: 'email', label: 'Email' },
  { id: 'both',  label: 'Call + Email' },
  { id: 'info',  label: 'Show details' },
]

export function ConversionScopeModal({
  open, isDark, siteName, sections, onClose, onConvert,
}: ConversionScopeModalProps) {
  const [screens, setScreens] = useState<string[]>([])
  const [contentMode, setContentMode] = useState<'real' | 'placeholder'>('real')
  const [contactAction, setContactAction] = useState<ConversionScope['contactAction']>('call')

  // Re-seed each time the modal opens for a site: pre-check the core screens
  // (only the first few when the site is large, to keep the job in budget).
  useEffect(() => {
    if (!open) return
    setScreens(sections.slice(0, SUGGESTED_MAX))
    setContentMode('real')
    setContactAction('call')
  }, [open, sections])

  const toggle = (s: string) =>
    setScreens((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const overBudget = screens.length > SUGGESTED_MAX
  const card = isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
  const sub = isDark ? 'text-zinc-500' : 'text-slate-500'
  const heading = isDark ? 'text-white' : 'text-slate-900'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={'w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ' + card}
          >
            {/* Header */}
            <div className={'flex items-center gap-3 px-5 py-4 border-b ' + (isDark ? 'border-white/10' : 'border-slate-200')}>
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={'text-sm font-semibold ' + heading}>Convert to a mobile app</div>
                <div className={'text-[11px] truncate ' + sub}>{siteName}</div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className={
                  'w-7 h-7 rounded-md flex items-center justify-center transition-all shrink-0 ' +
                  (isDark ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')
                }
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
              {/* Screens */}
              <div>
                <div className={'text-[11px] font-medium uppercase tracking-wide mb-2 ' + sub}>
                  Screens to include
                </div>
                {sections.length === 0 ? (
                  <div className={'text-xs ' + sub}>
                    No sections detected — the app will be built from the site as a whole.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {sections.map((s) => {
                      const on = screens.includes(s)
                      return (
                        <button
                          key={s}
                          onClick={() => toggle(s)}
                          className={
                            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all ' +
                            (on
                              ? (isDark ? 'border-violet-500/40 bg-violet-500/[0.08]' : 'border-violet-300 bg-violet-50')
                              : (isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white'))
                          }
                        >
                          <span
                            className={
                              'w-4 h-4 rounded flex items-center justify-center shrink-0 border ' +
                              (on
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : (isDark ? 'border-white/20' : 'border-slate-300'))
                            }
                          >
                            {on && <Check className="w-3 h-3" />}
                          </span>
                          <span className={'text-xs ' + (isDark ? 'text-zinc-200' : 'text-slate-700')}>{s}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {overBudget && (
                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-amber-500">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      {screens.length} screens is a large app — {SUGGESTED_MAX} or fewer
                      converts faster and more reliably. Consider trimming.
                    </span>
                  </div>
                )}
              </div>

              {/* Content mode */}
              <div>
                <div className={'text-[11px] font-medium uppercase tracking-wide mb-2 ' + sub}>Content</div>
                <div className="flex gap-2">
                  {([['real', "Site's real text"], ['placeholder', 'Placeholder copy']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setContentMode(id)}
                      className={
                        'flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ' +
                        (contentMode === id
                          ? 'border-violet-500 bg-violet-600 text-white'
                          : (isDark ? 'border-white/10 bg-white/[0.02] text-zinc-300' : 'border-slate-200 bg-white text-slate-600'))
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact action */}
              <div>
                <div className={'text-[11px] font-medium uppercase tracking-wide mb-2 ' + sub}>
                  Contact buttons should…
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CONTACT_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setContactAction(o.id)}
                      className={
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-all ' +
                        (contactAction === o.id
                          ? 'border-violet-500 bg-violet-600 text-white'
                          : (isDark ? 'border-white/10 bg-white/[0.02] text-zinc-300' : 'border-slate-200 bg-white text-slate-600'))
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={'flex items-center gap-2 px-5 py-4 border-t ' + (isDark ? 'border-white/10' : 'border-slate-200')}>
              <button
                onClick={onClose}
                className={
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all ' +
                  (isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200')
                }
              >
                Cancel
              </button>
              <button
                onClick={() => onConvert({ screens, contentMode, contactAction })}
                disabled={sections.length > 0 && screens.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-3.5 h-3.5" />
                {sections.length > 0 ? `Convert ${screens.length} screen${screens.length === 1 ? '' : 's'}` : 'Convert to app'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
