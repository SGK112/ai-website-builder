import { NextRequest, NextResponse } from 'next/server'

// Google Sheets API integration
// Users can connect their own Google Sheets to receive form submissions

interface SheetConfig {
  spreadsheetId: string
  sheetName: string
  accessToken?: string
}

// Append data to a Google Sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheetId, sheetName = 'Sheet1', data, accessToken } = body

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID is required' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Data object is required' },
        { status: 400 }
      )
    }

    // Get access token from request or cookie
    const token = accessToken || request.cookies.get('google_access_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Google authentication required. Please connect your Google account.' },
        { status: 401 }
      )
    }

    // Prepare the row data
    const timestamp = new Date().toISOString()
    const values = [timestamp, ...Object.values(data).map(v => String(v))]

    // Append to sheet using Google Sheets API
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append`

    const response = await fetch(`${sheetsUrl}?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Sheets API error:', error)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Google authentication expired. Please reconnect your Google account.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to add data to sheet' },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Data added to sheet',
      updatedRange: result.updates?.updatedRange,
    })
  } catch (error) {
    console.error('Sheets sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Google Sheets' },
      { status: 500 }
    )
  }
}

// Get sheet metadata (for validation)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const spreadsheetId = searchParams.get('spreadsheetId')
  const token = request.cookies.get('google_access_token')?.value

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: 'Spreadsheet ID is required' },
      { status: 400 }
    )
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Google authentication required' },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sheet info' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      title: data.properties?.title,
      sheets: data.sheets?.map((s: any) => ({
        title: s.properties?.title,
        index: s.properties?.index,
      })),
    })
  } catch (error) {
    console.error('Sheets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sheet info' },
      { status: 500 }
    )
  }
}
