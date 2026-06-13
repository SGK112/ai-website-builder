// Shared helpers for the managed-backend admin surfaces (Data Studio +
// server-actions). All owner-authenticated paths resolve the app via the
// project's owner so one user can never read another tenant's data.

import { connectDB } from '@/lib/db'
import { randomUUID, randomBytes } from 'crypto'

export interface AppBackend {
  appId: string
  apiKey: string
  userId: string
  projectId: string | null
  name: string
}

async function getDb() {
  const mongoose = await connectDB()
  if (!mongoose.connection.db) throw new Error('DB not connected')
  return mongoose.connection.db
}

// Resolve the backend a user owns, by projectId OR appId. Returns null if the
// user doesn't own a matching backend — callers turn that into a 404/403.
export async function resolveOwnedBackend(
  userId: string,
  opts: { projectId?: string | null; appId?: string | null },
): Promise<AppBackend | null> {
  const db = await getDb()
  const filter: any = { userId }
  if (opts.appId) filter.appId = opts.appId
  else if (opts.projectId) filter.projectId = opts.projectId
  else return null
  const b = await db.collection('app_backends').findOne(filter)
  if (!b) return null
  return {
    appId: b.appId,
    apiKey: b.apiKey,
    userId: b.userId,
    projectId: b.projectId ?? null,
    name: b.name || 'App backend',
  }
}

// Collections that exist in app_data for an app, with row counts. Excludes the
// reserved auth collection (_users is surfaced separately as "Users").
export async function listAppCollections(appId: string): Promise<Array<{ collection: string; count: number }>> {
  const db = await getDb()
  const rows = await db
    .collection('app_data')
    .aggregate([
      { $match: { appId } },
      { $group: { _id: '$collection', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray()
  return rows.map((r) => ({ collection: r._id, count: r.count }))
}

export async function countAppUsers(appId: string): Promise<number> {
  const db = await getDb()
  return db.collection('app_users').countDocuments({ appId })
}

export interface ProvisionedBackend {
  appId: string
  apiKey: string
  baseUrl: string
  existing: boolean
}

// Idempotent per project: re-provisioning returns the same appId/apiKey so the
// app's key stays stable across edits and redeploys. Shared by the
// /api/backend/provision route AND the agent's provision_backend tool.
export async function provisionAppBackend(
  userId: string,
  projectId: string | null,
  name = 'App backend',
): Promise<ProvisionedBackend> {
  const db = await getDb()
  const col = db.collection('app_backends')

  if (projectId) {
    const existing = await col.findOne({ userId, projectId })
    if (existing) {
      return { appId: existing.appId, apiKey: existing.apiKey, baseUrl: `/api/backend/${existing.appId}`, existing: true }
    }
  }

  const appId = randomUUID().replace(/-/g, '').slice(0, 20)
  const apiKey = `wsk_${randomBytes(24).toString('base64url')}`
  const now = new Date()
  await col.insertOne({
    appId, apiKey, userId, projectId: projectId || null,
    name: String(name || 'App backend').slice(0, 80),
    provider: 'managed', createdAt: now, updatedAt: now,
  })
  return { appId, apiKey, baseUrl: `/api/backend/${appId}`, existing: false }
}

// The embeddable client SDK. The generated site drops this <script> in <head>,
// then calls window.WebstewDB for real auth + persisted data. Uses the absolute
// backend origin (a published site lives on a different subdomain, so a relative
// path wouldn't resolve), and the app key (a public, CORS-open anon key).
export function webstewDbClientScript(appId: string, apiKey: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.webstew.net').replace(/\/+$/, '')
  const base = `${origin}/api/backend/${appId}`
  return `<!-- WebstewDB: real backend (auth + database) for this app -->
<script>
(function(){
  var BASE=${JSON.stringify(base)}, KEY=${JSON.stringify(apiKey)}, TK="wsdb_token_${appId}";
  function tok(){ try{ return localStorage.getItem(TK)||""; }catch(e){ return ""; } }
  function headers(){ var h={"Content-Type":"application/json","x-webstew-key":KEY}; var t=tok(); if(t) h["Authorization"]="Bearer "+t; return h; }
  async function req(path, method, body){
    var r = await fetch(BASE+path, { method:method||"GET", headers:headers(), body: body?JSON.stringify(body):undefined });
    var d = await r.json().catch(function(){ return {}; });
    if(!r.ok) throw new Error(d.error || ("Request failed ("+r.status+")"));
    return d;
  }
  window.WebstewDB = {
    auth: {
      signup: async function(email, password){ var d=await req("/auth","POST",{action:"signup",email:email,password:password}); if(d.token){ try{localStorage.setItem(TK,d.token);}catch(e){} } return d; },
      login:  async function(email, password){ var d=await req("/auth","POST",{action:"login", email:email,password:password}); if(d.token){ try{localStorage.setItem(TK,d.token);}catch(e){} } return d; },
      logout: function(){ try{ localStorage.removeItem(TK); }catch(e){} },
      isLoggedIn: function(){ return !!tok(); }
    },
    collection: function(name){
      return {
        create: function(obj){ return req("/"+name,"POST",obj); },
        list:   function(){ return req("/"+name,"GET").then(function(d){ return d.items||[]; }); },
        get:    function(id){ return req("/"+name+"?id="+encodeURIComponent(id),"GET"); },
        update: function(id,obj){ return req("/"+name+"?id="+encodeURIComponent(id),"PUT",obj); },
        remove: function(id){ return req("/"+name+"?id="+encodeURIComponent(id),"DELETE"); }
      };
    }
  };
})();
</script>`
}

// Instructions the agent reads after provisioning — exactly how to wire the SDK.
export function backendUsageGuide(appId: string): string {
  return [
    `Backend ready (appId ${appId}) — REAL auth + database. Wire it like this:`,
    `1. Put the <script> block above in <head> of EVERY page that uses data/auth.`,
    `2. Auth (gates your UI): await WebstewDB.auth.signup(email,password) / .login(...);`,
    `   if (WebstewDB.auth.isLoggedIn()) { show member area } ; WebstewDB.auth.logout()`,
    `3. Data (each "collection" is a table — pick clear names):`,
    `   await WebstewDB.collection("leads").create({ name, phone, service, message })`,
    `   const jobs = await WebstewDB.collection("leads").list()      // newest first`,
    `   await WebstewDB.collection("leads").update(id, { status:"claimed" })`,
    `Use real onsubmit handlers (e.preventDefault() + await) — NEVER action="mailto:".`,
    `This is a static-site backend: data is shared per app (fine for a jobs board).`,
  ].join('\n')
}

