'use client'

// BridgePanel — the /integrations card for the local @webstew/bridge.
// Three visible states:
//   1. No bridge ever paired → "Connect Local Bridge" CTA. Click →
//      POST /api/bridge/pair-init → render the pairing code + the
//      exact `npx @webstew/bridge connect …` command for the user to
//      paste into their terminal. Polls /api/bridge/status until the
//      bridge connects (so the UI flips to state 3 automatically).
//   2. Paired, but bridge process not running → "Bridge offline. Run:
//      webstew-bridge connect <code>" with a fresh code (we re-issue
//      since pair codes are single-use).
//   3. Paired and online → green "Connected ✓" with hostname, version,
//      and a Disconnect button.
//
// Status is polled every 5s. When a pairing code is showing, we poll
// faster (every 2s) so the UI feels responsive once the user runs the
// CLI command.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChefHat, Check, Copy, Loader2, Power, Terminal, X, AlertCircle } from 'lucide-react'

interface Status {
  connected: boolean
  lastSeenAt?: string
  bridgeId?: string
  hostname?: string
  bridgeVersion?: string
  inFlightRequests: number
}

interface PairingCode {
  code: string
  expiresAt: number  // ms epoch
  serverUrl: string
}

export function BridgePanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [pairing, setPairing] = useState<PairingCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Status polling. Slower when idle, faster when a pairing code is up
  // (so the UI auto-flips to "connected" the moment the bridge dials in).
  const pollInterval = pairing ? 2000 : 5000
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bridge/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as Status
      setStatus(data)
      // If the bridge just came online, dismiss any open pairing prompt.
      if (data.connected && pairing) setPairing(null)
    } catch {}
  }, [pairing])

  useEffect(() => {
    fetchStatus()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(fetchStatus, pollInterval)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchStatus, pollInterval])

  const initPairing = async () => {
    setBusy(true); setError(null); setCopied(false)
    try {
      const res = await fetch('/api/bridge/pair-init', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json() as { code: string; expiresInSec: number; serverUrl: string }
      setPairing({
        code: data.code,
        expiresAt: Date.now() + data.expiresInSec * 1000,
        serverUrl: data.serverUrl,
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to generate pairing code')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/bridge/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeId: status?.bridgeId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      setStatus({ connected: false, inFlightRequests: 0 })
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect')
    } finally {
      setBusy(false)
    }
  }

  // Build the exact paste-ready command. For localhost/dev we prepend
  // WEBSTEW_SERVER_URL=… so the bridge points at the right server
  // without the user having to remember the env var (the bridge's
  // default is the prod URL).
  const PROD_URL = 'https://webstew.net'
  const needsServerOverride = pairing && pairing.serverUrl && pairing.serverUrl !== PROD_URL
  const command = pairing
    ? (needsServerOverride
        ? `WEBSTEW_SERVER_URL=${pairing.serverUrl} npx @webstew/bridge connect ${pairing.code}`
        : `npx @webstew/bridge connect ${pairing.code}`)
    : ''

  const copyCommand = async () => {
    if (!command) return
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  // Three render states described in the file header.
  const isPaired = !!status?.bridgeId
  const isConnected = !!status?.connected

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.06] to-amber-500/[0.04] p-5 mb-8 backdrop-blur-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Hire your own Chef
            </h2>
            <StatusBadge connected={isConnected} paired={isPaired} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Cook every order on your installed Claude Code so your{' '}
            <span className="font-medium text-orange-700 dark:text-orange-300">Pro/Max subscription</span>{' '}
            picks up the tab instead of Webstew credits. One-time terminal
            setup, then the line runs itself.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State 3: connected */}
      {isConnected && (
        <div className="grid sm:grid-cols-3 gap-3 mb-3 text-xs">
          <Field label="Station" value={status?.hostname || 'unknown'} />
          <Field label="Apron" value={status?.bridgeVersion || '—'} />
          <Field label="On the pass" value={String(status?.inFlightRequests ?? 0)} />
        </div>
      )}

      {/* State 1 & 2: pairing prompt */}
      {pairing && (
        <div className="rounded-xl bg-slate-900/95 dark:bg-black/40 border border-white/10 p-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Hand this to the chef:</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-orange-300 bg-black/40 px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap">
              {command}
            </code>
            <button
              onClick={copyCommand}
              className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition"
              aria-label="Copy command"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setPairing(null)}
              className="shrink-0 p-2 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition"
              aria-label="Cancel pairing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Waiting for the chef to clock in…
            <span className="ml-auto">
              Code goes cold in{' '}
              {Math.max(0, Math.floor((pairing.expiresAt - Date.now()) / 60_000))}m
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {!pairing && !isConnected && isPaired && (
          // Already paired but offline — just needs a terminal restart, no new code
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="rounded-lg bg-slate-900/80 dark:bg-black/40 border border-white/10 px-3 py-2 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <code className="text-sm font-mono text-orange-300 flex-1 overflow-x-auto whitespace-nowrap">
                {typeof window !== 'undefined' && window.location.origin !== 'https://webstew.net'
                  ? `WEBSTEW_SERVER_URL=${typeof window !== 'undefined' ? window.location.origin : ''} npx @webstew/bridge connect`
                  : 'npx @webstew/bridge connect'}
              </code>
              <button
                onClick={async () => {
                  try {
                    const serverUrl = window.location.origin
                    const cmd = serverUrl !== 'https://webstew.net'
                      ? `WEBSTEW_SERVER_URL=${serverUrl} npx @webstew/bridge connect`
                      : 'npx @webstew/bridge connect'
                    await navigator.clipboard.writeText(cmd)
                    setCopied(true); setTimeout(() => setCopied(false), 1500)
                  } catch {}
                }}
                className="shrink-0 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 pl-1">No new code needed — just run this to reconnect.</p>
          </div>
        )}
        {!pairing && !(isPaired && !isConnected) && (
          <button
            onClick={initPairing}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 hover:brightness-110 text-white text-sm font-semibold transition shadow-md shadow-orange-500/30 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            Hire your Chef
          </button>
        )}
        {isPaired && (
          <button
            onClick={disconnect}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium transition disabled:opacity-60"
          >
            <Power className="w-3.5 h-3.5" />
            Hang up apron
          </button>
        )}
        <a
          href="https://www.npmjs.com/package/@webstew/bridge"
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          docs ↗
        </a>
      </div>
    </div>
  )
}

function StatusBadge({ connected, paired }: { connected: boolean; paired: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        On the line
      </span>
    )
  }
  if (paired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Off shift
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/5 text-slate-500 border border-white/10">
      No chef yet
    </span>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="text-xs text-slate-800 dark:text-slate-200 font-mono truncate">{value}</div>
    </div>
  )
}
