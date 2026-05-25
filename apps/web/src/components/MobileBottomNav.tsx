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

// Routes where the bottom nav HIDES — full-screen flows like signup,
// auth, payment, raw preview share, etc.
const HIDE_ON: RegExp[] = [
  /^\/(login|signup|forgot-password|reset-password|verify-email)/,
  /^\/preview\//,
  /^\/(admin|seller)/,
]

export function MobileBottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Only signed-in users get the tab nav. Marketing pages (anon) keep the
  // sales-oriented top nav.
  if (!session?.user?.id) return null
  if (!isMobile) return null
  if (HIDE_ON.some((re) => re.test(pathname))) return null

  return (
    <nav
      // The data-[*] selector hides this nav while a full-screen modal
      // (e.g. MobileBuildSheet) sets body[data-mobile-sheet-open]. Stops
      // the tab bar from covering modal action buttons.
      className="mobile-bottom-nav fixed left-0 right-0 bottom-0 z-[60] bg-zinc-950/95 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <div className="flex items-stretch h-14">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.match(pathname)
          return (
            <button
              key={t.href}
              onClick={() => router.push(t.href)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-violet-400' : 'text-zinc-500 active:text-zinc-300'
              )}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]')} />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
