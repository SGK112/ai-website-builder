'use client'

// Native-app-style bottom tab nav. Replaces the desktop header nav on
// phones for signed-in users so cross-page navigation feels like an app
// rather than a web page (no more pinching to hit menu items in the top
// nav). Each tab is a hard route — Next.js navigation handles back/
// forward + scroll restore for free. The bar sits above the iPhone home
// indicator via env(safe-area-inset-bottom).

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Layout, Users, Folder, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

interface Tab {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (pathname: string) => boolean
}

const TABS: Tab[] = [
  { href: '/workspace',  label: 'Build',     icon: Home,       match: (p) => p === '/workspace' || p.startsWith('/workspace') },
  { href: '/templates',  label: 'Templates', icon: Layout,     match: (p) => p.startsWith('/templates') },
  { href: '/community',  label: 'Community', icon: Users,      match: (p) => p.startsWith('/community') },
  { href: '/library',    label: 'Library',   icon: Folder,     match: (p) => p.startsWith('/library') },
  { href: '/profile',    label: 'Profile',   icon: UserCircle, match: (p) => p.startsWith('/profile') },
]

// Whitelist — only the five app surfaces get the bottom tab nav. The
// landing page, upgrade flow, grader, marketing pages etc. keep the
// regular top nav. A whitelist is the safer pattern: if we add a new
// app surface we add it here intentionally, instead of a marketing
// page accidentally inheriting app chrome.
const SHOW_ON: RegExp[] = [
  /^\/workspace($|\/)/,
  /^\/templates($|\/)/,
  /^\/community($|\/)/,
  /^\/library($|\/)/,
  /^\/profile($|\/)/,
]

export function MobileBottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const visible = !!session?.user?.id && isMobile && SHOW_ON.some((re) => re.test(pathname))

  // Publish the bar's height as --bottom-nav-h so pages can pad their content
  // (and floating chat input / toasts) above it. Without this the var defaults
  // to 0 and the 56px fixed bar covers the bottom of the screen — the
  // "can't see anything at the bottom" bug. 56px bar + the safe-area inset.
  useEffect(() => {
    const root = document.documentElement
    if (visible) root.style.setProperty('--bottom-nav-h', 'calc(56px + env(safe-area-inset-bottom, 0px))')
    else root.style.setProperty('--bottom-nav-h', '0px')
    return () => root.style.setProperty('--bottom-nav-h', '0px')
  }, [visible])

  // Only signed-in users get the tab nav. Marketing pages (anon) keep the
  // sales-oriented top nav.
  if (!visible) return null

  return (
    <nav
      // The data-[*] selector hides this nav while a full-screen modal
      // (e.g. MobileBuildSheet) sets body[data-mobile-sheet-open]. Stops
      // the tab bar from covering modal action buttons.
      className={cn(
        'mobile-bottom-nav fixed left-0 right-0 bottom-0 z-[60] backdrop-blur-xl border-t',
        isDark ? 'bg-zinc-950/95 border-white/10' : 'bg-white/95 border-slate-200'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <div className="flex items-stretch h-14">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.match(pathname)
          const activeColor = isDark ? 'text-violet-400' : 'text-violet-600'
          const inactiveColor = isDark
            ? 'text-zinc-500 active:text-zinc-300'
            : 'text-slate-500 active:text-slate-800'
          return (
            <button
              key={t.href}
              onClick={() => router.push(t.href)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? activeColor : inactiveColor
              )}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
