'use client'

import { useState } from 'react'
import {
  Plug,
  Key,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: 'ai' | 'payments' | 'automation' | 'storage' | 'media'
  keyName: string
  keyPlaceholder: string
  docsUrl: string
  connected?: boolean
  apiKey?: string
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, Whisper for AI chat and image generation',
    icon: '🤖',
    category: 'ai',
    keyName: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude for advanced reasoning and code generation',
    icon: '🧠',
    category: 'ai',
    keyName: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys'
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Video generation, image models, and ML inference',
    icon: '🎬',
    category: 'ai',
    keyName: 'REPLICATE_API_TOKEN',
    keyPlaceholder: 'r8_...',
    docsUrl: 'https://replicate.com/account/api-tokens'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice synthesis and text-to-speech',
    icon: '🎙️',
    category: 'media',
    keyName: 'ELEVENLABS_API_KEY',
    keyPlaceholder: 'xi_...',
    docsUrl: 'https://elevenlabs.io/settings/api-keys'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    icon: '💳',
    category: 'payments',
    keyName: 'STRIPE_SECRET_KEY',
    keyPlaceholder: 'sk_live_...',
    docsUrl: 'https://dashboard.stripe.com/apikeys'
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation and integrations',
    icon: '⚡',
    category: 'automation',
    keyName: 'N8N_API_KEY',
    keyPlaceholder: 'n8n_api_...',
    docsUrl: 'https://docs.n8n.io/api/'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Database storage and queries',
    icon: '🍃',
    category: 'storage',
    keyName: 'MONGODB_URI',
    keyPlaceholder: 'mongodb+srv://...',
    docsUrl: 'https://www.mongodb.com/atlas'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'PostgreSQL database with realtime and auth',
    icon: '⚡',
    category: 'storage',
    keyName: 'SUPABASE_URL',
    keyPlaceholder: 'https://xxx.supabase.co',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api'
  }
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

  const categories = [
    { id: 'ai', name: 'AI Models', icon: '🤖' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'automation', name: 'Automation', icon: '⚡' },
    { id: 'storage', name: 'Storage', icon: '🗄️' },
    { id: 'media', name: 'Media', icon: '🎬' }
  ]

  const getIntegrationsByCategory = (categoryId: string) =>
    AVAILABLE_INTEGRATIONS.filter(i => i.category === categoryId)

  const connectedCount = Object.keys(keys).filter(k => keys[k]).length

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      // Filter out empty keys
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

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-20 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border hover:shadow-xl transition-shadow"
      >
        <Plug className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium">Integrations</span>
        {connectedCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs bg-green-100 text-green-700 rounded-full">
            {connectedCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-20 w-96 bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Integrations</h3>
          {connectedCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {connectedCount} connected
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        <div className="p-3 space-y-2">
          {categories.map(category => {
            const integrations = getIntegrationsByCategory(category.id)
            const isExpanded = expandedCategory === category.id
            const connectedInCategory = integrations.filter(i => keys[i.keyName]).length

            return (
              <div key={category.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{category.name}</span>
                    {connectedInCategory > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {connectedInCategory}/{integrations.length}
                      </span>
                    )}
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
            "w-full",
            saveStatus === 'success' && "bg-green-600 hover:bg-green-700",
            saveStatus === 'error' && "bg-red-600 hover:bg-red-700",
            saveStatus === 'idle' && "bg-purple-600 hover:bg-purple-700"
          )}
        >
          {saving ? 'Saving...' :
           saveStatus === 'success' ? 'Saved!' :
           saveStatus === 'error' ? 'Failed - Try Again' :
           'Save API Keys'}
        </Button>
        <p className="text-xs text-slate-500 mt-2 text-center">
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
  onChange
}: {
  integration: Integration
  apiKey: string
  showKey: boolean
  onToggleShow: () => void
  onChange: (value: string) => void
}) {
  const isConnected = Boolean(apiKey)

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-colors",
      isConnected ? "border-green-200 bg-green-50/50" : "border-slate-200"
    )}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{integration.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-slate-900">{integration.name}</h4>
            {isConnected && <Check className="w-3.5 h-3.5 text-green-500" />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>

          <div className="mt-2 flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onChange(e.target.value)}
                placeholder={integration.keyPlaceholder}
                className="h-8 text-xs pr-8"
              />
              <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
