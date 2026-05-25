'use client'

// Smart "Add to Home Screen" prompt.
//
// We surface this in two flavours:
//   • Chromium / Android: the browser fires `beforeinstallprompt`. We catch
//     the event, defer it, and surface our own polished CTA. When the user
//     taps Install we replay the event so the native install sheet opens.
//   • iOS Safari: there is no install API; the user has to use Share →
//     Add to Home Screen manually. We detect iOS Safari and show a short
//     instruction card pointing at the share button.
//
// Either way the prompt only fires after the user has shown some intent:
//   – signed-in, OR
//   – on /workspace, OR
//   – this is at least their second visit
// and is dismissable for 14 days via localStorage. We never show it when
// the app is already running standalone (display-mode: standalone).

import { useEffect, useState } from 'react'
import { X, Share, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'webstew-pwa-dismissed-at'
const VISIT_KEY = 'webstew-visits'
const DISMISS_DAYS = 14

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already running as a PWA — nothing to prompt.
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    // Dismissed within the cooldown window — respect the user's no.
    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000) return

    // Bump visit counter — used as a soft intent signal on the marketing
    // pages where we don't have other intent cues.
    const visits = (parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) || 0) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    const onWorkspace = window.location.pathname.startsWith('/workspace')
    const repeatVisitor = visits >= 2
    const eligible = onWorkspace || repeatVisitor

    // Android / Chromium path — handed a real event we can replay.
    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (eligible) setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBefore as EventListener)

    // iOS Safari path — no API; detect and show the manual hint instead.
    // We deliberately don't show on iPad Safari that masquerades as Mac;
    // the Mac UA path doesn't get a Share-Add-to-Home-Screen affordance.
    const ua = navigator.userAgent
    const isIos = /iPhone|iPod/.test(ua) || (/(Macintosh).*Mobile/.test(ua) && 'ontouchend' in document)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua)
    if (isIos && isSafari && eligible) {
      setIosHint(true)
      setShow(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onBefore as EventListener)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShow(false)
        // Forget the dismiss timestamp so analytics shows accept, not "no"
        localStorage.removeItem(DISMISS_KEY)
      } else {
        dismiss()
      }
    } catch {
      dismiss()
    } finally {
      setDeferredPrompt(null)
    }
  }

  if (!show) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] w-[min(420px,calc(100vw-24px))]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      role="dialog"
      aria-label="Install Webstew"
    >
      <div className="bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl shadow-black/50 p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-violet-900/50">
          🍲
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white">Install Webstew</div>
          {iosHint ? (
            <div className="text-[11px] text-zinc-400 leading-snug flex items-center gap-1">
              Tap <Share className="w-3 h-3 inline" /> Share → <span className="text-zinc-200">Add to Home Screen</span>
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 leading-snug">
              Add the app to your home screen for faster access.
            </div>
          )}
        </div>
        {!iosHint && (
          <button
            onClick={install}
            className="bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}
        <button onClick={dismiss} className="text-zinc-500 hover:text-white transition shrink-0" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
