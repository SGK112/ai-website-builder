'use client'

// Shared admin layout — sidebar nav across all /admin/* pages.
// Renders the user's admin status + jump links. Pure presentational.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Crown,
  Users,
  PackageCheck,
  DollarSign,
  Activity,
  ServerCog,
  Plug,
  Bug,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin',             label: 'Overview',     icon: BarChart3 },
  { href: '/admin/users',       label: 'Users',         icon: Users },
  { href: '/admin/listings',    label: 'Listings',      icon: PackageCheck },
  { href: '/admin/marketplace', label: 'Marketplace',   icon: DollarSign },
  { href: '/admin/sessions',    label: 'Sessions',      icon: Activity },
  { href: '/admin/integrations',label: 'Integrations',  icon: Plug },
  { href: '/admin/system',      label: 'System',        icon: ServerCog },
  { href: '/admin/audit',       label: 'Audit log',     icon: Bug },
]

interface Props {
  email: string
}

export function AdminNav({ email }: Props) {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card/30 shrink-0 sticky top-0 h-screen">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-sm">Webstew Admin</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate font-mono" title={email}>{email}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/')
          const Icon = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2 text-sm transition',
                active
                  ? 'bg-violet-500/15 text-violet-200 border-l-2 border-violet-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] border-l-2 border-transparent'
              )}
            >
              <Icon className="w-4 h-4" /> {it.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Back to site
        </Link>
      </div>
    </aside>
  )
}
