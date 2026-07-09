'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, Loader2, X } from 'lucide-react'

interface Props {
  token: string
  type: 'preview' | 'proposal'
  proposalName: string
  alreadyAccepted: boolean
  viewCount: number
}

export function ProposalClient({ token, type, proposalName, alreadyAccepted }: Props) {
  const [showAccept, setShowAccept] = useState(false)
  const [accepted, setAccepted] = useState(alreadyAccepted)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Track view on mount
  useEffect(() => {
    fetch(`/api/preview/${token}/view`, { method: 'POST' }).catch(() => {})
  }, [token])

  if (type !== 'proposal') return null

  async function handleAccept() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/preview/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAccepted(true)
      setShowAccept(false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Accept bar at the top */}
      {!accepted && !showAccept && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-2.5 bg-violet-600 shadow-lg">
          <span className="text-white text-sm font-medium truncate max-w-[60%]">
            📋 {proposalName}
          </span>
          <button
            onClick={() => setShowAccept(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-violet-700 text-xs font-bold shadow hover:bg-violet-50 transition-all"
          >
            Accept Proposal <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Already accepted banner */}
      {accepted && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Proposal accepted — we'll be in touch!</span>
        </div>
      )}

      {/* Accept modal */}
      {showAccept && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Accept Proposal</h2>
              <button onClick={() => setShowAccept(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              By accepting, you agree to move forward with <strong>{proposalName}</strong>. Leave your info so we can reach you.
            </p>
            <div className="space-y-2.5">
              {[
                { label: 'Your name', value: name, onChange: setName, type: 'text', placeholder: 'Jane Smith', required: true },
                { label: 'Email', value: email, onChange: setEmail, type: 'email', placeholder: 'jane@example.com', required: false },
                { label: 'Phone', value: phone, onChange: setPhone, type: 'tel', placeholder: '(555) 555-5555', required: false },
              ].map(({ label, value, onChange, type, placeholder, required }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleAccept}
              disabled={loading || !name.trim()}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-violet-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Sending…' : 'Accept Proposal'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
