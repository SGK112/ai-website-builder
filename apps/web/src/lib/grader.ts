// Website grader — TS port of remodely-ai-site/api/grader.py.
//
// Runs 12 checks on a fetched HTML document and produces a weighted score
// for SEO, technical health, presence, business essentials, and the
// money-metric: AI visibility (how likely ChatGPT / Claude / Grok / Gemini
// will find and cite this site).
//
// Differences from the Python original:
//   - Uses cheerio/slim instead of BeautifulSoup
//   - Generalized the "business essentials" patterns away from
//     Phoenix-contractor-specific terms — works for any local business
//   - Stricter HTML size + fetch timeout
//   - Same scoring weights + grade buckets so existing UI consuming the
//     remodely-grader output drops in here without changes

import * as cheerio from 'cheerio/slim'

const MAX_HTML_BYTES = 3_000_000
const FETCH_TIMEOUT_MS = 15_000

export interface GraderResult {
  success: boolean
  url: string
  domain: string
  error?: string
  scores: {
    overall: number
    overall_grade: string
    ai_visibility: number
    ai_visibility_grade: string
    business_essentials: number
    seo: { meta_tags: number; headings: number; structured_data: number }
    technical: { https: number; mobile: number; speed: number; images: number }
    presence: { social: number; contact: number; content: number }
  }
  details: {
    load_time: number | null
    word_count: number
    social_platforms: string[]
    schema_types: string[]
    ai_factors: string[]
    business_factors: string[]
  }
  issues: string[]
  recommendations: string[]
}

function normalizeUrl(u: string): string {
  let s = u.trim()
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  return s.replace(/\/+$/, '')
}

function rejectIfPrivate(u: URL) {
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    throw new Error('Refusing to grade localhost')
  }
  if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    throw new Error('Refusing to grade private network')
  }
  if (/\.local$/i.test(host) || /\.internal$/i.test(host)) {
    throw new Error('Refusing to grade internal hostname')
  }
}

function letterGrade(n: number): string {
  if (n >= 90) return 'A'
  if (n >= 80) return 'B'
  if (n >= 70) return 'C'
  if (n >= 60) return 'D'
  return 'F'
}

// Grade an already-fetched HTML string. Used by the workspace to grade
// pre-deploy drafts without actually publishing. We pass a synthetic URL
// (e.g. `https://draft.local`) so the HTTPS check still computes; that
// produces a meaningful score even though the site isn't hosted yet.
export async function gradeHtml(html: string, contextUrl: string = 'https://draft.local'): Promise<GraderResult> {
  return runAnalysis(html, contextUrl, contextUrl, null)
}

export async function gradeWebsite(input: string): Promise<GraderResult> {
  const url = normalizeUrl(input)
  const domain = (() => { try { return new URL(url).hostname } catch { return '' } })()

  let html = ''
  let loadTime: number | null = null
  let finalUrl = url
  try {
    const u = new URL(url)
    rejectIfPrivate(u)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const start = Date.now()
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Webstew/1.0 (+https://webstew.net)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      loadTime = (Date.now() - start) / 1000
      finalUrl = res.url
      if (!res.ok) throw new Error(`Source returned HTTP ${res.status}`)
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      if (!ct.includes('html') && !ct.includes('xml')) throw new Error(`Source is not HTML`)
      const buf = await res.arrayBuffer()
      if (buf.byteLength > MAX_HTML_BYTES) throw new Error('Source page too large')
      html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    } finally {
      clearTimeout(timer)
    }
  } catch (e: any) {
    return {
      success: false,
      url,
      domain,
      error: e?.message || 'Could not fetch website',
      scores: emptyScores(),
      details: { load_time: null, word_count: 0, social_platforms: [], schema_types: [], ai_factors: [], business_factors: [] },
      issues: [],
      recommendations: [],
    }
  }

  return runAnalysis(html, url, finalUrl, loadTime)
}

// Pure analysis pass — given the HTML + context URL, return a graded result.
// Extracted from gradeWebsite so the workspace can grade pre-deploy drafts.
async function runAnalysis(html: string, url: string, finalUrl: string, loadTime: number | null): Promise<GraderResult> {
  const domain = (() => { try { return new URL(url).hostname } catch { return '' } })()
  const $ = cheerio.load(html)
  const issues: string[] = []
  const recommendations: string[] = []

  // ---- HTTPS ----
  const httpsScore = url.startsWith('https://') ? 100 : 0
  if (httpsScore === 0) {
    issues.push('Website not using HTTPS - security risk')
    recommendations.push('Install SSL certificate for HTTPS')
  }

  // ---- Mobile viewport ----
  let mobileScore = 0
  const viewport = $('meta[name="viewport"]').attr('content') || ''
  if (viewport.includes('width=device-width')) mobileScore = 100
  else if (viewport) { mobileScore = 50; issues.push('Viewport meta tag exists but may not be optimal') }
  else { issues.push('No viewport meta tag - not mobile friendly'); recommendations.push('Add mobile viewport meta tag') }

  // ---- Meta tags ----
  let metaScore = 0
  const POINTS = 20
  const title = $('title').first().text().trim()
  if (title) {
    if (title.length >= 10 && title.length <= 60) metaScore += POINTS
    else { metaScore += POINTS / 2; issues.push(`Title length (${title.length} chars) should be 10-60 characters`) }
  } else { issues.push('Missing page title'); recommendations.push('Add a descriptive page title (50-60 characters)') }
  const desc = $('meta[name="description"]').attr('content') || ''
  if (desc) {
    if (desc.length >= 120 && desc.length <= 160) metaScore += POINTS
    else { metaScore += POINTS / 2; issues.push(`Meta description length (${desc.length} chars) should be 120-160 characters`) }
  } else { issues.push('Missing meta description'); recommendations.push('Add meta description for search results') }
  const ogCount = ['og:title', 'og:description', 'og:image'].filter((p) => $(`meta[property="${p}"]`).length > 0).length
  if (ogCount === 3) metaScore += POINTS
  else if (ogCount > 0) { metaScore += POINTS / 2; issues.push('Incomplete Open Graph tags for social sharing') }
  else { issues.push('No Open Graph tags - poor social media sharing'); recommendations.push('Add Open Graph tags for better social sharing') }
  if ($('link[rel="canonical"]').length > 0) metaScore += POINTS
  else issues.push('No canonical URL specified')
  if ($('meta[name="keywords"]').attr('content')) metaScore += POINTS
  metaScore = Math.min(metaScore, 100)

  // ---- Headings ----
  const h1 = $('h1').length, h2 = $('h2').length, h3 = $('h3').length
  let headingScore = 0
  if (h1 === 1) headingScore += 40
  else if (h1 > 1) { headingScore += 20; issues.push(`Multiple H1 tags found (${h1}) - should have only one`) }
  else { issues.push('No H1 tag found'); recommendations.push('Add a single H1 tag with your main keyword') }
  if (h2 >= 2) headingScore += 30
  else if (h2 === 1) headingScore += 15
  else issues.push('No H2 tags for content structure')
  if (h3 >= 1) headingScore += 30

  // ---- Images ----
  const imgs = $('img')
  let imageScore = 50
  if (imgs.length > 0) {
    let withAlt = 0, lazy = 0
    imgs.each((_, el) => {
      if ($(el).attr('alt')) withAlt++
      if (($(el).attr('loading') || '').toLowerCase() === 'lazy') lazy++
    })
    const altRatio = withAlt / imgs.length
    const lazyRatio = lazy / imgs.length
    imageScore = Math.round(altRatio * 70 + lazyRatio * 30)
    if (altRatio < 1) {
      issues.push(`${imgs.length - withAlt} images missing alt text`)
      recommendations.push('Add descriptive alt text to all images')
    }
    if (lazyRatio < 0.5 && imgs.length > 3) {
      recommendations.push('Add lazy loading to images for better performance')
    }
  }

  // ---- Page speed ----
  let speedScore = 100
  if (loadTime != null) {
    if (loadTime < 1) speedScore = 100
    else if (loadTime < 2) speedScore = 80
    else if (loadTime < 3) speedScore = 60
    else if (loadTime < 5) { speedScore = 40; issues.push(`Slow page load time: ${loadTime.toFixed(2)}s`) }
    else { speedScore = 20; issues.push(`Very slow page load: ${loadTime.toFixed(2)}s`); recommendations.push('Optimize page speed - compress images, minify CSS/JS') }
  }

  // ---- Structured data ----
  const schemaTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text())
      const walk = (n: any) => {
        if (!n || typeof n !== 'object') return
        if (Array.isArray(n)) { n.forEach(walk); return }
        const t = n['@type']
        if (typeof t === 'string') schemaTypes.push(t)
        else if (Array.isArray(t)) t.forEach((x: any) => typeof x === 'string' && schemaTypes.push(x))
        Object.values(n).forEach(walk)
      }
      walk(data)
    } catch {}
  })
  const importantSchemas = new Set(['LocalBusiness', 'Organization', 'Service', 'Product', 'FAQPage', 'HowTo', 'Review', 'AggregateRating', 'Restaurant', 'Event'])
  const foundImportant = schemaTypes.filter((s) => importantSchemas.has(s))
  let structuredScore = 0
  if (foundImportant.length >= 3) structuredScore = 100
  else if (foundImportant.length >= 2) structuredScore = 75
  else if (foundImportant.length >= 1) structuredScore = 50
  else if (schemaTypes.length > 0) structuredScore = 25
  else { issues.push('No structured data (Schema.org) found'); recommendations.push('Add LocalBusiness and Service schema for AI discoverability') }
  if (!schemaTypes.includes('FAQPage')) recommendations.push('Add FAQ schema - AI assistants love citing FAQ content')

  // ---- Social presence ----
  const socialMap: Record<string, string> = {
    'facebook.com': 'Facebook', 'twitter.com': 'Twitter/X', 'x.com': 'Twitter/X',
    'instagram.com': 'Instagram', 'linkedin.com': 'LinkedIn', 'youtube.com': 'YouTube',
    'tiktok.com': 'TikTok', 'nextdoor.com': 'Nextdoor', 'yelp.com': 'Yelp',
    'pinterest.com': 'Pinterest', 'reddit.com': 'Reddit', 'github.com': 'GitHub',
  }
  const platformsFound = new Set<string>()
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').toLowerCase()
    for (const [needle, name] of Object.entries(socialMap)) {
      if (href.includes(needle)) platformsFound.add(name)
    }
  })
  const socialList = Array.from(platformsFound)
  let socialScore = 0
  if (socialList.length >= 5) socialScore = 100
  else if (socialList.length >= 3) socialScore = 75
  else if (socialList.length >= 1) socialScore = 50
  else { issues.push('No social media links found'); recommendations.push('Add links to social profiles - increases AI visibility') }
  if (!socialList.includes('YouTube')) recommendations.push('Create YouTube presence - AI heavily indexes video content')
  if (!socialList.includes('Yelp')) recommendations.push('Claim Yelp listing - important for local AI search')

  // ---- Contact info ----
  const pageText = $('body').text().toLowerCase()
  const phoneRe = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}/
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const addressWords = ['street', ' avenue ', ' ave ', ' road ', ' rd ', 'boulevard', ' blvd ', 'suite', 'floor', ' st,', ' ln', ' dr,', ' ct,', ' way ']
  const hasPhone = phoneRe.test(html)
  const hasEmail = emailRe.test(html)
  const hasAddress = addressWords.some((w) => pageText.includes(w))
  let contactScore = 0
  if (hasPhone) contactScore += 35
  else { issues.push('No phone number visible on page'); recommendations.push('Display phone number prominently') }
  if (hasEmail) contactScore += 30
  else issues.push('No email address visible')
  if (hasAddress) contactScore += 35
  else { issues.push('No physical address found'); recommendations.push('Add full business address for local AI visibility') }

  // ---- Content quality ----
  const $copy = cheerio.load(html)
  $copy('script, style, nav, footer, header').remove()
  const cleanText = $copy('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0
  let contentScore = 0
  if (wordCount >= 1000) contentScore += 40
  else if (wordCount >= 500) contentScore += 30
  else if (wordCount >= 300) contentScore += 20
  else { issues.push(`Low content: only ${wordCount} words`); recommendations.push('Add more content - aim for 500+ words on main pages') }
  const lowerText = cleanText.toLowerCase()
  const faqInd = ['faq', 'frequently asked', 'questions', 'q:', 'a:', 'q&a']
  const hasFaq = faqInd.some((i) => lowerText.includes(i))
  if (hasFaq) contentScore += 30
  else recommendations.push('Add FAQ section - AI assistants frequently cite Q&A content')
  const serviceWords = ['service', 'we offer', 'we provide', 'our services', 'what we do', 'how we help']
  if (serviceWords.some((w) => lowerText.includes(w))) contentScore += 30
  contentScore = Math.min(contentScore, 100)

  // ---- Business essentials (generalized, not contractor-specific) ----
  let bizScore = 0
  const bizFactors: string[] = []
  const text = $('body').text().toLowerCase()
  // Service area / locations
  if (/serving|service area|we serve|locations|surrounding|valley|metro|near you/i.test(text)) {
    bizScore += 15; bizFactors.push('Service area defined')
  } else { issues.push("No service area mentioned - customers don't know if you serve them"); recommendations.push('Add service area - list cities/regions you serve') }
  // Trust signals (broadened beyond contractors)
  const trustSigs = ['licensed', 'insured', 'bonded', 'certified', 'accredited', 'warranty', 'guarantee', 'satisfaction', 'background check', 'verified', 'awarded', 'featured in', 'as seen on']
  const trustHits = trustSigs.filter((s) => text.includes(s))
  if (trustHits.length >= 3) { bizScore += 20; bizFactors.push('Strong trust signals') }
  else if (trustHits.length >= 1) { bizScore += 10; bizFactors.push('Some trust signals') }
  else { issues.push('No trust signals (license, insurance, accreditations)'); recommendations.push('Display credentials or trust badges prominently') }
  // CTAs
  const ctas = ['free quote', 'free estimate', 'get a quote', 'call now', 'call today', 'schedule', 'book', 'contact us', 'request', 'get started', 'sign up', 'start free']
  const ctaHits = ctas.filter((c) => text.includes(c))
  if (ctaHits.length >= 2) { bizScore += 15; bizFactors.push('Clear calls-to-action') }
  else if (ctaHits.length >= 1) bizScore += 8
  else { issues.push('No clear call-to-action for leads'); recommendations.push('Add prominent CTAs throughout the page') }
  // Portfolio / gallery
  if (/portfolio|gallery|our work|projects|before and after|recent work|completed|showcase|case stud/i.test(text)) {
    bizScore += 15; bizFactors.push('Portfolio/gallery present')
  } else recommendations.push('Add project/work gallery - visuals build trust')
  // Reviews
  if (/review|testimonial|customer said|clients say|what our|rated|stars|5 star|five star/i.test(text)) {
    bizScore += 15; bizFactors.push('Reviews/testimonials shown')
  } else recommendations.push('Add customer testimonials - builds trust and AI visibility')
  // Services / offerings listed (generalized)
  const offerings = ['service', 'product', 'feature', 'solution', 'plan', 'package', 'tier', 'pricing']
  const offeringHits = offerings.filter((o) => text.includes(o))
  if (offeringHits.length >= 4) { bizScore += 20; bizFactors.push('Offerings clearly listed') }
  else if (offeringHits.length >= 2) bizScore += 10
  else { issues.push('Services / offerings not clearly defined'); recommendations.push('List your services/products with detailed descriptions') }
  bizScore = Math.min(bizScore, 100)

  // ---- AI visibility — the headline metric ----
  let aiScore = 0
  const aiFactors: string[] = []
  if (structuredScore >= 75) { aiScore += 20; aiFactors.push('Strong structured data') }
  else if (structuredScore >= 50) aiScore += 12
  if (schemaTypes.includes('FAQPage')) { aiScore += 12; aiFactors.push('FAQ schema present') }
  if (socialList.length >= 4) { aiScore += 15; aiFactors.push('Strong social presence') }
  else if (socialList.length >= 2) aiScore += 8
  if (socialList.includes('YouTube')) { aiScore += 8; aiFactors.push('YouTube presence') }
  if (contactScore >= 80) { aiScore += 10; aiFactors.push('Complete contact info') }
  else if (contactScore >= 50) aiScore += 5
  if (wordCount >= 500) aiScore += 8
  if (httpsScore === 100) aiScore += 5
  if (bizScore >= 70) { aiScore += 15; aiFactors.push('Strong business presence') }
  else if (bizScore >= 40) aiScore += 8
  if (bizFactors.includes('Reviews/testimonials shown')) { aiScore += 7; aiFactors.push('Customer reviews visible') }
  aiScore = Math.min(aiScore, 100)
  if (aiScore < 50) {
    recommendations.unshift('PRIORITY: Improve AI visibility to be found by ChatGPT, Grok, Claude, etc.')
  }

  // ---- Weighted overall ----
  const weights: Record<string, number> = {
    ai_visibility: 0.22, business_essentials: 0.15, structured_data: 0.12,
    meta_tags: 0.10, mobile: 0.08, speed: 0.07, headings: 0.06,
    content: 0.06, social: 0.05, contact: 0.05, https: 0.02, images: 0.02,
  }
  const allScores: Record<string, number> = {
    ai_visibility: aiScore, business_essentials: bizScore, structured_data: structuredScore,
    meta_tags: metaScore, mobile: mobileScore, speed: speedScore, headings: headingScore,
    content: contentScore, social: socialScore, contact: contactScore, https: httpsScore, images: imageScore,
  }
  let overall = 0
  for (const [k, w] of Object.entries(weights)) overall += (allScores[k] || 0) * w
  overall = Math.round(overall)

  return {
    success: true,
    url: finalUrl,
    domain,
    scores: {
      overall,
      overall_grade: letterGrade(overall),
      ai_visibility: aiScore,
      ai_visibility_grade: letterGrade(aiScore),
      business_essentials: bizScore,
      seo: { meta_tags: metaScore, headings: headingScore, structured_data: structuredScore },
      technical: { https: httpsScore, mobile: mobileScore, speed: speedScore, images: imageScore },
      presence: { social: socialScore, contact: contactScore, content: contentScore },
    },
    details: {
      load_time: loadTime != null ? Math.round(loadTime * 100) / 100 : null,
      word_count: wordCount,
      social_platforms: socialList,
      schema_types: schemaTypes,
      ai_factors: aiFactors,
      business_factors: bizFactors,
    },
    issues: issues.slice(0, 10),
    recommendations: recommendations.slice(0, 8),
  }
}

function emptyScores() {
  return {
    overall: 0, overall_grade: 'F', ai_visibility: 0, ai_visibility_grade: 'F',
    business_essentials: 0,
    seo: { meta_tags: 0, headings: 0, structured_data: 0 },
    technical: { https: 0, mobile: 0, speed: 0, images: 0 },
    presence: { social: 0, contact: 0, content: 0 },
  }
}
