'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  Key,
  ChevronRight,
  Sparkles,
  CreditCard,
  HelpCircle,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    plan?: string
  }
}

const navigation = [
  {
    section: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    ]
  },
  {
    section: 'Account',
    items: [
      { name: 'Credentials', href: '/dashboard/credentials', icon: Key },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="relative flex flex-col w-64 border-r border-white/[0.04] bg-[#08080c]">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />

      {/* Header - User Profile */}
      <div className="relative px-5 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <span className="text-sm font-bold text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-4">
        {navigation.map((group, groupIndex) => (
          <div key={group.section} className={cn(groupIndex > 0 && 'mt-6')}>
            <p className="px-5 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {group.section}
            </p>
            <div className="px-3 space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                        isActive
                          ? 'bg-white/[0.04] text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          'w-[18px] h-[18px] transition-colors',
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                        )} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade Card */}
      <div className="relative px-4 py-4 border-t border-white/[0.04]">
        <Link href="/upgrade">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Upgrade Plan</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Unlock unlimited projects and priority AI access.
            </p>
            <div className="flex items-center gap-1 text-xs text-purple-400 font-medium group-hover:gap-2 transition-all">
              <span>View plans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Footer Links */}
      <div className="relative px-3 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-1">
          <Link
            href="/help"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/[0.02] transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </Link>
          <Link
            href="/feedback"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/[0.02] transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Feedback</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
