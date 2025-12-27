'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Globe,
  Image,
  Twitter,
  Facebook,
  Link2,
  FileText,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SEOData {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  robots: {
    index: boolean
    follow: boolean
  }
  openGraph: {
    title: string
    description: string
    image: string
    type: 'website' | 'article' | 'product'
    siteName: string
  }
  twitter: {
    card: 'summary' | 'summary_large_image' | 'player'
    site: string
    creator: string
  }
  structured: {
    type: 'Organization' | 'LocalBusiness' | 'Product' | 'Article' | 'WebPage'
    name: string
    description: string
    logo: string
  }
}

interface SEOSettingsProps {
  seoData: SEOData
  onUpdateSEO: (data: SEOData) => void
  pageUrl?: string
  onGenerateWithAI?: (field: string) => Promise<string>
}

const DEFAULT_SEO: SEOData = {
  title: '',
  description: '',
  keywords: [],
  canonicalUrl: '',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '',
    description: '',
    image: '',
    type: 'website',
    siteName: '',
  },
  twitter: {
    card: 'summary_large_image',
    site: '',
    creator: '',
  },
  structured: {
    type: 'WebPage',
    name: '',
    description: '',
    logo: '',
  },
}

type TabType = 'basic' | 'social' | 'advanced' | 'preview'

export function SEOSettings({
  seoData = DEFAULT_SEO,
  onUpdateSEO,
  pageUrl = 'https://example.com',
  onGenerateWithAI,
}: SEOSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [localData, setLocalData] = useState<SEOData>(seoData)
  const [keywordInput, setKeywordInput] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLocalData(seoData)
  }, [seoData])

  const updateField = <K extends keyof SEOData>(
    field: K,
    value: SEOData[K]
  ) => {
    const updated = { ...localData, [field]: value }
    setLocalData(updated)
    onUpdateSEO(updated)
  }

  const updateNestedField = <K extends keyof SEOData>(
    parent: K,
    field: string,
    value: unknown
  ) => {
    const updated = {
      ...localData,
      [parent]: {
        ...(localData[parent] as Record<string, unknown>),
        [field]: value,
      },
    }
    setLocalData(updated as SEOData)
    onUpdateSEO(updated as SEOData)
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !localData.keywords.includes(keywordInput.trim())) {
      updateField('keywords', [...localData.keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    updateField('keywords', localData.keywords.filter(k => k !== keyword))
  }

  const handleGenerateWithAI = async (field: string) => {
    if (!onGenerateWithAI) return
    setGenerating(field)
    try {
      const generated = await onGenerateWithAI(field)
      if (field === 'title') updateField('title', generated)
      if (field === 'description') updateField('description', generated)
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setGenerating(null)
    }
  }

  const copyMetaTags = () => {
    const tags = generateMetaTags()
    navigator.clipboard.writeText(tags)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateMetaTags = () => {
    return `<!-- Primary Meta Tags -->
<title>${localData.title}</title>
<meta name="title" content="${localData.title}">
<meta name="description" content="${localData.description}">
<meta name="keywords" content="${localData.keywords.join(', ')}">
<meta name="robots" content="${localData.robots.index ? 'index' : 'noindex'}, ${localData.robots.follow ? 'follow' : 'nofollow'}">
<link rel="canonical" href="${localData.canonicalUrl || pageUrl}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="${localData.openGraph.type}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${localData.openGraph.title || localData.title}">
<meta property="og:description" content="${localData.openGraph.description || localData.description}">
<meta property="og:image" content="${localData.openGraph.image}">
<meta property="og:site_name" content="${localData.openGraph.siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="${localData.twitter.card}">
<meta property="twitter:url" content="${pageUrl}">
<meta property="twitter:title" content="${localData.openGraph.title || localData.title}">
<meta property="twitter:description" content="${localData.openGraph.description || localData.description}">
<meta property="twitter:image" content="${localData.openGraph.image}">
${localData.twitter.site ? `<meta property="twitter:site" content="${localData.twitter.site}">` : ''}
${localData.twitter.creator ? `<meta property="twitter:creator" content="${localData.twitter.creator}">` : ''}`
  }

  // SEO Score calculation
  const calculateSEOScore = (): { score: number; issues: string[] } => {
    const issues: string[] = []
    let score = 100

    if (!localData.title) {
      issues.push('Missing page title')
      score -= 20
    } else if (localData.title.length < 30) {
      issues.push('Title is too short (aim for 50-60 characters)')
      score -= 10
    } else if (localData.title.length > 60) {
      issues.push('Title is too long (keep under 60 characters)')
      score -= 5
    }

    if (!localData.description) {
      issues.push('Missing meta description')
      score -= 20
    } else if (localData.description.length < 120) {
      issues.push('Description is too short (aim for 150-160 characters)')
      score -= 10
    } else if (localData.description.length > 160) {
      issues.push('Description is too long (keep under 160 characters)')
      score -= 5
    }

    if (localData.keywords.length === 0) {
      issues.push('No keywords defined')
      score -= 10
    }

    if (!localData.openGraph.image) {
      issues.push('Missing Open Graph image')
      score -= 15
    }

    if (!localData.canonicalUrl) {
      issues.push('No canonical URL set')
      score -= 5
    }

    return { score: Math.max(0, score), issues }
  }

  const { score, issues } = calculateSEOScore()

  const renderBasicTab = () => (
    <div className="space-y-4">
      {/* SEO Score */}
      <div className={cn(
        "p-4 rounded-lg border",
        score >= 80 ? "bg-green-50 border-green-200" :
        score >= 50 ? "bg-yellow-50 border-yellow-200" :
        "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-slate-900">SEO Score</span>
          <span className={cn(
            "text-2xl font-bold",
            score >= 80 ? "text-green-600" :
            score >= 50 ? "text-yellow-600" :
            "text-red-600"
          )}>
            {score}/100
          </span>
        </div>
        {issues.length > 0 && (
          <div className="space-y-1">
            {issues.slice(0, 3).map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                {issue}
              </div>
            ))}
            {issues.length > 3 && (
              <p className="text-xs text-slate-500">+{issues.length - 3} more issues</p>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Page Title</label>
          <span className={cn(
            "text-xs",
            localData.title.length > 60 ? "text-red-500" :
            localData.title.length > 50 ? "text-yellow-500" :
            "text-slate-400"
          )}>
            {localData.title.length}/60
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            value={localData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Your page title - keep it under 60 characters"
            className="flex-1"
          />
          {onGenerateWithAI && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateWithAI('title')}
              disabled={generating === 'title'}
            >
              {generating === 'title' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Meta Description</label>
          <span className={cn(
            "text-xs",
            localData.description.length > 160 ? "text-red-500" :
            localData.description.length > 150 ? "text-yellow-500" :
            "text-slate-400"
          )}>
            {localData.description.length}/160
          </span>
        </div>
        <div className="flex gap-2">
          <textarea
            value={localData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your page in 150-160 characters..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          {onGenerateWithAI && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateWithAI('description')}
              disabled={generating === 'description'}
              className="self-start"
            >
              {generating === 'description' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Keywords</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="Add a keyword..."
            className="flex-1"
          />
          <Button size="sm" onClick={addKeyword}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {localData.keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Canonical URL */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Canonical URL</label>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-400" />
          <Input
            value={localData.canonicalUrl}
            onChange={(e) => updateField('canonicalUrl', e.target.value)}
            placeholder={pageUrl}
            className="flex-1"
          />
        </div>
      </div>

      {/* Robots */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">Search Engine Visibility</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.robots.index}
              onChange={(e) => updateNestedField('robots', 'index', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-sm text-slate-700">Allow indexing</span>
              <p className="text-xs text-slate-500">Let search engines index this page</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.robots.follow}
              onChange={(e) => updateNestedField('robots', 'follow', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-sm text-slate-700">Allow link following</span>
              <p className="text-xs text-slate-500">Let search engines follow links on this page</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderSocialTab = () => (
    <div className="space-y-6">
      {/* Open Graph */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Facebook className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-slate-900">Open Graph (Facebook, LinkedIn)</h3>
        </div>
        <div className="space-y-3 pl-6">
          <div>
            <label className="text-sm text-slate-600 block mb-1">OG Title</label>
            <Input
              value={localData.openGraph.title}
              onChange={(e) => updateNestedField('openGraph', 'title', e.target.value)}
              placeholder={localData.title || 'Same as page title'}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">OG Description</label>
            <textarea
              value={localData.openGraph.description}
              onChange={(e) => updateNestedField('openGraph', 'description', e.target.value)}
              placeholder={localData.description || 'Same as meta description'}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">OG Image URL</label>
            <Input
              value={localData.openGraph.image}
              onChange={(e) => updateNestedField('openGraph', 'image', e.target.value)}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-slate-400 mt-1">Recommended: 1200x630 pixels</p>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Site Name</label>
            <Input
              value={localData.openGraph.siteName}
              onChange={(e) => updateNestedField('openGraph', 'siteName', e.target.value)}
              placeholder="Your Site Name"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Content Type</label>
            <select
              value={localData.openGraph.type}
              onChange={(e) => updateNestedField('openGraph', 'type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="website">Website</option>
              <option value="article">Article</option>
              <option value="product">Product</option>
            </select>
          </div>
        </div>
      </div>

      {/* Twitter Card */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Twitter className="w-4 h-4 text-sky-500" />
          <h3 className="font-medium text-slate-900">Twitter Card</h3>
        </div>
        <div className="space-y-3 pl-6">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Card Type</label>
            <select
              value={localData.twitter.card}
              onChange={(e) => updateNestedField('twitter', 'card', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary with Large Image</option>
              <option value="player">Player</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Twitter @username (Site)</label>
            <Input
              value={localData.twitter.site}
              onChange={(e) => updateNestedField('twitter', 'site', e.target.value)}
              placeholder="@yoursite"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Twitter @username (Creator)</label>
            <Input
              value={localData.twitter.creator}
              onChange={(e) => updateNestedField('twitter', 'creator', e.target.value)}
              placeholder="@creator"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* Structured Data */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-slate-900">Structured Data (JSON-LD)</h3>
        </div>
        <div className="space-y-3 pl-6">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Schema Type</label>
            <select
              value={localData.structured.type}
              onChange={(e) => updateNestedField('structured', 'type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WebPage">Web Page</option>
              <option value="Organization">Organization</option>
              <option value="LocalBusiness">Local Business</option>
              <option value="Product">Product</option>
              <option value="Article">Article</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Name</label>
            <Input
              value={localData.structured.name}
              onChange={(e) => updateNestedField('structured', 'name', e.target.value)}
              placeholder="Organization or page name"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Logo URL</label>
            <Input
              value={localData.structured.logo}
              onChange={(e) => updateNestedField('structured', 'logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </div>

      {/* Generated Meta Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-900">Generated Meta Tags</h3>
          <Button size="sm" variant="outline" onClick={copyMetaTags}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <pre className="p-3 bg-slate-900 text-green-400 rounded-lg text-xs overflow-x-auto max-h-60">
          {generateMetaTags()}
        </pre>
      </div>
    </div>
  )

  const renderPreviewTab = () => (
    <div className="space-y-6">
      {/* Google Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-blue-500" />
          <h3 className="font-medium text-slate-900">Google Search Preview</h3>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-sm text-green-700 truncate">{pageUrl}</div>
          <div className="text-lg text-blue-600 hover:underline cursor-pointer truncate">
            {localData.title || 'Page Title'}
          </div>
          <div className="text-sm text-slate-600 line-clamp-2">
            {localData.description || 'Add a meta description to see how it will appear in search results...'}
          </div>
        </div>
      </div>

      {/* Facebook Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Facebook className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-slate-900">Facebook Share Preview</h3>
        </div>
        <div className="border rounded-lg overflow-hidden max-w-md">
          {localData.openGraph.image ? (
            <div className="h-52 bg-slate-200 flex items-center justify-center">
              <Image className="w-12 h-12 text-slate-400" />
            </div>
          ) : (
            <div className="h-52 bg-slate-100 flex items-center justify-center">
              <p className="text-slate-400 text-sm">No image set</p>
            </div>
          )}
          <div className="p-3 bg-slate-50">
            <div className="text-xs text-slate-500 uppercase">{new URL(pageUrl).hostname}</div>
            <div className="font-medium text-slate-900 truncate">
              {localData.openGraph.title || localData.title || 'Page Title'}
            </div>
            <div className="text-sm text-slate-600 line-clamp-2">
              {localData.openGraph.description || localData.description || 'Page description...'}
            </div>
          </div>
        </div>
      </div>

      {/* Twitter Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Twitter className="w-4 h-4 text-sky-500" />
          <h3 className="font-medium text-slate-900">Twitter Card Preview</h3>
        </div>
        <div className="border rounded-xl overflow-hidden max-w-md">
          {localData.twitter.card === 'summary_large_image' && (
            <div className="h-52 bg-slate-200 flex items-center justify-center">
              <Image className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <div className="p-3">
            <div className="font-medium text-slate-900 truncate">
              {localData.openGraph.title || localData.title || 'Page Title'}
            </div>
            <div className="text-sm text-slate-600 line-clamp-2">
              {localData.openGraph.description || localData.description || 'Page description...'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {new URL(pageUrl).hostname}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-2">
        {[
          { id: 'basic', label: 'Basic', icon: Search },
          { id: 'social', label: 'Social', icon: Globe },
          { id: 'advanced', label: 'Advanced', icon: FileText },
          { id: 'preview', label: 'Preview', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'social' && renderSocialTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>
    </div>
  )
}
