'use client'

import { WorkspaceNav } from './WorkspaceNav'
import { PageTransition } from './PageTransition'
import { usePathname } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()

  // Pages that should NOT have the workspace nav (pages with their own nav)
  const hideNavPages = ['/', '/login', '/signup', '/auth', '/workspace', '/create']
  const shouldHideNav = hideNavPages.some(page =>
    pathname === page || pathname.startsWith('/auth/') || pathname.startsWith('/workspace') || pathname.startsWith('/create/')
  )

  return (
    <>
      {/* Global background for all pages */}
      <div className="fixed inset-0 bg-[#050508]" />

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[30%] -left-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent blur-[100px]"
          style={{ animation: 'pulse 8s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent blur-[80px]"
          style={{ animation: 'pulse 10s ease-in-out infinite', animationDelay: '3s' }}
        />
        <div
          className="absolute -bottom-[20%] left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-blue-500/5 to-transparent blur-[60px]"
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
      <div className={!shouldHideNav ? 'pt-16' : ''}>
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
