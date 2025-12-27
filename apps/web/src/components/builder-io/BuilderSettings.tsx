'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Check, X, Loader2, Key, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BuilderSettingsProps {
  onApiKeyChange?: (apiKey: string) => void
}

export function BuilderSettings({ onApiKeyChange }: BuilderSettingsProps) {
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // Check if already configured via environment
  useEffect(() => {
    async function checkConfig() {
      try {
        const response = await fetch('/api/builder-io', { method: 'HEAD' })
        setIsConfigured(response.ok)
        if (response.ok) {
          setIsValid(true)
        }
      } catch {
        setIsConfigured(false)
      }
    }
    checkConfig()
  }, [])

  const validateApiKey = async () => {
    if (!apiKey.trim()) return

    setIsValidating(true)
    setIsValid(null)

    try {
      // Try to fetch from Builder.io with the provided key
      const response = await fetch(
        `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey.trim()}&limit=1`
      )

      if (response.ok) {
        setIsValid(true)
        onApiKeyChange?.(apiKey.trim())
      } else {
        setIsValid(false)
      }
    } catch {
      setIsValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>Builder.io Integration</CardTitle>
            <CardDescription>
              Connect Builder.io for visual content editing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="p-1.5 bg-green-500 rounded-full">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Builder.io Connected
              </p>
              <p className="text-sm text-muted-foreground">
                API key configured via environment variables
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="builder-api-key">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Public API Key
                </div>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="builder-api-key"
                  type="text"
                  placeholder="Enter your Builder.io public API key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setIsValid(null)
                  }}
                  className={
                    isValid === true
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : isValid === false
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                <Button
                  onClick={validateApiKey}
                  disabled={!apiKey.trim() || isValidating}
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
              {isValid === true && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  API key is valid
                </p>
              )}
              {isValid === false && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Invalid API key
                </p>
              )}
            </div>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have a Builder.io account?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://builder.io/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Create Free Account
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.builder.io/c/docs/using-your-api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Find Your API Key
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* What you can do with Builder.io */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">What you can do:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Drag-and-drop visual editing
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Let non-developers edit content
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              A/B testing built-in
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Schedule content publishing
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Works alongside your existing pages
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
