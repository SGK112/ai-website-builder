'use client'

import { WorkspaceNav } from './WorkspaceNav'
import { PageTransition } from './PageTransition'
import { usePathname } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()

  // Pages that render their OWN nav (WebStewNav) — don't also paint the global
  // WorkspaceNav on top of them, or you get a double header + logo (/profile,
  // /templates did exactly that).
  const ownNavPrefixes = ['/auth/', '/workspace', '/create/', '/profile', '/templates']
  const hideNavExact = ['/', '/login', '/signup', '/auth', '/workspace', '/create', '/profile', '/templates']
  const shouldHideNav =
    hideNavExact.includes(pathname) || ownNavPrefixes.some((p) => pathname.startsWith(p))

  return (
    <>
      {/* Global background for all pages — THEME-AWARE.
          This was hardcoded to `bg-[#050508]` (dark slate) which painted
          the entire app dark regardless of which theme the user picked.
          `bg-background` reads --background from the CSS theme variables
          (white in light mode, dark in dark mode) so light mode actually
          shows light. */}
      <div className="fixed inset-0 bg-background" />

      {/* Animated background orbs. Stronger in dark mode (pop against a
          dark canvas), barely-there in light mode (so they don't wash
          the page out into a pastel mush). */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[30%] -left-[10%] w-[800px] h-[800px] rounded-full blur-[100px] bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent dark:from-blue-500/15 dark:via-purple-500/10"
          style={{ animation: 'pulse 8s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 -right-[15%] w-[600px] h-[600px] rounded-full blur-[80px] bg-gradient-to-tl from-purple-500/5 via-pink-500/5 to-transparent dark:from-purple-500/15 dark:via-pink-500/10"
          style={{ animation: 'pulse 10s ease-in-out infinite', animationDelay: '3s' }}
        />
        <div
          className="absolute -bottom-[20%] left-1/3 w-[500px] h-[500px] rounded-full blur-[60px] bg-gradient-to-tr from-indigo-500/4 via-blue-500/3 to-transparent dark:from-indigo-500/10 dark:via-blue-500/5"
          style={{ animation: 'pulse 12s ease-in-out infinite', animationDelay: '5s' }}
        />
      </div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Workspace navigation - global header */}
      {!shouldHideNav && <WorkspaceNav />}

      {/* Page content with transitions */}
      <div className={`relative z-10 ${!shouldHideNav ? 'pt-16' : ''}`}>
        <PageTransition>
          {children}
        </PageTransition>
      </div>

      {/* Keyframe for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </>
  )
}
