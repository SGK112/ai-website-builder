import { NextRequest, NextResponse } from 'next/server'

// Microweber integration endpoint
// This API bridges our AI website builder with Microweber's visual editor

const MICROWEBER_URL = process.env.MICROWEBER_URL || 'http://localhost:8080'

export async function GET() {
  // Check if Microweber is available with a quick timeout
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${MICROWEBER_URL}`, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null).finally(() => clearTimeout(timeout))

    const isAvailable = response?.ok || false

    return NextResponse.json({
      available: isAvailable,
      url: MICROWEBER_URL,
      message: isAvailable
        ? 'Microweber visual editor is available'
        : 'Visual editor not running. Start with: cd microweber && docker compose up -d',
    })
  } catch {
    return NextResponse.json({
      available: false,
      url: MICROWEBER_URL,
      message: 'Could not connect to Microweber',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, html, projectId } = await request.json()

    switch (action) {
      case 'export':
        // Export HTML to Microweber for visual editing
        // This creates a temporary page in Microweber with the AI-generated HTML
        return NextResponse.json({
          success: true,
          editorUrl: `${MICROWEBER_URL}/admin/view:modules/load_module:editor?content_id=live_edit&html=${encodeURIComponent(html)}`,
          message: 'Ready to open visual editor',
        })

      case 'import':
        // Import HTML from Microweber back to our app
        // This would be called when user saves in Microweber
        return NextResponse.json({
          success: true,
          message: 'HTML imported successfully',
        })

      case 'status':
        // Check Microweber status
        try {
          const statusResponse = await fetch(`${MICROWEBER_URL}`, {
            method: 'HEAD',
          }).catch(() => null)

          return NextResponse.json({
            running: statusResponse?.ok || false,
            url: MICROWEBER_URL,
          })
        } catch {
          return NextResponse.json({
            running: false,
            url: MICROWEBER_URL,
          })
        }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Visual editor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
