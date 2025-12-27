import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Credential } from '@ai-website-builder/database'
import { EncryptionService } from '@ai-website-builder/shared'

// Lazy initialization to avoid build-time errors
let encryptionService: EncryptionService | null = null
function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
      throw new Error('ENCRYPTION_KEY must be configured with at least 32 characters')
    }
    encryptionService = new EncryptionService()
  }
  return encryptionService
}

// GET /api/credentials - Get user's credentials (keys masked)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const credentials = await Credential.find({ userId: session.user.id })
      .select('-credentials')
      .lean()

    // Return credentials with masked keys
    const maskedCredentials = credentials.map(cred => ({
      id: cred._id,
      name: cred.name,
      type: cred.type,
      provider: cred.provider,
      isConnected: cred.isValid,
      lastValidatedAt: cred.lastValidatedAt,
      createdAt: cred.createdAt,
    }))

    return NextResponse.json({ credentials: maskedCredentials })
  } catch (error) {
    console.error('GET credentials error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

// POST /api/credentials - Save or update credentials
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credentials: userCredentials, projectId } = await req.json()

    if (!userCredentials || typeof userCredentials !== 'object') {
      return NextResponse.json({ error: 'Credentials object is required' }, { status: 400 })
    }

    await connectDB()

    const results: { name: string; success: boolean; error?: string }[] = []

    // Process each credential
    for (const [keyName, value] of Object.entries(userCredentials)) {
      if (!value || typeof value !== 'string') continue

      try {
        // Determine credential type from key name
        const typeInfo = getCredentialType(keyName)
        if (!typeInfo) continue

        // Encrypt the credential value
        const encryptedValue = getEncryptionService().encrypt(value as string)

        // Upsert credential
        await Credential.findOneAndUpdate(
          {
            userId: session.user.id,
            name: keyName,
          },
          {
            userId: session.user.id,
            name: keyName,
            type: typeInfo.type,
            provider: typeInfo.provider,
            credentials: { apiKey: encryptedValue },
            isValid: true,
            lastValidatedAt: new Date(),
            $addToSet: projectId ? { projectIds: projectId } : {},
          },
          { upsert: true, new: true }
        )

        results.push({ name: keyName, success: true })
      } catch (err: any) {
        results.push({ name: keyName, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      savedCount: results.filter(r => r.success).length,
    })
  } catch (error) {
    console.error('POST credentials error:', error)
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    )
  }
}

// DELETE /api/credentials - Remove a credential
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const credentialId = searchParams.get('id')
    const credentialName = searchParams.get('name')

    if (!credentialId && !credentialName) {
      return NextResponse.json(
        { error: 'Credential ID or name is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const query = credentialId
      ? { _id: credentialId, userId: session.user.id }
      : { name: credentialName, userId: session.user.id }

    const result = await Credential.deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE credentials error:', error)
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    )
  }
}

// Helper to determine credential type from key name
function getCredentialType(keyName: string): { type: string; provider: string } | null {
  const mappings: Record<string, { type: string; provider: string }> = {
    OPENAI_API_KEY: { type: 'openai', provider: 'OpenAI' },
    ANTHROPIC_API_KEY: { type: 'anthropic', provider: 'Anthropic' },
    REPLICATE_API_TOKEN: { type: 'custom', provider: 'Replicate' },
    ELEVENLABS_API_KEY: { type: 'custom', provider: 'ElevenLabs' },
    STRIPE_SECRET_KEY: { type: 'stripe', provider: 'Stripe' },
    STRIPE_PUBLISHABLE_KEY: { type: 'stripe', provider: 'Stripe' },
    N8N_API_KEY: { type: 'custom', provider: 'n8n' },
    N8N_WEBHOOK_URL: { type: 'custom', provider: 'n8n' },
    MONGODB_URI: { type: 'mongodb', provider: 'MongoDB' },
    SUPABASE_URL: { type: 'custom', provider: 'Supabase' },
    SUPABASE_ANON_KEY: { type: 'custom', provider: 'Supabase' },
    GITHUB_TOKEN: { type: 'github', provider: 'GitHub' },
    RENDER_API_KEY: { type: 'render', provider: 'Render' },
    GOOGLE_AI_API_KEY: { type: 'google', provider: 'Google AI' },
    SENDGRID_API_KEY: { type: 'sendgrid', provider: 'SendGrid' },
    TWILIO_AUTH_TOKEN: { type: 'twilio', provider: 'Twilio' },
    CLOUDINARY_API_SECRET: { type: 'cloudinary', provider: 'Cloudinary' },
  }

  return mappings[keyName] || { type: 'custom', provider: keyName }
}
