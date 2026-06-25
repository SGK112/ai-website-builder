'use client'

// Minimal mobile account portal: a small avatar that opens a compact dropdown
// (Profile / Log out, or Log in / Sign up) instead of jumping straight to a
// page. Self-contained — owns its open state, outside-click close, and nav.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react'

interface Props {
  isDark: boolean
  user: { name?: string | null; email?: string | null; image?: string | null } | null
}

export function MobileAccountMenu({ isDark, user }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const go = (href: string) => { setOpen(false); router.push(href) }

  const itemCls = cn(
    'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[14px] font-medium text-left transition-colors',
    isDark ? 'text-zinc-200 active:bg-white/10' : 'text-slate-700 active:bg-slate-100',
  )

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Account"
        aria-expanded={open}
        className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[13px] font-bold text-white">
            {user ? (user.name || user.email || '?').charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-11 w-52 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl',
            isDark ? 'bg-zinc-900/95 border-white/10 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-400/30',
          )}
        >
          {user ? (
            <>
              <div className={cn('px-3.5 py-2.5 border-b text-[12px] truncate', isDark ? 'border-white/10 text-zinc-400' : 'border-slate-200 text-slate-500')}>
                {user.name || user.email || 'Signed in'}
              </div>
              <button onClick={() => go('/profile')} className={itemCls}>
                <UserIcon className="w-[18px] h-[18px]" /> Profile
              </button>
              <button onClick={() => { setOpen(false); void signOut({ callbackUrl: '/' }) }} className={cn(itemCls, 'text-red-400')}>
                <LogOut className="w-[18px] h-[18px]" /> Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/login')} className={itemCls}>
                <LogIn className="w-[18px] h-[18px]" /> Log in
              </button>
              <button onClick={() => go('/signup')} className={itemCls}>
                <UserPlus className="w-[18px] h-[18px]" /> Sign up
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
