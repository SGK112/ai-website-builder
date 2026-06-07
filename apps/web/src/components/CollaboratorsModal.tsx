'use client'

// Invite teammates/clients to a project with editor or viewer access. Mirrors
// Lovable/Replit's share flow. Owner-only management; pending invites (email
// has no account yet) are matched on the invitee's next sign-in.

import { useEffect, useState, useCallback } from 'react'
import { X, UserPlus, Loader2, Crown } from 'lucide-react'

interface Collaborator { userId: string | null; email: string; role: 'editor' | 'viewer'; addedAt: string }

export function CollaboratorsModal({
  open, onClose, projectId, isDark, ownerEmail,
}: {
  open: boolean
  onClose: () => void
  projectId: string | null
  isDark: boolean
  ownerEmail?: string
}) {
  const [list, setList] = useState<Collaborator[]>([])
  const [yourRole, setYourRole] = useState<string>('owner')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/projects/${projectId}/collaborators`)
      const d = await r.json()
      if (r.ok) { setList(d.collaborators || []); setYourRole(d.yourRole || 'owner') }
      else setError(d.error || 'Failed to load')
    } finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { if (open) { setError(null); load() } }, [open, load])

  const invite = async () => {
    if (!projectId) return
    setBusy(true); setError(null)
    try {
      const r = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to invite')
      setEmail(''); load()
    } catch (e: any) { setError(e?.message || 'Failed') } finally { setBusy(false) }
  }
  const remove = async (em: string) => {
    if (!projectId) return
    await fetch(`/api/projects/${projectId}/collaborators?email=${encodeURIComponent(em)}`, { method: 'DELETE' })
    load()
  }

  if (!open) return null
  const card = isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'
  const sub = isDark ? 'text-zinc-400' : 'text-slate-500'
  const isOwner = yourRole === 'owner'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-2xl border shadow-2xl ${card}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-400" />
            <h3 className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>Share project</h3>
          </div>
          <button onClick={onClose} className={sub}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!projectId ? (
            <p className={`text-sm ${sub}`}>Save this project first, then you can invite collaborators.</p>
          ) : (
            <>
              {isOwner && (
                <div className="flex gap-2">
                  <input
                    value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@email.com"
                    onKeyDown={(e) => { if (e.key === 'Enter') invite() }}
                    className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none ring-1 ${isDark ? 'bg-white/[0.03] ring-white/10 text-white placeholder-zinc-600' : 'bg-slate-50 ring-slate-200 text-slate-900'}`}
                  />
                  <select value={role} onChange={(e) => setRole(e.target.value as any)} className={`rounded-lg px-2 py-2 text-sm outline-none ring-1 ${isDark ? 'bg-white/[0.03] ring-white/10 text-white' : 'bg-slate-50 ring-slate-200 text-slate-900'}`}>
                    <option value="editor" className="bg-zinc-900">Editor</option>
                    <option value="viewer" className="bg-zinc-900">Viewer</option>
                  </select>
                  <button onClick={invite} disabled={busy || !email} className="rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-3 text-sm font-medium text-white flex items-center gap-1">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="space-y-1.5">
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                  <span className={`flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> {ownerEmail || 'You'} <span className={sub}>(owner)</span>
                  </span>
                </div>
                {loading && <p className={`text-xs ${sub}`}>Loading…</p>}
                {list.map((c) => (
                  <div key={c.email} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                    <span className={`min-w-0 truncate ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      {c.email} {!c.userId && <span className={`text-[10px] ${sub}`}>(pending)</span>}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] capitalize ${sub}`}>{c.role}</span>
                      {isOwner && <button onClick={() => remove(c.email)} className="text-zinc-500 hover:text-red-400 text-xs">remove</button>}
                    </span>
                  </div>
                ))}
                {!loading && list.length === 0 && <p className={`text-xs ${sub}`}>No collaborators yet. Invite by email above.</p>}
              </div>
              <p className={`text-[11px] ${sub}`}>Editors can build &amp; edit. Viewers can open but not change. Invitees see the project under “Shared with me”.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
