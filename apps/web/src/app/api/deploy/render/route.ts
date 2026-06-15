import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'

const RENDER_API_KEY = process.env.RENDER_API_KEY
const RENDER_API_URL = 'https://api.render.com/v1'

interface DeployRequest {
  html: string
  projectName: string
  pages?: { name: string; html: string }[]
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication to deploy
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit: 10 deployments per hour
    try {
      await checkApiRateLimit(request, 'deployment')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    if (!RENDER_API_KEY) {
      return NextResponse.json({ error: 'Render API not configured' }, { status: 500 })
    }

    const { html, projectName, pages }: DeployRequest = await request.json()

    if (!html || !projectName) {
      return NextResponse.json({ error: 'HTML and project name required' }, { status: 400 })
    }

    // Generate full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; }
    .font-serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body>
${html}
</body>
</html>`

    // For now, return the deployment-ready HTML
    // Full Render static site deployment requires GitHub integration
    // This endpoint prepares the files and can trigger deployment

    // Check if we have GitHub token for full deployment
    if (process.env.GITHUB_ACCESS_TOKEN) {
      // Create a gist or repo with the site files
      const gistResponse = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `${projectName} - Built with Webstew`,
          public: true,
          files: {
            'index.html': { content: fullHtml },
            ...(pages?.reduce((acc, page) => ({
              ...acc,
              [`${page.name.toLowerCase().replace(/\s+/g, '-')}.html`]: {
                content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name} - ${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; margin: 0; }</style>
</head>
<body>
${page.html}
</body>
</html>`
              }
            }), {})),
          },
        }),
      })

      if (gistResponse.ok) {
        const gist = await gistResponse.json()
        return NextResponse.json({
          success: true,
          gistUrl: gist.html_url,
          rawUrl: gist.files['index.html'].raw_url,
          message: 'Site files created successfully',
          files: Object.keys(gist.files),
        })
      }
    }

    // Fallback: Return downloadable files
    return NextResponse.json({
      success: true,
      html: fullHtml,
      projectName,
      message: 'Site ready for deployment',
    })
  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 })
  }
}

// GET endpoint to check Render services
export async function GET() {
  try {
    // Don't leak platform Render service names/IDs to anonymous callers.
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!RENDER_API_KEY) {
      return NextResponse.json({ configured: false })
    }

    const response = await fetch(`${RENDER_API_URL}/services?limit=5`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
      },
    })

    if (response.ok) {
      const services = await response.json()
      return NextResponse.json({
        configured: true,
        services: services.map((s: any) => ({
          id: s.service.id,
          name: s.service.name,
          type: s.service.type,
          status: s.service.suspended,
        })),
      })
    }

    return NextResponse.json({ configured: true, services: [] })
  } catch (error) {
    return NextResponse.json({ configured: false, error: 'Failed to fetch services' })
  }
}
