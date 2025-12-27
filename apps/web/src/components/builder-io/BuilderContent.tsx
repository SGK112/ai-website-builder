'use client'

import { useEffect, useState } from 'react'
import { BuilderComponent, useIsPreviewing } from '@builder.io/react'
import { builder, isBuilderConfigured } from '@/lib/builder-io'
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface BuilderContentProps {
  model: string
  content?: any
  apiKey?: string
  options?: {
    userAttributes?: Record<string, any>
    query?: Record<string, any>
  }
  // Fallback content when Builder.io is not configured
  fallback?: React.ReactNode
  // Loading state
  loading?: React.ReactNode
}

export function BuilderContent({
  model,
  content: initialContent,
  apiKey,
  options,
  fallback,
  loading,
}: BuilderContentProps) {
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(!initialContent)
  const [error, setError] = useState<string | null>(null)
  const isPreviewing = useIsPreviewing()

  // Initialize with custom API key if provided
  useEffect(() => {
    if (apiKey) {
      builder.init(apiKey)
    }
  }, [apiKey])

  // Fetch content if not provided
  useEffect(() => {
    if (initialContent || !isBuilderConfigured()) {
      setIsLoading(false)
      return
    }

    async function fetchContent() {
      try {
        const result = await builder
          .get(model, {
            userAttributes: options?.userAttributes,
            query: options?.query,
          })
          .toPromise()

        setContent(result)
      } catch (err) {
        console.error('Builder.io fetch error:', err)
        setError('Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [model, initialContent, options])

  // Not configured state
  if (!isBuilderConfigured() && !apiKey) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="border border-dashed border-yellow-500/50 bg-yellow-500/5 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
        <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
          Builder.io Not Configured
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add your Builder.io API key to enable visual content editing.
        </p>
        <a
          href="https://builder.io/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          Get a free API key
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    if (loading) {
      return <>{loading}</>
    }

    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="border border-red-500/50 bg-red-500/5 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  // No content found (but previewing in Builder)
  if (!content && isPreviewing) {
    return (
      <div className="border border-dashed border-blue-500/50 bg-blue-500/5 rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Start adding content in Builder.io visual editor
        </p>
      </div>
    )
  }

  // No content found
  if (!content) {
    if (fallback) {
      return <>{fallback}</>
    }
    return null
  }

  // Render Builder content
  return (
    <BuilderComponent
      model={model}
      content={content}
    />
  )
}

// Pre-configured components for common use cases

export function BuilderPage({ urlPath }: { urlPath: string }) {
  return (
    <BuilderContent
      model="page"
      options={{
        userAttributes: { urlPath },
      }}
    />
  )
}

export function BuilderSection({ id }: { id?: string }) {
  return (
    <BuilderContent
      model="section"
      options={id ? { query: { id } } : undefined}
    />
  )
}

export function BuilderAnnouncement() {
  return (
    <BuilderContent
      model="announcement"
      fallback={null}
    />
  )
}

export function BuilderHeader() {
  return (
    <BuilderContent
      model="header"
    />
  )
}

export function BuilderFooter() {
  return (
    <BuilderContent
      model="footer"
    />
  )
}
