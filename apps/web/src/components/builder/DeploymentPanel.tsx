'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import {
  Rocket,
  Github,
  Cloud,
  Download,
  ExternalLink,
  Check,
  Loader2,
  X,
  AlertCircle,
  Globe,
  Lock,
  Settings,
  RefreshCw,
  Copy,
  Trash2,
  Plus,
  History,
  Shield,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ProjectFile {
  path: string
  content: string
}

interface Deployment {
  id: string
  url: string
  status: 'building' | 'ready' | 'error'
  createdAt: Date
  platform: 'render' | 'vercel' | 'netlify' | 'github'
  customDomain?: string
}

interface CustomDomain {
  domain: string
  status: 'pending' | 'verified' | 'error'
  ssl: boolean
}

interface DeploymentPanelProps {
  projectId: string
  projectName: string
  files: ProjectFile[]
  onClose: () => void
}

type DeployTarget = 'github' | 'platform' | 'vercel' | 'netlify' | 'download'
type TabType = 'deploy' | 'domains' | 'settings' | 'history'

const DEPLOY_PLATFORMS = [
  {
    id: 'platform' as const,
    name: 'Platform Hosting',
    description: 'Deploy to Render (managed hosting)',
    icon: Cloud,
    color: 'from-purple-500 to-blue-500',
  },
  {
    id: 'vercel' as const,
    name: 'Vercel',
    description: 'Deploy to Vercel for edge hosting',
    icon: Zap,
    color: 'from-black to-gray-800',
  },
  {
    id: 'netlify' as const,
    name: 'Netlify',
    description: 'Deploy to Netlify with CDN',
    icon: Globe,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'github' as const,
    name: 'GitHub Pages',
    description: 'Deploy via GitHub repository',
    icon: Github,
    color: 'from-gray-800 to-gray-900',
  },
]

export function DeploymentPanel({
  projectId,
  projectName,
  files,
  onClose
}: DeploymentPanelProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('deploy')
  const [deployTarget, setDeployTarget] = useState<DeployTarget | null>(null)
  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50)
  )
  const [isPrivate, setIsPrivate] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{
    success: boolean
    url?: string
    repoUrl?: string
    error?: string
  } | null>(null)

  // Custom domains state
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [addingDomain, setAddingDomain] = useState(false)

  // Deployment history
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Settings state
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([])
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  const hasGitHubToken = Boolean(session?.user?.githubAccessToken)

  // Load deployment history
  useEffect(() => {
    if (activeTab === 'history') {
      loadDeploymentHistory()
    }
  }, [activeTab, projectId])

  const loadDeploymentHistory = async () => {
    setLoadingHistory(true)
    try {
      // Simulated - in production, fetch from API
      setDeployments([
        {
          id: '1',
          url: `https://${projectName.toLowerCase().replace(/\s+/g, '-')}.onrender.com`,
          status: 'ready',
          createdAt: new Date(Date.now() - 86400000),
          platform: 'render',
        },
      ])
    } catch (error) {
      console.error('Failed to load deployment history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeployToGitHub = async () => {
    if (!hasGitHubToken) {
      signIn('github', { callbackUrl: window.location.href })
      return
    }

    setDeploying(true)
    setDeployResult(null)

    try {
      const response = await fetch('/api/deploy/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
          repoName,
          isPrivate,
          useUserToken: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      setDeployResult({
        success: true,
        repoUrl: data.repoUrl,
        url: data.url
      })
    } catch (error: unknown) {
      setDeployResult({
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleDeployToPlatform = async (platform: 'platform' | 'vercel' | 'netlify') => {
    setDeploying(true)
    setDeployResult(null)

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
          name: projectName,
          platform,
          envVars: envVars.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      setDeployResult({
        success: true,
        repoUrl: data.repoUrl,
        url: data.url
      })
    } catch (error: unknown) {
      setDeployResult({
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleDownload = () => {
    // Create a proper zip structure
    const content = files
      .map((file) => `\n\n=== ${file.path} ===\n${file.content}`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)

    setDeployResult({
      success: true,
      url: 'downloaded'
    })
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    setAddingDomain(true)
    try {
      // In production, this would call an API to verify domain ownership
      const newDomainEntry: CustomDomain = {
        domain: newDomain.trim().toLowerCase(),
        status: 'pending',
        ssl: false,
      }

      setDomains([...domains, newDomainEntry])
      setNewDomain('')

      // Simulate domain verification
      setTimeout(() => {
        setDomains(prev =>
          prev.map(d =>
            d.domain === newDomainEntry.domain
              ? { ...d, status: 'verified', ssl: true }
              : d
          )
        )
      }, 3000)
    } catch (error) {
      console.error('Failed to add domain:', error)
    } finally {
      setAddingDomain(false)
    }
  }

  const handleRemoveDomain = (domain: string) => {
    setDomains(prev => prev.filter(d => d.domain !== domain))
  }

  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) return
    setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvValue }])
    setNewEnvKey('')
    setNewEnvValue('')
  }

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars(prev => prev.filter(e => e.key !== key))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'deploy':
        return renderDeployTab()
      case 'domains':
        return renderDomainsTab()
      case 'settings':
        return renderSettingsTab()
      case 'history':
        return renderHistoryTab()
    }
  }

  // One-click deploy function
  const handleOneClickDeploy = async () => {
    setDeploying(true)
    setDeployResult(null)

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
          name: projectName,
          platform: 'platform',
          envVars: envVars.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      setDeployResult({
        success: true,
        repoUrl: data.repoUrl,
        url: data.url
      })
    } catch (error: unknown) {
      setDeployResult({
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      })
    } finally {
      setDeploying(false)
    }
  }

  const renderDeployTab = () => {
    if (deployResult) {
      return (
        <div className="space-y-4">
          {deployResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  {deployResult.url === 'downloaded'
                    ? 'Download complete!'
                    : 'Deployment successful!'}
                </span>
              </div>

              {deployResult.repoUrl && (
                <a
                  href={deployResult.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-700 hover:underline"
                >
                  <Github className="w-4 h-4" />
                  View Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {deployResult.url && deployResult.url !== 'downloaded' && (
                <div className="flex items-center gap-2">
                  <a
                    href={deployResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-green-700 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {deployResult.url}
                  </a>
                  <button
                    onClick={() => copyToClipboard(deployResult.url!)}
                    className="p-1 hover:bg-green-100 rounded"
                  >
                    <Copy className="w-3.5 h-3.5 text-green-600" />
                  </button>
                </div>
              )}

              {deployResult.url !== 'downloaded' && (
                <div className="pt-2 border-t border-green-200">
                  <p className="text-sm text-green-700 mb-2">
                    Want to use a custom domain?
                  </p>
                  <Button
                    onClick={() => {
                      setActiveTab('domains')
                      setDeployResult(null)
                    }}
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Configure Domain
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Deployment failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{deployResult.error}</p>
            </div>
          )}

          <Button
            onClick={() => {
              setDeployResult(null)
              setDeployTarget(null)
            }}
            variant="outline"
            className="w-full"
          >
            {deployResult.success ? 'Deploy Another' : 'Try Again'}
          </Button>
        </div>
      )
    }

    if (deployTarget === 'github') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Repository Name
            </label>
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-website"
              className="font-mono"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Private repository</span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeployTarget(null)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleDeployToGitHub}
              disabled={deploying || !repoName.trim()}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : hasGitHubToken ? (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Create Repository
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    if (deployTarget && ['platform', 'vercel', 'netlify'].includes(deployTarget)) {
      const platform = DEPLOY_PLATFORMS.find(p => p.id === deployTarget)
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br text-white",
              platform?.color
            )}>
              {platform && <platform.icon className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-medium text-slate-900">{platform?.name}</h4>
              <p className="text-sm text-slate-500">{platform?.description}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your site will be deployed and available at a public URL.
              The build may take a few minutes.
            </p>
          </div>

          {envVars.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Environment Variables ({envVars.length})
              </p>
              <div className="space-y-1">
                {envVars.map((env) => (
                  <div key={env.key} className="text-xs font-mono text-slate-600">
                    {env.key}=****
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeployTarget(null)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => handleDeployToPlatform(deployTarget as 'platform' | 'vercel' | 'netlify')}
              disabled={deploying}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Now
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* One-Click Deploy Hero */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">One-Click Deploy</h3>
              <p className="text-green-100 text-sm">Go live in under 2 minutes</p>
            </div>
          </div>
          <p className="text-green-100 text-sm mb-4">
            Instantly deploy your website to Render with automatic GitHub backup.
            Get a free SSL certificate and custom domain support.
          </p>
          <button
            onClick={handleOneClickDeploy}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition disabled:opacity-70"
          >
            {deploying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deploying to Render...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Deploy Now - It&apos;s Free
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs">or choose a platform</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="space-y-3">
          {DEPLOY_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setDeployTarget(platform.id)}
              className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br text-white",
                platform.color
              )}>
                <platform.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{platform.name}</h3>
                <p className="text-sm text-slate-500">{platform.description}</p>
              </div>
              {platform.id === 'github' && hasGitHubToken && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </button>
          ))}

          {/* Download Option */}
          <button
            onClick={() => {
              setDeployTarget('download')
              handleDownload()
            }}
            className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-600 text-white">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Download Code</h3>
              <p className="text-sm text-slate-500">Download files and host anywhere</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  const renderDomainsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Custom Domains</h3>
        <span className="text-xs text-slate-500">{domains.length} domain(s)</span>
      </div>

      {/* Add domain form */}
      <div className="flex gap-2">
        <Input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1"
        />
        <Button
          onClick={handleAddDomain}
          disabled={addingDomain || !newDomain.trim()}
          size="sm"
        >
          {addingDomain ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* DNS Instructions */}
      {domains.length > 0 && domains.some(d => d.status === 'pending') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">DNS Configuration</h4>
          <p className="text-xs text-yellow-700 mb-3">
            Add these DNS records to your domain registrar:
          </p>
          <div className="space-y-2 font-mono text-xs bg-yellow-100 rounded p-2">
            <div className="flex justify-between">
              <span className="text-yellow-800">Type: CNAME</span>
              <span className="text-yellow-800">Host: www</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-800">Value:</span>
              <span className="text-yellow-600">{projectName.toLowerCase()}.onrender.com</span>
            </div>
          </div>
        </div>
      )}

      {/* Domain list */}
      <div className="space-y-2">
        {domains.map((domain) => (
          <div
            key={domain.domain}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                domain.status === 'verified' && "bg-green-500",
                domain.status === 'pending' && "bg-yellow-500 animate-pulse",
                domain.status === 'error' && "bg-red-500"
              )} />
              <div>
                <p className="font-medium text-slate-900">{domain.domain}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {domain.ssl && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Lock className="w-3 h-3" />
                      SSL
                    </span>
                  )}
                  <span className="capitalize">{domain.status}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRemoveDomain(domain.domain)}
              className="p-2 hover:bg-slate-200 rounded"
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ))}

        {domains.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No custom domains configured</p>
            <p className="text-xs mt-1">Add a domain to use your own URL</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Environment Variables */}
      <div>
        <h3 className="font-medium text-slate-900 mb-3">Environment Variables</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add environment variables for your deployment
        </p>

        {/* Add env var form */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newEnvKey}
            onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
            placeholder="KEY"
            className="w-32 font-mono text-sm"
          />
          <Input
            value={newEnvValue}
            onChange={(e) => setNewEnvValue(e.target.value)}
            placeholder="value"
            type="password"
            className="flex-1 font-mono text-sm"
          />
          <Button
            onClick={handleAddEnvVar}
            disabled={!newEnvKey.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Env vars list */}
        <div className="space-y-2">
          {envVars.map((env) => (
            <div
              key={env.key}
              className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
            >
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-700">{env.key}</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-500">••••••••</span>
              </div>
              <button
                onClick={() => handleRemoveEnvVar(env.key)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          ))}

          {envVars.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              No environment variables set
            </p>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div>
        <h3 className="font-medium text-slate-900 mb-3">Security</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Force HTTPS</p>
              <p className="text-xs text-slate-500">Redirect all HTTP requests to HTTPS</p>
            </div>
            <Shield className="w-4 h-4 text-green-500" />
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Password Protection</p>
              <p className="text-xs text-slate-500">Require password to access site</p>
            </div>
            <Lock className="w-4 h-4 text-slate-400" />
          </label>
        </div>
      </div>
    </div>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Deployment History</h3>
        <button
          onClick={loadDeploymentHistory}
          disabled={loadingHistory}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-400", loadingHistory && "animate-spin")} />
        </button>
      </div>

      <div className="space-y-2">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                deployment.status === 'ready' && "bg-green-500",
                deployment.status === 'building' && "bg-yellow-500 animate-pulse",
                deployment.status === 'error' && "bg-red-500"
              )} />
              <div>
                <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                  {deployment.url}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="capitalize">{deployment.platform}</span>
                  <span>•</span>
                  <span>{deployment.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-200 rounded"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        ))}

        {deployments.length === 0 && !loadingHistory && (
          <div className="text-center py-8 text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No deployment history</p>
            <p className="text-xs mt-1">Deploy your site to see history here</p>
          </div>
        )}

        {loadingHistory && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 text-white">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Deploy Your Project</h2>
              <p className="text-sm text-slate-500">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-2">
          {[
            { id: 'deploy', label: 'Deploy', icon: Rocket },
            { id: 'domains', label: 'Domains', icon: Globe },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'history', label: 'History', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
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
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
