// Bridge dispatcher + token store.
//
// In-memory queues for live work (request, response stream) — fast, fine
// for v1 since we run one Render instance. Bridge sessions (pairing
// tokens, bridgeId, last-seen) live in Mongo so they survive restarts.
//
// State shape:
//   • pairingCodes: short-lived map of code → userId (~10min TTL).
//     User generates one from settings, hands to the local CLI.
//   • bridgeQueues: per-user FIFO of pending BridgeRequests waiting for
//     the bridge to pick up via /api/bridge/poll. Plus the list of
//     long-poll resolvers waiting for new work.
//   • responseStreams: per-requestId push function + close handler.
//     Set up by the agent route before enqueueing; bridge calls
//     /api/bridge/respond, which finds the push() here and forwards the
//     chunk to the agent route's SSE consumer.
//
// Everything's module-scope so all routes share the same Map instances
// within a single Node process. Multi-instance later → swap these for
// Redis pub/sub with the same external API.

import crypto from 'node:crypto'
import type {
  BridgeRequest,
  BridgeResponse,
  EmptyPoll,
  PollResponse,
  AgentRunRequest,
} from '@webstew/bridge/src/protocol'
import {
  POLL_TIMEOUT_MS,
  BRIDGE_OFFLINE_AFTER_MS,
} from '@webstew/bridge/src/protocol'
import clientPromise from '@/lib/mongodb'

// ── Singleton state ────────────────────────────────────────────────────
// Next.js dev mode compiles each API route's module graph independently.
// If we declared these Maps at module scope, every route that imports
// bridge-store.ts would get its OWN copy of the Maps — the dispatcher
// in /api/builder/agent would set a responseStream in Map-A, and
// /api/bridge/respond would look it up in Map-B (a different object).
// Result: every dispatched request looked "not open" to the responder.
// Hoist to globalThis so all module copies reference one instance.
// Same pattern Prisma + many Next libs use to survive HMR.

interface PendingCode {
  userId: string
  expiresAt: number
}

interface ResponseStream {
  push: (c: BridgeResponse) => void
  close: () => void
  /** The userId that owns this stream — lets broadcastToUser fan out. */
  userId: string
}

interface UserQueue {
  pending: BridgeRequest[]
  // Resolvers now return true if they accepted the work (fresh poll)
  // or false/undefined if they were stale (already settled via timer
  // / abort, or left over from a previous module version before the
  // removeSelf fix). Dispatcher loops until a fresh one accepts.
  pollResolvers: Array<(r: PollResponse) => boolean | void>
}

interface PendingPermission {
  userId: string
  expiresAt: number
  resolve: (decision: { approved: boolean; timedOut: boolean }) => void
}

declare global {
  // eslint-disable-next-line no-var
  var __webstewBridgeState:
    | {
        pairingCodes: Map<string, PendingCode>
        bridgeQueues: Map<string, UserQueue>
        responseStreams: Map<string, ResponseStream>
        pendingPermissions: Map<string, PendingPermission>
      }
    | undefined
}

const state = (globalThis.__webstewBridgeState ??= {
  pairingCodes: new Map<string, PendingCode>(),
  bridgeQueues: new Map<string, UserQueue>(),
  responseStreams: new Map<string, ResponseStream>(),
  pendingPermissions: new Map<string, PendingPermission>(),
})

// Defensive — `??=` only fires when the whole object is undefined.
// If we add a new field to state AFTER the singleton is initialized
// (e.g. live HMR session, or new field in a later version), the old
// object is missing the field and we get "undefined.set" / ".delete"
// crashes. Initialize each map individually here so each new field
// gets a Map either way.
state.pairingCodes ??= new Map<string, PendingCode>()
state.bridgeQueues ??= new Map<string, UserQueue>()
state.responseStreams ??= new Map<string, ResponseStream>()
state.pendingPermissions ??= new Map<string, PendingPermission>()

const pairingCodes = state.pairingCodes
const bridgeQueues = state.bridgeQueues
const responseStreams = state.responseStreams
const pendingPermissions = state.pendingPermissions

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000

function genPairingCode(): string {
  // 5 bytes → 8 base32 chars. base32-style alphabet without confusing
  // chars (no 0/O, 1/I, etc.) so users can read it off a small UI
  // chip without squinting.
  const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(5)
  let out = 'BRDG-'
  for (let i = 0; i < 8; i++) {
    out += alpha[bytes[i % 5] % alpha.length]
  }
  return out
}

export function issuePairingCode(userId: string): { code: string; expiresInSec: number } {
  // Sweep expired entries opportunistically. Cheap; the map is small.
  const now = Date.now()
  for (const [k, v] of pairingCodes.entries()) {
    if (v.expiresAt < now) pairingCodes.delete(k)
  }
  const code = genPairingCode()
  pairingCodes.set(code, { userId, expiresAt: now + PAIRING_CODE_TTL_MS })
  return { code, expiresInSec: Math.floor(PAIRING_CODE_TTL_MS / 1000) }
}

export function consumePairingCode(code: string): string | null {
  const entry = pairingCodes.get(code)
  if (!entry) return null
  pairingCodes.delete(code)
  if (entry.expiresAt < Date.now()) return null
  return entry.userId
}

// ── Bridge tokens (Mongo-backed) ───────────────────────────────────────
// Stored hashed (sha256) so a DB dump doesn't expose live tokens. The
// raw token is returned to the CLI once at pair time and never again —
// same shape as GitHub personal access tokens.

interface BridgeSessionDoc {
  _id: string                   // bridgeId
  userId: string
  tokenHash: string             // sha256(pairingToken)
  hostname: string              // free-form label from CLI
  bridgeVersion: string
  protocolVersion: string
  createdAt: Date
  lastSeenAt: Date
  revokedAt?: Date
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

async function bridgeCollection() {
  const client = await clientPromise
  return client.db('ai-website-builder').collection<BridgeSessionDoc>('bridge_sessions')
}

export async function createBridgeSession(opts: {
  userId: string
  hostname: string
  bridgeVersion: string
  protocolVersion: string
}): Promise<{ bridgeId: string; pairingToken: string }> {
  const bridgeId = 'brg_' + crypto.randomBytes(9).toString('hex')
  const pairingToken = 'wsbk_' + crypto.randomBytes(24).toString('base64url')
  const col = await bridgeCollection()
  const now = new Date()
  await col.insertOne({
    _id: bridgeId,
    userId: opts.userId,
    tokenHash: hashToken(pairingToken),
    hostname: opts.hostname.slice(0, 80),
    bridgeVersion: opts.bridgeVersion.slice(0, 32),
    protocolVersion: opts.protocolVersion.slice(0, 16),
    createdAt: now,
    lastSeenAt: now,
  })
  return { bridgeId, pairingToken }
}

export async function authenticateBridge(authHeader: string | null): Promise<
  | { ok: true; bridgeId: string; userId: string }
  | { ok: false; reason: 'missing' | 'malformed' | 'unknown' | 'revoked' }
> {
  if (!authHeader) return { ok: false, reason: 'missing' }
  const m = authHeader.match(/^Bearer\s+(\S+)$/i)
  if (!m) return { ok: false, reason: 'malformed' }
  const token = m[1]
  const col = await bridgeCollection()
  const doc = await col.findOne({ tokenHash: hashToken(token) })
  if (!doc) return { ok: false, reason: 'unknown' }
  if (doc.revokedAt) return { ok: false, reason: 'revoked' }
  // Touch lastSeenAt — drives BridgeStatus.lastSeenAt without an extra
  // heartbeat round-trip on busy bridges.
  col.updateOne({ _id: doc._id }, { $set: { lastSeenAt: new Date() } }).catch(() => {})
  return { ok: true, bridgeId: doc._id, userId: doc.userId }
}

export async function revokeBridge(userId: string, bridgeId: string): Promise<boolean> {
  const col = await bridgeCollection()
  const res = await col.updateOne(
    { _id: bridgeId, userId },
    { $set: { revokedAt: new Date() } }
  )
  // Also clear any pending requests for this user so a re-paired bridge
  // doesn't get stale work from the prior session.
  const q = bridgeQueues.get(userId)
  if (q) q.pending.length = 0
  return res.matchedCount > 0
}

export async function getBridgeSessionForUser(userId: string): Promise<BridgeSessionDoc | null> {
  const col = await bridgeCollection()
  return col.findOne(
    { userId, revokedAt: { $exists: false } as any },
    { sort: { lastSeenAt: -1 } }
  )
}

// ── Per-user request queue + long-poll resolvers ───────────────────────
// (bridgeQueues itself lives in globalThis state above — singleton)

function getOrCreateQueue(userId: string): UserQueue {
  let q = bridgeQueues.get(userId)
  if (!q) {
    q = { pending: [], pollResolvers: [] }
    bridgeQueues.set(userId, q)
  }
  return q
}

// Bridge calls this via /api/bridge/poll. Returns the next pending
// request immediately if one's queued, otherwise waits up to
// POLL_TIMEOUT_MS for one to arrive. Returns EmptyPoll on timeout so
// the bridge can re-poll without ambiguity.
export function waitForWork(userId: string, signal?: AbortSignal): Promise<PollResponse> {
  return new Promise((resolve) => {
    const q = getOrCreateQueue(userId)
    if (q.pending.length > 0) {
      resolve(q.pending.shift()!)
      return
    }
    const empty: EmptyPoll = { empty: true }
    let settled = false
    // CRITICAL: also remove ourselves from q.pollResolvers when we settle.
    // Without this, every timed-out / aborted long-poll leaves a stale
    // resolver in the array. The dispatcher's shift() then picks up
    // stale resolvers (whose settled flag is true → silent drop) and
    // never wakes the live bridge — request looks queued but is lost.
    const removeSelf = () => {
      const idx = q.pollResolvers.indexOf(onResolve)
      if (idx !== -1) q.pollResolvers.splice(idx, 1)
    }
    const onResolve = (r: PollResponse): boolean => {
      if (settled) return false
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      removeSelf()
      resolve(r)
      return true
    }
    const timer = setTimeout(() => onResolve(empty), POLL_TIMEOUT_MS)
    const onAbort = () => onResolve(empty)
    signal?.addEventListener('abort', onAbort)
    q.pollResolvers.push(onResolve)
  })
}

// Agent route calls this to dispatch a request to the bridge. Returns
// an async iterable of BridgeResponse chunks that the route can pipe
// into its SSE writer. If the bridge never responds within `timeoutMs`,
// the iterable yields an error event.
export function dispatchToBridge(
  userId: string,
  agentReq: AgentRunRequest,
  opts: { timeoutMs?: number } = {}
): { requestId: string; stream: AsyncIterable<BridgeResponse>; cancel: () => void } {
  const requestId = 'req_' + crypto.randomBytes(12).toString('hex')
  const req: BridgeRequest = { kind: 'agent.run', requestId, payload: agentReq }
  const q = getOrCreateQueue(userId)

  // Chunk buffer + signaling. Producer (bridge → /respond) calls push;
  // consumer (agent route) iterates via the async generator below. We
  // use a tiny ring of resolvers so backpressure is implicit — pushes
  // never block; consumes await the next chunk.
  const buffer: BridgeResponse[] = []
  let chunkResolver: ((c: BridgeResponse | null) => void) | null = null
  let done = false
  const push = (c: BridgeResponse) => {
    if (done) return
    if (chunkResolver) {
      const r = chunkResolver
      chunkResolver = null
      r(c)
    } else {
      buffer.push(c)
    }
    // Mark done so the next iterator pull resolves with {done: true}
    // after the consumer receives this terminal chunk.
    if (c.kind === 'done' || c.kind === 'error') {
      done = true
    }
  }
  const close = () => {
    done = true
    if (chunkResolver) {
      const r = chunkResolver
      chunkResolver = null
      r(null)
    }
  }
  responseStreams.set(requestId, { push, close, userId })

  // Hand the request to the next LIVE waiting poller. Resolvers now
  // return true if they accepted (fresh poll), false if stale (already
  // settled — could be old resolvers from before the removeSelf fix,
  // or a race with the 25s timer). Loop until one accepts or we run
  // out, in which case queue it.
  let delivered = false
  while (q.pollResolvers.length > 0) {
    const next = q.pollResolvers.shift()!
    try {
      if (next(req) === true) {
        delivered = true
        break
      }
    } catch {
      // stale resolver — keep popping
    }
  }
  if (!delivered) {
    q.pending.push(req)
  }

  // Timeout safety — if bridge never picks up + responds within window,
  // emit an error and clean up so the agent route's SSE doesn't hang.
  const timeoutMs = opts.timeoutMs ?? 180_000
  const timeoutTimer = setTimeout(() => {
    if (done) return
    push({
      requestId,
      kind: 'error',
      data: {
        message:
          'Local bridge did not respond within ' +
          Math.floor(timeoutMs / 1000) +
          's. Check that `webstew-bridge connect …` is running in your terminal.',
      },
    })
  }, timeoutMs)

  const stream: AsyncIterable<BridgeResponse> = {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<BridgeResponse>> {
          if (buffer.length > 0) {
            return { value: buffer.shift()!, done: false }
          }
          if (done) return { value: undefined as any, done: true }
          const chunk = await new Promise<BridgeResponse | null>((res) => {
            chunkResolver = res
          })
          if (chunk == null) return { value: undefined as any, done: true }
          return { value: chunk, done: false }
        },
        async return() {
          done = true
          clearTimeout(timeoutTimer)
          responseStreams.delete(requestId)
          return { value: undefined as any, done: true }
        },
      }
    },
  }

  const cancel = () => {
    done = true
    clearTimeout(timeoutTimer)
    responseStreams.delete(requestId)
  }

  return { requestId, stream, cancel }
}

// Bridge POSTs each chunk here via /api/bridge/respond — route looks it
// up by requestId and forwards. responseStreams Map lives in globalThis
// state above so all module copies (across Next.js dev HMR + per-route
// compilation) share one Map instance.

export function pushBridgeResponse(chunk: BridgeResponse): boolean {
  const s = responseStreams.get(chunk.requestId)
  if (!s) return false
  s.push(chunk)
  if (chunk.kind === 'done' || chunk.kind === 'error') {
    // Give consumers a tick to drain, then drop.
    setTimeout(() => responseStreams.delete(chunk.requestId), 100)
  }
  return true
}

/**
 * Fan out a chunk to every open responseStream for a user. Used by
 * out-of-band events that don't belong to a single requestId — e.g.
 * MCP-initiated workspace.switch_target, permission requests.
 *
 * The chunk's `requestId` is ignored; we attach the actual stream's
 * requestId before pushing so the client can route the event back to
 * the right chat session if it cares.
 */
export function broadcastToUser(userId: string, chunk: BridgeResponse): number {
  let count = 0
  for (const [reqId, s] of responseStreams.entries()) {
    if (s.userId !== userId) continue
    s.push({ ...chunk, requestId: reqId } as BridgeResponse)
    count++
  }
  return count
}

// ── Permission flow ────────────────────────────────────────────────────
// MCP tools that take destructive / navigational actions (switch_target,
// open_panel, deploy) request user permission. The request:
//   1. Generates a permissionId
//   2. Pushes a permission_request event to every open responseStream
//      for the user (so all tabs see the prompt)
//   3. Awaits resolvePermission(permissionId, approved) — called by the
//      /api/mcp/permission/resolve endpoint when the user clicks
//   4. Times out after `timeoutMs` (default 60s) if user is away

export interface PermissionPayload {
  action: string
  title: string
  description: string
  approveLabel?: string
  denyLabel?: string
  meta?: Record<string, unknown>
}

export function requestPermission(
  userId: string,
  payload: PermissionPayload,
  timeoutMs = 60_000
): Promise<{ approved: boolean; timedOut: boolean }> {
  return new Promise((resolve) => {
    const permissionId = 'perm_' + crypto.randomBytes(12).toString('hex')
    const expiresAt = Date.now() + timeoutMs
    let settled = false

    const finish = (decision: { approved: boolean; timedOut: boolean }) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      pendingPermissions.delete(permissionId)
      resolve(decision)
    }

    const timer = setTimeout(() => finish({ approved: false, timedOut: true }), timeoutMs)
    pendingPermissions.set(permissionId, {
      userId,
      expiresAt,
      resolve: (d) => finish(d),
    })

    const sent = broadcastToUser(userId, {
      requestId: '',
      kind: 'permission_request',
      data: {
        permissionId,
        action: payload.action,
        title: payload.title,
        description: payload.description,
        approveLabel: payload.approveLabel,
        denyLabel: payload.denyLabel,
        meta: payload.meta,
      },
    })

    // If nobody was listening (no open chat stream), the prompt would
    // never reach the user — fail fast instead of hanging until timeout.
    if (sent === 0) {
      finish({ approved: false, timedOut: false })
    }
  })
}

export function resolvePermission(
  permissionId: string,
  userId: string,
  approved: boolean
): boolean {
  const entry = pendingPermissions.get(permissionId)
  if (!entry) return false
  // Lock down by userId so a different signed-in user can't approve
  // someone else's permission prompt (e.g. shared dev environment).
  if (entry.userId !== userId) return false
  entry.resolve({ approved, timedOut: false })
  return true
}

// ── Live status helper ────────────────────────────────────────────────

export async function getBridgeStatus(userId: string): Promise<{
  connected: boolean
  lastSeenAt?: string
  bridgeId?: string
  hostname?: string
  bridgeVersion?: string
  inFlightRequests: number
}> {
  const sess = await getBridgeSessionForUser(userId)
  if (!sess) return { connected: false, inFlightRequests: 0 }
  const stale = Date.now() - sess.lastSeenAt.getTime() > BRIDGE_OFFLINE_AFTER_MS
  const q = bridgeQueues.get(userId)
  const inFlight =
    (q?.pending.length || 0) +
    Array.from(responseStreams.values()).filter((s) => s.userId === userId).length
  return {
    connected: !stale,
    lastSeenAt: sess.lastSeenAt.toISOString(),
    bridgeId: sess._id,
    hostname: sess.hostname,
    bridgeVersion: sess.bridgeVersion,
    inFlightRequests: inFlight,
  }
}
