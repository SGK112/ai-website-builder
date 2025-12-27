import { NextRequest, NextResponse } from 'next/server'

// Google PageSpeed Insights API - Free, no key required for basic usage
const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

interface PageSpeedResult {
  score: number
  metrics: {
    firstContentfulPaint: string
    largestContentfulPaint: string
    totalBlockingTime: string
    cumulativeLayoutShift: string
    speedIndex: string
  }
  opportunities: Array<{
    title: string
    description: string
    savings: string
  }>
  diagnostics: Array<{
    title: string
    description: string
  }>
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const strategy = searchParams.get('strategy') || 'mobile' // 'mobile' or 'desktop'

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  try {
    const apiUrl = new URL(PAGESPEED_API)
    apiUrl.searchParams.set('url', url)
    apiUrl.searchParams.set('strategy', strategy)
    apiUrl.searchParams.set('category', 'performance')
    apiUrl.searchParams.set('category', 'accessibility')
    apiUrl.searchParams.set('category', 'best-practices')
    apiUrl.searchParams.set('category', 'seo')

    // Add API key if available (increases rate limit)
    if (process.env.GOOGLE_AI_API_KEY) {
      apiUrl.searchParams.set('key', process.env.GOOGLE_AI_API_KEY)
    }

    const response = await fetch(apiUrl.toString())

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PageSpeed API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to analyze page' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract relevant data
    const lighthouseResult = data.lighthouseResult
    const categories = lighthouseResult?.categories || {}
    const audits = lighthouseResult?.audits || {}

    // Format scores
    const scores = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
    }

    // Extract key metrics
    const metrics = {
      firstContentfulPaint: audits['first-contentful-paint']?.displayValue || 'N/A',
      largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || 'N/A',
      totalBlockingTime: audits['total-blocking-time']?.displayValue || 'N/A',
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      speedIndex: audits['speed-index']?.displayValue || 'N/A',
      timeToInteractive: audits['interactive']?.displayValue || 'N/A',
    }

    // Extract opportunities for improvement
    const opportunities = Object.values(audits)
      .filter((audit: any) =>
        audit.details?.type === 'opportunity' &&
        audit.score !== null &&
        audit.score < 1
      )
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        savings: audit.details?.overallSavingsMs
          ? `${Math.round(audit.details.overallSavingsMs)}ms`
          : audit.displayValue || '',
        score: audit.score,
      }))
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 5)

    // Extract diagnostics
    const diagnostics = Object.values(audits)
      .filter((audit: any) =>
        audit.details?.type === 'table' &&
        audit.score !== null &&
        audit.score < 1 &&
        !audit.details?.overallSavingsMs
      )
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
      }))
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      url,
      strategy,
      scores,
      metrics,
      opportunities,
      diagnostics,
      fetchTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('PageSpeed error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze page performance' },
      { status: 500 }
    )
  }
}
