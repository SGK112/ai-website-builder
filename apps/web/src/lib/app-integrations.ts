// Composio passthrough for PUBLISHED apps. Lets an app a user built on Webstew
// expose "connect your Stripe / Shopify / Facebook" to ITS OWN end-users, and
// run actions on their behalf — through Webstew's backend (which holds the
// COMPOSIO_API_KEY; it can never ship to the app's frontend).
//
// Isolation model: each end-user of each app is its own Composio entity,
// namespaced `app:<appId>:<appUserId>`, so one app's customers' connections
// can't collide with another app's, or with Webstew users.
//
// The app OWNER opts into which toolkits their app may use (allowedToolkits on
// app_backends) — so a generated app can't silently run, say, Stripe actions
// the owner never intended to expose.

import { connectDB } from '@/lib/db'
import { createHmac } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || 'webstew-backend-dev-secret'

export function appEntityId(appId: string, appUserId: string): string {
  return `app:${appId}:${appUserId}`
}

// Verify the HMAC end-user token minted by /api/backend/[appId]/auth
// (shape: `appId.userId.exp.sig`). Returns the appUserId or null.
export function verifyAppUserToken(appId: string, token: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [tAppId, userId, expStr, sig] = parts
  if (tAppId !== appId) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return null
  const expected = createHmac('sha256', SECRET).update(`${tAppId}.${userId}.${expStr}`).digest('base64url')
  // constant-time-ish compare
  if (sig.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0 ? userId : null
}

export interface AppBackendAuth {
  ok: boolean
  allowedToolkits: string[]
}

// Validate the app's apiKey (x-webstew-key) and return its integration config.
export async function authAppKey(appId: string, key: string | null): Promise<AppBackendAuth | null> {
  if (!key) return null
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return null
  const b = await db.collection('app_backends').findOne(
    { appId },
    { projection: { apiKey: 1, 'integrations.allowedToolkits': 1 } },
  )
  if (!b || b.apiKey !== key) return null
  return { ok: true, allowedToolkits: (b as any)?.integrations?.allowedToolkits || [] }
}

export type AppReqAuth =
  | { ok: true; allowedToolkits: string[]; appUserId: string; entity: string }
  | { ok: false; error: string; status: number }

// One call to authenticate a published-app integration request: the app's
// apiKey identifies the app; the end-user's bearer token identifies which
// customer is acting (→ their isolated Composio entity).
export async function authAppRequest(
  appId: string, key: string | null, token: string | null,
): Promise<AppReqAuth> {
  const appAuth = await authAppKey(appId, key)
  if (!appAuth) return { ok: false, error: 'Invalid or missing app key.', status: 401 }
  const appUserId = verifyAppUserToken(appId, token)
  if (!appUserId) return { ok: false, error: 'Sign in required (missing or invalid user token).', status: 401 }
  return { ok: true, allowedToolkits: appAuth.allowedToolkits, appUserId, entity: appEntityId(appId, appUserId) }
}

// Owner-side: set which toolkits an app may expose to its end-users. The app
// backend's owner is stored as `userId`.
export async function setAllowedToolkits(appId: string, ownerUserId: string, toolkits: string[]): Promise<boolean> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return false
  const res = await db.collection('app_backends').updateOne(
    { appId, userId: ownerUserId },
    { $set: { 'integrations.allowedToolkits': toolkits, updatedAt: new Date() } },
  )
  return res.matchedCount > 0
}
