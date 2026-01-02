'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Home,
  Layout,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Layers,
  CreditCard,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

interface NavLink {
  href: string
  label: string
  icon: typeof Home
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/workspace', label: 'Builder', icon: Layout },
  { href: '/templates', label: 'Templates', icon: Layers },
]

export function WebStewNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl transition-colors',
        isDark ? 'bg-slate-950/90 border-white/10' : 'bg-white/90 border-slate-200'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Stew Pot */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden transition-transform group-hover:scale-105',
                isDark
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/25'
                  : 'bg-gradient-to-br from-orange-400 to-pink-500 shadow-orange-400/25'
              )}
            >
              <span className="text-2xl leading-none select-none">🍲</span>
              {/* Steam effect on hover */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-2 bg-white/40 rounded-full animate-pulse" />
              </div>
            </div>
            <span
              className={cn(
                'text-xl font-bold tracking-tight',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              WebStew
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    active
                      ? isDark
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-100 text-slate-900'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn(
                'p-2.5 rounded-lg transition-colors',
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu or Sign In */}
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    isDark
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-slate-100 text-slate-900'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-medium">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          'absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden',
                          isDark
                            ? 'bg-slate-900 border-white/10'
                            : 'bg-white border-slate-200'
                        )}
                      >
                        <div className="p-3 border-b border-white/10">
                          <p
                            className={cn(
                              'font-medium text-sm',
                              isDark ? 'text-white' : 'text-slate-900'
                            )}
                          >
                            {session.user.name || 'User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {session.user.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              isDark
                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </Link>
                          <Link
                            href="/profile?tab=billing"
                            onClick={() => setUserMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              isDark
                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <CreditCard className="w-4 h-4" />
                            Billing
                          </Link>
                          <Link
                            href="/profile?tab=settings"
                            onClick={() => setUserMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              isDark
                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                        </div>
                        <div className="p-2 border-t border-white/10">
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                              isDark
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-red-600 hover:bg-red-50'
                            )}
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/workspace"
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors',
                    isDark
                      ? 'bg-violet-600 hover:bg-violet-500'
                      : 'bg-orange-500 hover:bg-orange-400'
                  )}
                >
                  Start Building
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden p-2.5 rounded-lg transition-colors',
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <nav className="py-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? isDark
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-100 text-slate-900'
                          : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default WebStewNav
