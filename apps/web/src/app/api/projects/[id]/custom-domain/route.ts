// POST /api/projects/[id]/custom-domain — attach a custom domain to the
// Render service backing this project. Returns the DNS records the user
// needs to configure at their registrar.
//
// Flow:
//   1. Owner check on the project
//   2. Pull the deployed serviceId from project.deployment (we stored it at
//      deploy time)
//   3. Resolve user's Render API key (BYO first, env fallback)
//   4. POST /v1/services/{serviceId}/custom-domains { name }
//   5. Return Render's response — includes DNS records (CNAME/A) + verifying
//      status. Render auto-issues a Let's Encrypt cert once DNS resolves.
//
// DELETE removes the custom domain from Render + clears the field on the
// project.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { getUserCredential } from '@/lib/credentials-store'

export const dynamic = 'force-dynamic'

const ENV_RENDER_API_KEY = process.env.RENDER_API_KEY

interface Ctx { params: { id: string } }

async function getRenderKey(userId: string): Promise<string | null> {
  return (await getUserCredential(userId, 'render')) || ENV_RENDER_API_KEY || null
}

async function loadProject(projectId: string, userId: string) {
  if (!ObjectId.isValid(projectId)) return { ok: false as const, status: 400, error: 'Invalid projectId' }
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return { ok: false as const, status: 500, error: 'DB not connected' }
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) })
  if (!project) return { ok: false as const, status: 404, error: 'Project not found' }
  if (project.userId?.toString?.() !== userId) {
    return { ok: false as const, status: 403, error: 'Project ownership mismatch' }
  }
  return { ok: true as const, db, project }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const name = String(body?.name || '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(name)) {
    return NextResponse.json({ error: 'Domain looks invalid' }, { status: 400 })
  }

  const loaded = await loadProject(params.id, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  const { project, db } = loaded

  // Primary path: workspace deploy stores it directly on project.deployment.
  // Fallback: an older deploy path (since removed) only wrote a
  // Deployment record and stores its id on project.deploymentId, so look the
  // service id up there if the canonical field is missing.
  let serviceId: string | undefined = project.deployment?.renderServiceId
  if (!serviceId && project.deploymentId) {
    try {
      const depDoc = await db.collection('deployments').findOne(
        { _id: typeof project.deploymentId === 'string' ? new ObjectId(project.deploymentId) : project.deploymentId },
      )
      serviceId = depDoc?.renderServiceId || depDoc?.serviceId
    } catch { /* leave undefined — will hit the 400 below */ }
  }
  if (!serviceId) {
    return NextResponse.json({
      error: 'Project has no Render service to attach a domain to. Deploy via the workspace Ship button first — that path provisions the Render service custom domains hook into.',
      needsDeploy: true,
    }, { status: 400 })
  }

  const renderKey = await getRenderKey(session.user.id)
  if (!renderKey) {
    return NextResponse.json({
      error: 'No Render API key. Add one in Profile → Settings → Deploy credentials.',
      needsCredential: 'render',
    }, { status: 400 })
  }

  // Render: POST /v1/services/{id}/custom-domains
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/custom-domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${renderKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({
      error: `Render rejected domain: ${res.status} ${text.slice(0, 300)}`,
    }, { status: 502 })
  }
  const renderData = await res.json().catch(() => ({}))

  // Persist on the project so we can show DNS instructions later + clean up
  // on delete.
  await db.collection('projects').updateOne(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        customDomain: {
          name,
          renderDomainId: renderData?.id,
          verificationStatus: renderData?.verificationStatus || 'pending',
          dnsRecords: renderData?.dnsRecords || null,
          attachedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    },
  )

  return NextResponse.json({ ok: true, customDomain: { name, ...renderData } })
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const loaded = await loadProject(params.id, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  return NextResponse.json({ customDomain: loaded.project.customDomain || null })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const loaded = await loadProject(params.id, session.user.id)
  if (!loaded.ok) return NextResponse.json({ error: loaded.error }, { status: loaded.status })
  const { project, db } = loaded
  const cd = project.customDomain
  if (!cd) return NextResponse.json({ ok: true })

  const serviceId = project.deployment?.renderServiceId
  const renderKey = await getRenderKey(session.user.id)
  if (renderKey && serviceId && cd.renderDomainId) {
    // Best-effort delete on Render — if it fails we still clear local state.
    try {
      await fetch(`https://api.render.com/v1/services/${serviceId}/custom-domains/${cd.renderDomainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${renderKey}` },
      })
    } catch {}
  }

  await db.collection('projects').updateOne(
    { _id: new ObjectId(params.id) },
    { $unset: { customDomain: '' }, $set: { updatedAt: new Date() } },
  )
  return NextResponse.json({ ok: true })
}
