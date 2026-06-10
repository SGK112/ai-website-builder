'use client'

import {
  Copy,
  Share,
  Link as LinkIcon,
  ShoppingBag,
  Sparkles,
  Rocket,
  Database,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillLevel } from '../types'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface WhatsNextCoachProps {
  isDark: boolean
  skillLevel: SkillLevel
  deployStatus: 'idle' | 'github' | 'render' | 'success' | 'error'
  deployUrl: string | null
  projectName: string
  // Navigation into the deploy panel (Ship it / Add a backend land here).
  onOpenDeploy: () => void
  // Deploy panel + scroll the custom-domain card into view.
  onOpenDomain: () => void
  // Open the Publish-to-Community / sell modal.
  onSell: () => void
  onDismiss: () => void
  addToast: (type: ToastType, message: string) => void
}

export function WhatsNextCoach({
  isDark,
  skillLevel,
  deployStatus,
  deployUrl,
  projectName,
  onOpenDeploy,
  onOpenDomain,
  onSell,
  onDismiss,
  addToast,
}: WhatsNextCoachProps) {
  const isLive = deployStatus === 'success' && !!deployUrl
  // no-code talks outcomes ("Go live"); the technical tiers say "Ship it".
  const shipLabel = skillLevel === 'no-code' ? 'Go live' : 'Ship it'
  const sellLabel = skillLevel === 'no-code' ? 'Sell on community' : 'Sell'

  const copyUrl = async () => {
    if (!deployUrl) return
    try {
      await navigator.clipboard.writeText(deployUrl)
      addToast('success', 'URL copied')
    } catch {
      addToast('error', 'Copy failed — select the URL and copy manually')
    }
  }

  const shareUrl = async () => {
    if (!deployUrl) return
    const navAny = navigator as unknown as { share?: (data: { title: string; url: string }) => Promise<void> }
    if (navAny.share) {
      // A rejection here is almost always the user dismissing the native
      // share sheet — an intentional cancel, not an error to surface.
      try {
        await navAny.share({ title: projectName || 'My site', url: deployUrl })
      } catch {
        /* user cancelled the share sheet */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(deployUrl)
      addToast('success', 'URL copied — paste it anywhere')
    } catch {
      addToast('error', 'Copy failed — select the URL and copy manually')
    }
  }

  return (
    <div className={cn(
      'border-b px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide',
      isDark ? 'border-white/[0.06] bg-gradient-to-r from-violet-950/20 to-fuchsia-950/10' : 'border-slate-200 bg-gradient-to-r from-violet-50 to-pink-50'
    )}>
      {isLive ? (
        <>
          {/* Live-deployed badge + the URL itself — clicking opens it.
              Truncates host on mobile so the row doesn't overflow. */}
          <a
            href={deployUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors max-w-[200px] sm:max-w-none',
              isDark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            )}
            title={deployUrl!}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="whitespace-nowrap truncate">Live · {(() => { try { return new URL(deployUrl!).host } catch { return deployUrl } })()}</span>
          </a>
          <button
            onClick={copyUrl}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              isDark ? 'bg-white/[0.06] hover:bg-white/10 text-zinc-200' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            )}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
          <button
            onClick={shareUrl}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              isDark ? 'bg-white/[0.06] hover:bg-white/10 text-zinc-200' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            )}
          >
            <Share className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={onOpenDomain}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              isDark ? 'bg-white/[0.06] hover:bg-white/10 text-zinc-200' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            )}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Custom domain</span>
          </button>
          <button
            onClick={onSell}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-[12px] font-medium transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Sell it</span>
          </button>
        </>
      ) : (
        <>
          <div className="hidden sm:flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
            <Sparkles className={cn('w-4 h-4', isDark ? 'text-violet-400' : 'text-violet-600')} />
            <span className={cn('text-[12px] font-semibold', isDark ? 'text-white' : 'text-slate-900')}>What&apos;s next?</span>
          </div>
          <button
            onClick={onOpenDeploy}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-[12px] font-medium transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{shipLabel}</span>
          </button>
          {/* full-stack devs are likely to want data/auth before they ship —
              surface the managed backend right in the coach. */}
          {skillLevel === 'full-stack' && (
            <button
              onClick={onOpenDeploy}
              className={cn(
                'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
                isDark ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Add a backend</span>
            </button>
          )}
          <button
            onClick={onOpenDomain}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              isDark ? 'bg-white/[0.06] hover:bg-white/10 text-zinc-200' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            )}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Connect domain</span>
          </button>
          <button
            onClick={onSell}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
              isDark ? 'bg-white/[0.06] hover:bg-white/10 text-zinc-200' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
            )}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{sellLabel}</span>
          </button>
        </>
      )}
      <div className="flex-1" />
      <button
        onClick={onDismiss}
        title="Hide"
        className={cn(
          'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
          isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        )}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
