'use client'

import { useState } from 'react'
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
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ProjectFile {
  path: string
  content: string
}

interface DeploymentPanelProps {
  projectId: string
  projectName: string
  files: ProjectFile[]
  onClose: () => void
}

type DeployTarget = 'github' | 'platform' | 'download'

export function DeploymentPanel({
  projectId,
  projectName,
  files,
  onClose
}: DeploymentPanelProps) {
  const { data: session } = useSession()
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

  const hasGitHubToken = Boolean(session?.user?.githubAccessToken)

  const handleDeployToGitHub = async () => {
    if (!hasGitHubToken) {
      // Redirect to GitHub OAuth
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
    } catch (error: any) {
      setDeployResult({
        success: false,
        error: error.message
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleDeployToPlatform = async () => {
    setDeploying(true)
    setDeployResult(null)

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
          name: projectName
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
    } catch (error: any) {
      setDeployResult({
        success: false,
        error: error.message
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleDownload = () => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 text-white">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Deploy Your Project</h2>
              <p className="text-sm text-slate-500">Choose how to publish your website</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Deployment Options */}
          {!deployTarget && !deployResult && (
            <div className="space-y-3">
              {/* GitHub Option */}
              <button
                onClick={() => setDeployTarget('github')}
                className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white">
                  <Github className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Deploy to Your GitHub</h3>
                  <p className="text-sm text-slate-500">
                    {hasGitHubToken
                      ? 'Create a repo in your GitHub account'
                      : 'Connect your GitHub account to deploy'}
                  </p>
                </div>
                {hasGitHubToken && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </button>

              {/* Platform Hosting Option */}
              <button
                onClick={() => setDeployTarget('platform')}
                className="w-full flex items-center gap-4 p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  <Cloud className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Platform Hosting</h3>
                  <p className="text-sm text-slate-500">
                    Deploy to our managed hosting (Render)
                  </p>
                </div>
              </button>

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
                  <p className="text-sm text-slate-500">
                    Download files and host anywhere
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* GitHub Configuration */}
          {deployTarget === 'github' && !deployResult && (
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
          )}

          {/* Platform Deployment */}
          {deployTarget === 'platform' && !deployResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Your site will be deployed to Render and available at a public URL.
                  The build may take a few minutes.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeployTarget(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDeployToPlatform}
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
          )}

          {/* Result */}
          {deployResult && (
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
                    <a
                      href={deployResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-700 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {deployResult.url}
                    </a>
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
                {deployResult.success ? 'Done' : 'Try Again'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
