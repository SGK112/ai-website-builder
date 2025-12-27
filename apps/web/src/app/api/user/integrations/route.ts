import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClient } from '@/lib/mongodb'
import { encrypt, decrypt } from '@/lib/encryption'

// GET - Retrieve user's connected integrations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClient()
    const db = client.db()

    const userIntegrations = await db.collection('user_integrations').findOne({
      email: session.user.email,
    })

    if (!userIntegrations) {
      return NextResponse.json({
        services: [
          { id: 'unsplash', name: 'Unsplash', connected: false },
          { id: 'pexels', name: 'Pexels', connected: false },
          { id: 'pixabay', name: 'Pixabay', connected: false },
          { id: 'canva', name: 'Canva', connected: false },
        ],
        keys: {},
      })
    }

    // Return connection status (not the actual keys for security)
    const services = [
      { id: 'unsplash', name: 'Unsplash', connected: !!userIntegrations.unsplash },
      { id: 'pexels', name: 'Pexels', connected: !!userIntegrations.pexels },
      { id: 'pixabay', name: 'Pixabay', connected: !!userIntegrations.pixabay },
      { id: 'canva', name: 'Canva', connected: !!userIntegrations.canva_client_id },
    ]

    // Return masked keys for display
    const keys = {
      unsplash: userIntegrations.unsplash ? maskKey(decrypt(userIntegrations.unsplash)) : '',
      pexels: userIntegrations.pexels ? maskKey(decrypt(userIntegrations.pexels)) : '',
      pixabay: userIntegrations.pixabay ? maskKey(decrypt(userIntegrations.pixabay)) : '',
      canva_client_id: userIntegrations.canva_client_id ? maskKey(decrypt(userIntegrations.canva_client_id)) : '',
      canva_client_secret: userIntegrations.canva_client_secret ? '••••••••' : '',
    }

    return NextResponse.json({ services, keys })
  } catch (error) {
    console.error('Failed to get integrations:', error)
    return NextResponse.json({ error: 'Failed to get integrations' }, { status: 500 })
  }
}

// POST - Save user's integration API keys
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { unsplash, pexels, pixabay, canva_client_id, canva_client_secret } = body

    const client = await getClient()
    const db = client.db()

    // Encrypt API keys before storing
    const encryptedData: Record<string, string> = {}

    if (unsplash && !unsplash.includes('•')) {
      encryptedData.unsplash = encrypt(unsplash)
    }
    if (pexels && !pexels.includes('•')) {
      encryptedData.pexels = encrypt(pexels)
    }
    if (pixabay && !pixabay.includes('•')) {
      encryptedData.pixabay = encrypt(pixabay)
    }
    if (canva_client_id && !canva_client_id.includes('•')) {
      encryptedData.canva_client_id = encrypt(canva_client_id)
    }
    if (canva_client_secret && !canva_client_secret.includes('•')) {
      encryptedData.canva_client_secret = encrypt(canva_client_secret)
    }

    await db.collection('user_integrations').updateOne(
      { email: session.user.email },
      {
        $set: {
          ...encryptedData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save integrations:', error)
    return NextResponse.json({ error: 'Failed to save integrations' }, { status: 500 })
  }
}

// Helper to mask API keys for display
function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}
