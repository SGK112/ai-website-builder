'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Shield,
  ExternalLink,
  CheckCircle2,
  Copy,
  RefreshCw,
  Upload,
  FileText,
  Download,
  Cloud,
  Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Credential {
  id: string
  name: string
  type: string
  provider: string
  isConnected: boolean
  lastValidatedAt?: string
  createdAt: string
}

interface EnvVariable {
  key: string
  value: string
  isSecret: boolean
}

interface ProviderConfig {
  name: string
  keyName: string
  description: string
  docUrl: string
  icon: string
  placeholder: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'OpenAI',
    keyName: 'OPENAI_API_KEY',
    description: 'Required for AI website generation and chat features',
    docUrl: 'https://platform.openai.com/api-keys',
    icon: 'O',
    placeholder: 'sk-...',
  },
  {
    name: 'Anthropic',
    keyName: 'ANTHROPIC_API_KEY',
    description: 'Alternative AI model for content generation',
    docUrl: 'https://console.anthropic.com/settings/keys',
    icon: 'A',
    placeholder: 'sk-ant-...',
  },
  {
    name: 'Replicate',
    keyName: 'REPLICATE_API_TOKEN',
    description: 'For AI image generation (Flux, SDXL)',
    docUrl: 'https://replicate.com/account/api-tokens',
    icon: 'R',
    placeholder: 'r8_...',
  },
  {
    name: 'Stripe',
    keyName: 'STRIPE_SECRET_KEY',
    description: 'Enable payments for deployed websites',
    docUrl: 'https://dashboard.stripe.com/apikeys',
    icon: 'S',
    placeholder: 'sk_live_...',
  },
  {
    name: 'Render',
    keyName: 'RENDER_API_KEY',
    description: 'Deploy websites to Render hosting',
    docUrl: 'https://dashboard.render.com/u/settings/api-keys',
    icon: 'R',
    placeholder: 'rnd_...',
  },
  {
    name: 'GitHub',
    keyName: 'GITHUB_TOKEN',
    description: 'Push code to GitHub repositories',
    docUrl: 'https://github.com/settings/tokens',
    icon: 'G',
    placeholder: 'ghp_...',
  },
  {
    name: 'ElevenLabs',
    keyName: 'ELEVENLABS_API_KEY',
    description: 'AI voice generation for audio content',
    docUrl: 'https://elevenlabs.io/app/settings/api-keys',
    icon: 'E',
    placeholder: 'xi_...',
  },
  {
    name: 'SendGrid',
    keyName: 'SENDGRID_API_KEY',
    description: 'Email functionality for deployed sites',
    docUrl: 'https://app.sendgrid.com/settings/api_keys',
    icon: 'S',
    placeholder: 'SG...',
  },
]

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null)
  const [keyValue, setKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'integrations' | 'env'>('integrations')
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([])
  const [showEnvValues, setShowEnvValues] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCredentials()
    loadEnvVariables()
  }, [])

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials')
      if (res.ok) {
        const data = await res.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEnvVariables = () => {
    // Load from localStorage for now (in production, this would be from API)
    const stored = localStorage.getItem('projectEnvVariables')
    if (stored) {
      try {
        setEnvVariables(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored env variables')
      }
    }
  }

  const saveEnvVariables = (vars: EnvVariable[]) => {
    localStorage.setItem('projectEnvVariables', JSON.stringify(vars))
    setEnvVariables(vars)
  }

  const parseEnvFile = (content: string): EnvVariable[] => {
    const lines = content.split('\n')
    const variables: EnvVariable[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue

      const equalIndex = trimmed.indexOf('=')
      if (equalIndex === -1) continue

      const key = trimmed.substring(0, equalIndex).trim()
      let value = trimmed.substring(equalIndex + 1).trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      if (key) {
        const isSecret = key.toLowerCase().includes('key') ||
                         key.toLowerCase().includes('secret') ||
                         key.toLowerCase().includes('token') ||
                         key.toLowerCase().includes('password')
        variables.push({ key, value, isSecret })
      }
    }

    return variables
  }

  const handleEnvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const parsed = parseEnvFile(content)
      saveEnvVariables([...envVariables, ...parsed])
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addEnvVariable = () => {
    const newVar: EnvVariable = { key: '', value: '', isSecret: false }
    saveEnvVariables([...envVariables, newVar])
  }

  const updateEnvVariable = (index: number, field: keyof EnvVariable, value: string | boolean) => {
    const updated = [...envVariables]
    updated[index] = { ...updated[index], [field]: value }
    saveEnvVariables(updated)
  }

  const removeEnvVariable = (index: number) => {
    const updated = envVariables.filter((_, i) => i !== index)
    saveEnvVariables(updated)
  }

  const exportEnvFile = () => {
    const content = envVariables
      .filter(v => v.key && v.value)
      .map(v => `${v.key}=${v.value}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleShowEnvValue = (key: string) => {
    setShowEnvValues(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const saveCredential = async () => {
    if (!selectedProvider || !keyValue.trim()) return

    setSaving(selectedProvider.keyName)
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: { [selectedProvider.keyName]: keyValue.trim() },
        }),
      })

      if (res.ok) {
        await fetchCredentials()
        setShowAddModal(false)
        setSelectedProvider(null)
        setKeyValue('')
      }
    } catch (error) {
      console.error('Failed to save credential:', error)
    } finally {
      setSaving(null)
    }
  }

  const deleteCredential = async (name: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const res = await fetch(`/api/credentials?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCredentials(prev => prev.filter(c => c.name !== name))
      }
    } catch (error) {
      console.error('Failed to delete credential:', error)
    }
  }

  const getProviderByKeyName = (keyName: string): ProviderConfig | undefined => {
    return PROVIDERS.find(p => p.keyName === keyName)
  }

  const connectedProviders = credentials.map(c => c.name)
  const availableProviders = PROVIDERS.filter(p => !connectedProviders.includes(p.keyName))

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">API Credentials</h1>
            <p className="text-slate-400 text-sm">
              Securely store API keys for deployments and integrations
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-green-400 font-medium">Your keys are encrypted</p>
          <p className="text-xs text-green-400/70 mt-0.5">
            All API keys are encrypted using AES-256 before storage. We never log or expose your keys.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 mb-8 rounded-xl bg-white/[0.02] border border-white/[0.06] w-fit">
        <button
          onClick={() => setActiveTab('integrations')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            activeTab === 'integrations'
              ? 'bg-white/[0.1] text-white'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <Key className="w-4 h-4 inline mr-2" />
          Integrations
        </button>
        <button
          onClick={() => setActiveTab('env')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            activeTab === 'env'
              ? 'bg-white/[0.1] text-white'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Environment Variables
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".env,.env.local,.env.development,.env.production,text/plain"
        onChange={handleEnvFileUpload}
        className="hidden"
      />

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : activeTab === 'integrations' ? (
        <>
          {credentials.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Connected Services ({credentials.length})
              </h2>
              <div className="space-y-3">
                {credentials.map((cred) => {
                  const provider = getProviderByKeyName(cred.name)
                  return (
                    <motion.div
                      key={cred.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-400 font-bold">
                          {provider?.icon || cred.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {provider?.name || cred.provider}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{cred.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          Added {new Date(cred.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => deleteCredential(cred.name)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Providers */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Available Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableProviders.map((provider) => (
                <motion.button
                  key={provider.keyName}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedProvider(provider)
                    setShowAddModal(true)
                  }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-slate-400 font-bold group-hover:bg-purple-500/20 group-hover:text-purple-400 transition">
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{provider.name}</span>
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{provider.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {availableProviders.length === 0 && credentials.length === PROVIDERS.length && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-white mb-1">All services connected!</p>
              <p className="text-sm text-slate-400">You have all available integrations set up.</p>
            </div>
          )}
        </>
      ) : (
        /* Environment Variables Tab */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Env Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
              <p className="text-sm text-slate-400 mt-1">
                Configure environment variables for testing in the builder preview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] hover:text-white transition text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload .env
              </button>
              {envVariables.length > 0 && (
                <button
                  onClick={exportEnvFile}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] hover:text-white transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Cloud Sync Options */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              Sync with Cloud Provider
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Connect to your hosting provider to sync environment variables securely
            </p>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-400 hover:border-purple-500/40 transition">
                <Server className="w-4 h-4" />
                <span className="font-medium">Render</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-500/10 to-slate-400/10 border border-slate-500/20 text-slate-300 hover:border-slate-500/40 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 22.525H0l12-21.05 12 21.05z" />
                </svg>
                <span className="font-medium">Vercel</span>
              </button>
            </div>
          </div>

          {/* Variables List */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Variables ({envVariables.length})</h3>
              <button
                onClick={addEnvVariable}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variable
              </button>
            </div>

            {envVariables.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/[0.06] rounded-xl">
                <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No environment variables</p>
                <p className="text-xs text-slate-500 mb-4">
                  Upload a .env file or add variables manually
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload .env File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {envVariables.map((variable, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] group"
                  >
                    <input
                      type="text"
                      value={variable.key}
                      onChange={(e) => updateEnvVariable(index, 'key', e.target.value)}
                      placeholder="KEY_NAME"
                      className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-mono text-sm"
                    />
                    <span className="text-slate-500">=</span>
                    <div className="flex-1 relative">
                      <input
                        type={showEnvValues[`${index}`] ? 'text' : 'password'}
                        value={variable.value}
                        onChange={(e) => updateEnvVariable(index, 'value', e.target.value)}
                        placeholder="value"
                        className="w-full px-3 py-2 pr-10 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-mono text-sm"
                      />
                      <button
                        onClick={() => toggleShowEnvValue(`${index}`)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition"
                      >
                        {showEnvValues[`${index}`] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        updateEnvVariable(index, 'isSecret', !variable.isSecret)
                      }}
                      className={cn(
                        'p-2 rounded-lg transition',
                        variable.isSecret
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white'
                      )}
                      title={variable.isSecret ? 'Marked as secret' : 'Mark as secret'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeEnvVariable(index)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Integration Info */}
          {envVariables.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-400 font-medium">Ready for Preview Testing</p>
                <p className="text-xs text-blue-400/70 mt-0.5">
                  These variables will be injected into your project when testing in the builder preview.
                  Open the builder and your app will have access to these environment variables.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Credential Modal */}
      <AnimatePresence>
        {showAddModal && selectedProvider && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-[#0c0c14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {selectedProvider.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Connect {selectedProvider.name}
                      </h3>
                      <p className="text-sm text-slate-400">{selectedProvider.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {selectedProvider.keyName}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyValue}
                      onChange={(e) => setKeyValue(e.target.value)}
                      placeholder={selectedProvider.placeholder}
                      className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <a
                    href={selectedProvider.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-purple-400 hover:text-purple-300"
                  >
                    Get your API key <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedProvider(null)
                        setKeyValue('')
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCredential}
                      disabled={!keyValue.trim() || saving === selectedProvider.keyName}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving === selectedProvider.keyName ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
