'use client'

import { useState, useCallback } from 'react'
import {
  Plug,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Info,
  Zap,
  Database,
  Mail,
  Image,
  MessageSquare,
  CreditCard,
  BarChart3,
  Cloud,
  Globe,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'ai' | 'payments' | 'automation' | 'storage' | 'media' | 'analytics' | 'email' | 'auth'
  keyName: string
  keyPlaceholder: string
  docsUrl: string
  setupGuide?: string
  testEndpoint?: string
  connected?: boolean
  apiKey?: string
  required?: boolean
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  // AI Models
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, Whisper for AI chat and image generation',
    icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
    category: 'ai',
    keyName: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    setupGuide: 'Get your API key from OpenAI Dashboard > API Keys',
    testEndpoint: '/api/test/openai',
    required: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude for advanced reasoning and code generation',
    icon: <MessageSquare className="w-5 h-5 text-orange-500" />,
    category: 'ai',
    keyName: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    setupGuide: 'Get your API key from Anthropic Console > API Keys',
    testEndpoint: '/api/test/anthropic',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro for multimodal AI capabilities',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    category: 'ai',
    keyName: 'GOOGLE_AI_API_KEY',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    setupGuide: 'Get your API key from Google AI Studio',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Video generation, image models, and ML inference',
    icon: <Image className="w-5 h-5 text-purple-500" />,
    category: 'ai',
    keyName: 'REPLICATE_API_TOKEN',
    keyPlaceholder: 'r8_...',
    docsUrl: 'https://replicate.com/account/api-tokens',
    setupGuide: 'Get your token from Replicate Account > API Tokens',
  },

  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    icon: <CreditCard className="w-5 h-5 text-indigo-500" />,
    category: 'payments',
    keyName: 'STRIPE_SECRET_KEY',
    keyPlaceholder: 'sk_live_... or sk_test_...',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    setupGuide: 'Use test keys for development, live keys for production',
    testEndpoint: '/api/test/stripe',
  },
  {
    id: 'stripe_webhook',
    name: 'Stripe Webhooks',
    description: 'Handle payment events and subscription updates',
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    category: 'payments',
    keyName: 'STRIPE_WEBHOOK_SECRET',
    keyPlaceholder: 'whsec_...',
    docsUrl: 'https://dashboard.stripe.com/webhooks',
    setupGuide: 'Create a webhook endpoint and copy the signing secret',
  },

  // Storage
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    description: 'NoSQL database for flexible data storage',
    icon: <Database className="w-5 h-5 text-green-500" />,
    category: 'storage',
    keyName: 'MONGODB_URI',
    keyPlaceholder: 'mongodb+srv://user:pass@cluster...',
    docsUrl: 'https://www.mongodb.com/atlas',
    setupGuide: 'Create a cluster and get connection string from Atlas',
    required: true,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'PostgreSQL database with realtime and auth',
    icon: <Database className="w-5 h-5 text-emerald-500" />,
    category: 'storage',
    keyName: 'SUPABASE_URL',
    keyPlaceholder: 'https://xxx.supabase.co',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    setupGuide: 'Get URL and anon key from Project Settings > API',
  },
  {
    id: 'supabase_key',
    name: 'Supabase Key',
    description: 'Anonymous/service role key for Supabase',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    category: 'storage',
    keyName: 'SUPABASE_ANON_KEY',
    keyPlaceholder: 'eyJ...',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    description: 'Image and video upload, transformation, and CDN',
    icon: <Cloud className="w-5 h-5 text-blue-400" />,
    category: 'storage',
    keyName: 'CLOUDINARY_URL',
    keyPlaceholder: 'cloudinary://api_key:api_secret@cloud_name',
    docsUrl: 'https://cloudinary.com/console',
    setupGuide: 'Get URL from Dashboard > Account Details',
  },

  // Media
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice synthesis and text-to-speech',
    icon: <MessageSquare className="w-5 h-5 text-cyan-500" />,
    category: 'media',
    keyName: 'ELEVENLABS_API_KEY',
    keyPlaceholder: 'xi_...',
    docsUrl: 'https://elevenlabs.io/settings/api-keys',
    setupGuide: 'Get API key from ElevenLabs Settings > API Keys',
  },

  // Email
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email delivery',
    icon: <Mail className="w-5 h-5 text-blue-500" />,
    category: 'email',
    keyName: 'SENDGRID_API_KEY',
    keyPlaceholder: 'SG...',
    docsUrl: 'https://app.sendgrid.com/settings/api_keys',
    setupGuide: 'Create API key with full access permissions',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Modern email API for developers',
    icon: <Mail className="w-5 h-5 text-slate-700" />,
    category: 'email',
    keyName: 'RESEND_API_KEY',
    keyPlaceholder: 're_...',
    docsUrl: 'https://resend.com/api-keys',
    setupGuide: 'Get API key from Resend Dashboard',
  },

  // Analytics
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Website traffic and user analytics',
    icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
    category: 'analytics',
    keyName: 'NEXT_PUBLIC_GA_ID',
    keyPlaceholder: 'G-XXXXXXXXXX',
    docsUrl: 'https://analytics.google.com/',
    setupGuide: 'Get Measurement ID from GA4 Admin > Data Streams',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics and feature flags',
    icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
    category: 'analytics',
    keyName: 'NEXT_PUBLIC_POSTHOG_KEY',
    keyPlaceholder: 'phc_...',
    docsUrl: 'https://posthog.com/docs/getting-started',
    setupGuide: 'Get Project API Key from PostHog Settings',
  },

  // Auth
  {
    id: 'nextauth',
    name: 'NextAuth Secret',
    description: 'Session encryption for authentication',
    icon: <Shield className="w-5 h-5 text-slate-700" />,
    category: 'auth',
    keyName: 'NEXTAUTH_SECRET',
    keyPlaceholder: 'random-32-char-string',
    docsUrl: 'https://next-auth.js.org/configuration/options',
    setupGuide: 'Generate with: openssl rand -base64 32',
    required: true,
  },
  {
    id: 'github_oauth',
    name: 'GitHub OAuth',
    description: 'Sign in with GitHub',
    icon: <Globe className="w-5 h-5 text-slate-800" />,
    category: 'auth',
    keyName: 'GITHUB_CLIENT_ID',
    keyPlaceholder: 'Iv1.xxx',
    docsUrl: 'https://github.com/settings/developers',
    setupGuide: 'Create OAuth App in GitHub Developer Settings',
  },
  {
    id: 'github_secret',
    name: 'GitHub Secret',
    description: 'GitHub OAuth client secret',
    icon: <Shield className="w-5 h-5 text-slate-700" />,
    category: 'auth',
    keyName: 'GITHUB_CLIENT_SECRET',
    keyPlaceholder: 'secret',
    docsUrl: 'https://github.com/settings/developers',
  },
  {
    id: 'google_oauth',
    name: 'Google OAuth',
    description: 'Sign in with Google',
    icon: <Globe className="w-5 h-5 text-red-500" />,
    category: 'auth',
    keyName: 'GOOGLE_CLIENT_ID',
    keyPlaceholder: 'xxx.apps.googleusercontent.com',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    setupGuide: 'Create OAuth 2.0 Client ID in Google Cloud Console',
  },

  // Automation
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation and integrations',
    icon: <Zap className="w-5 h-5 text-orange-500" />,
    category: 'automation',
    keyName: 'N8N_API_KEY',
    keyPlaceholder: 'n8n_api_...',
    docsUrl: 'https://docs.n8n.io/api/',
    setupGuide: 'Generate API key in n8n Settings > API',
  },
  {
    id: 'render',
    name: 'Render',
    description: 'Deploy and host your applications',
    icon: <Cloud className="w-5 h-5 text-teal-500" />,
    category: 'automation',
    keyName: 'RENDER_API_KEY',
    keyPlaceholder: 'rnd_...',
    docsUrl: 'https://dashboard.render.com/u/settings#api-keys',
    setupGuide: 'Create API key in Render Account Settings',
  },
  {
    id: 'github_token',
    name: 'GitHub Token',
    description: 'Personal access token for deployments',
    icon: <Globe className="w-5 h-5 text-slate-800" />,
    category: 'automation',
    keyName: 'GITHUB_TOKEN',
    keyPlaceholder: 'ghp_...',
    docsUrl: 'https://github.com/settings/tokens',
    setupGuide: 'Create PAT with repo scope for deployments',
  },
]

const CATEGORIES = [
  { id: 'ai', name: 'AI Models', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  { id: 'payments', name: 'Payments', icon: <CreditCard className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'storage', name: 'Storage', icon: <Database className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  { id: 'email', name: 'Email', icon: <Mail className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  { id: 'auth', name: 'Authentication', icon: <Shield className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' },
  { id: 'automation', name: 'Automation', icon: <Zap className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  { id: 'media', name: 'Media', icon: <Image className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-700' },
]

interface IntegrationsPanelProps {
  projectId: string
  savedKeys?: Record<string, string>
  onSaveKeys: (keys: Record<string, string>) => void
}

export function IntegrationsPanel({ projectId, savedKeys = {}, onSaveKeys }: IntegrationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [keys, setKeys] = useState<Record<string, string>>(savedKeys)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ai')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error'>>({})
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const getIntegrationsByCategory = (categoryId: string) =>
    AVAILABLE_INTEGRATIONS.filter(i => i.category === categoryId)

  const connectedCount = Object.keys(keys).filter(k => keys[k]).length
  const requiredCount = AVAILABLE_INTEGRATIONS.filter(i => i.required).length
  const requiredConnected = AVAILABLE_INTEGRATIONS.filter(i => i.required && keys[i.keyName]).length

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const keysToSave = Object.fromEntries(
        Object.entries(keys).filter(([_, v]) => v && v.trim())
      )

      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: keysToSave,
          projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save credentials')
      }

      await onSaveKeys(keys)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = useCallback(async (integration: Integration) => {
    if (!integration.testEndpoint || !keys[integration.keyName]) return

    setTestingIds(prev => new Set([...prev, integration.id]))
    try {
      const response = await fetch(integration.testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keys[integration.keyName] }),
      })

      setTestResults(prev => ({
        ...prev,
        [integration.id]: response.ok ? 'success' : 'error'
      }))
    } catch {
      setTestResults(prev => ({ ...prev, [integration.id]: 'error' }))
    } finally {
      setTestingIds(prev => {
        const next = new Set(prev)
        next.delete(integration.id)
        return next
      })
    }
  }, [keys])

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-20 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Plug className="w-4 h-4" />
        <span className="text-sm font-medium">Integrations</span>
        {connectedCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs bg-white/20 rounded-full">
            {connectedCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-20 w-[420px] bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5" />
          <h3 className="font-semibold">Integrations</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {connectedCount} connected
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Required Integrations Alert */}
      {requiredConnected < requiredCount && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700">
            {requiredCount - requiredConnected} required integration(s) not configured
          </span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="px-4 py-2 bg-slate-50 border-b grid grid-cols-4 gap-2">
        {['ai', 'payments', 'storage', 'auth'].map(catId => {
          const cat = CATEGORIES.find(c => c.id === catId)
          const integrations = getIntegrationsByCategory(catId)
          const connected = integrations.filter(i => keys[i.keyName]).length
          return (
            <button
              key={catId}
              onClick={() => setExpandedCategory(catId)}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                expandedCategory === catId ? "bg-white shadow ring-1 ring-slate-200" : "hover:bg-white/50"
              )}
            >
              <div className="flex justify-center mb-1">{cat?.icon}</div>
              <div className="text-[10px] text-slate-600">{cat?.name}</div>
              <div className="text-xs font-medium">
                {connected}/{integrations.length}
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="max-h-[50vh] overflow-y-auto">
        <div className="p-3 space-y-2">
          {CATEGORIES.map(category => {
            const integrations = getIntegrationsByCategory(category.id)
            if (integrations.length === 0) return null

            const isExpanded = expandedCategory === category.id
            const connectedInCategory = integrations.filter(i => keys[i.keyName]).length

            return (
              <div key={category.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("p-1 rounded", category.color)}>
                      {category.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{category.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      connectedInCategory === integrations.length
                        ? "bg-green-100 text-green-700"
                        : connectedInCategory > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {connectedInCategory}/{integrations.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-2 space-y-2 bg-white">
                    {integrations.map(integration => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        apiKey={keys[integration.keyName] || ''}
                        showKey={showKey[integration.id] || false}
                        onToggleShow={() => toggleShowKey(integration.id)}
                        onChange={(value) => setKeys(prev => ({
                          ...prev,
                          [integration.keyName]: value
                        }))}
                        onTest={() => testConnection(integration)}
                        testing={testingIds.has(integration.id)}
                        testResult={testResults[integration.id]}
                        showTooltip={showTooltip === integration.id}
                        onShowTooltip={() => setShowTooltip(integration.id)}
                        onHideTooltip={() => setShowTooltip(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-slate-50">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full font-medium",
            saveStatus === 'success' && "bg-green-600 hover:bg-green-700",
            saveStatus === 'error' && "bg-red-600 hover:bg-red-700",
            saveStatus === 'idle' && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved Successfully!
            </>
          ) : saveStatus === 'error' ? (
            'Failed - Try Again'
          ) : (
            'Save All API Keys'
          )}
        </Button>
        <p className="text-xs text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          Keys are encrypted and stored securely
        </p>
      </div>
    </div>
  )
}

function IntegrationCard({
  integration,
  apiKey,
  showKey,
  onToggleShow,
  onChange,
  onTest,
  testing,
  testResult,
  showTooltip,
  onShowTooltip,
  onHideTooltip,
}: {
  integration: Integration
  apiKey: string
  showKey: boolean
  onToggleShow: () => void
  onChange: (value: string) => void
  onTest: () => void
  testing: boolean
  testResult?: 'success' | 'error'
  showTooltip: boolean
  onShowTooltip: () => void
  onHideTooltip: () => void
}) {
  const isConnected = Boolean(apiKey)
  const canTest = Boolean(integration.testEndpoint && apiKey)

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all",
      isConnected ? "border-green-200 bg-green-50/50" : "border-slate-200",
      integration.required && !isConnected && "border-amber-300 bg-amber-50/50"
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          {integration.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-slate-900">{integration.name}</h4>
            {integration.required && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                Required
              </span>
            )}
            {isConnected && <Check className="w-3.5 h-3.5 text-green-500" />}
            <div className="relative ml-auto">
              <button
                onMouseEnter={onShowTooltip}
                onMouseLeave={onHideTooltip}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showTooltip && integration.setupGuide && (
                <div className="absolute right-0 top-6 z-10 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg">
                  {integration.setupGuide}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>

          <div className="mt-2 flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onChange(e.target.value)}
                placeholder={integration.keyPlaceholder}
                className="h-8 text-xs pr-8 font-mono"
              />
              <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {canTest && (
              <button
                onClick={onTest}
                disabled={testing}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded transition",
                  testResult === 'success' && "bg-green-100 text-green-600",
                  testResult === 'error' && "bg-red-100 text-red-600",
                  !testResult && "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                title="Test Connection"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : testResult === 'success' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : testResult === 'error' ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
              title="View Documentation"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
