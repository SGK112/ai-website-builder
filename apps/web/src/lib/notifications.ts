// Browser-side notification + cross-tab broadcast helper for Path B
// (background builds + "your site is ready" alerts).
//
// What it does:
//   - Asks for Notification permission ONLY when the caller explicitly
//     opts in (must be user-gesture initiated; auto-prompting at mount
//     time gets silently denied + flagged as spammy by Chrome).
//   - Fires a desktop notification when a build finishes, including when
//     the tab is backgrounded. No-ops gracefully if permission denied or
//     the user is on a browser without the API.
//   - Broadcasts the completion to any other open Webstew tabs so the
//     user's "Webstew is open in another tab" workflow still pings them.
//   - Tracks "already asked once this browser" via localStorage so we
//     don't nag.

const CHANNEL_NAME = 'webstew-builds'
const ASKED_KEY = 'webstew-notif-asked'

export type NotifKind = 'website' | 'expo' | 'astro' | 'nextjs' | 'react'

export interface BuildEvent {
  type: 'build-complete' | 'build-failed'
  kind: NotifKind
  prompt: string
  // For build-complete: a friendly summary the listener can render
  // ("12.4KB site ready", "8-file Expo app ready", etc.)
  summary?: string
  error?: string
  // Local timestamp so listeners can debounce / ignore stale events.
  ts: number
}

// ---------- Capability helpers ----------

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export function hasAskedForNotifications(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(ASKED_KEY) === '1' } catch { return false }
}

export function markAskedForNotifications(): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(ASKED_KEY, '1') } catch { /* private mode */ }
}

// Request permission. MUST be called from a user-initiated click handler —
// browsers silently deny + flag spam otherwise. Returns the new permission
// state (`granted` / `denied` / `default`).
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  markAskedForNotifications()
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

// ---------- Firing ----------

interface FireOptions {
  title: string
  body?: string
  // Click handler: by default, focus the tab that fired the notification.
  // Pass a custom onClick to override (e.g. navigate to a specific route).
  onClick?: () => void
  // SSe `tag` so a second build replaces the first popup instead of stacking.
  tag?: string
}

export function fireBrowserNotification(opts: FireOptions): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag || 'webstew-build',
      icon: '/icon.png',
      // Notification is auto-dismissed on click; keep silent so we don't
      // duplicate the OS sound across multiple Webstew tabs.
    })
    n.onclick = () => {
      try { window.focus() } catch {}
      if (opts.onClick) opts.onClick()
      n.close()
    }
    return true
  } catch {
    return false
  }
}

// ---------- Cross-tab broadcast ----------

let channel: BroadcastChannel | null = null
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (typeof BroadcastChannel === 'undefined') return null
  if (channel) return channel
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch {
    channel = null
  }
  return channel
}

// Publish a build event to any other open Webstew tab. No-op when
// BroadcastChannel isn't available (private windows in some browsers).
export function broadcastBuildEvent(event: Omit<BuildEvent, 'ts'>): void {
  const ch = getChannel()
  if (!ch) return
  try { ch.postMessage({ ...event, ts: Date.now() } satisfies BuildEvent) } catch { /* dropped */ }
}

// Subscribe to build events from other tabs. Returns an unsubscribe fn.
// The listener receives events older tabs broadcast — the local tab that
// CALLED broadcastBuildEvent will NOT receive its own message (BroadcastChannel
// behavior); fire the notification inline in the originating tab.
export function onBroadcastBuildEvent(
  listener: (event: BuildEvent) => void,
): () => void {
  const ch = getChannel()
  if (!ch) return () => {}
  const handler = (e: MessageEvent) => {
    if (e?.data && typeof e.data === 'object') listener(e.data as BuildEvent)
  }
  ch.addEventListener('message', handler)
  return () => {
    try { ch.removeEventListener('message', handler) } catch {}
  }
}
