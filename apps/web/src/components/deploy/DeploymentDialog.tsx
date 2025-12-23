'use client'

import { useState } from 'react'
import { Rocket, Loader2, ExternalLink, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeploymentDialogProps {
  projectId: string
  projectName: string
  onSuccess?: () => void
}

export function DeploymentDialog({ projectId, projectName, onSuccess }: DeploymentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [repoName, setRepoName] = useState(
    projectName.toLowerCase().replace(/\s+/g, '-')
  )
  const [deploying, setDeploying] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    repositoryUrl?: string
    deploymentUrl?: string
    error?: string
  } | null>(null)

  const handleDeploy = async () => {
    if (!githubToken) {
      alert('Please enter your GitHub token')
      return
    }

    setDeploying(true)
    setResult(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          repositoryName: repoName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, error: data.error || 'Deployment failed' })
        return
      }

      setResult({
        success: true,
        repositoryUrl: data.deployment.repositoryUrl,
        deploymentUrl: data.deployment.deploymentUrl,
      })

      onSuccess?.()
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setDeploying(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Rocket className="h-4 w-4 mr-2" />
        Deploy to GitHub
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Deploy Project</CardTitle>
          <CardDescription>
            Deploy your project to GitHub (and optionally Render)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="githubToken">
                  GitHub Personal Access Token
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Create token <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required scopes: repo, workflow
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repoName">Repository Name</Label>
                <Input
                  id="repoName"
                  placeholder="my-website"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleDeploy}
                  disabled={deploying || !githubToken}
                  className="flex-1"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={deploying}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : result.success ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Deployment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your project has been deployed to GitHub
                </p>
              </div>

              {result.repositoryUrl && (
                <a
                  href={result.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Github className="h-5 w-5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">View on GitHub</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.repositoryUrl}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              )}

              <Button onClick={() => setIsOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Deployment Failed</h3>
                <p className="text-sm text-red-600">{result.error}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setResult(null)} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
