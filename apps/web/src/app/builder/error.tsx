'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, LayoutDashboard, Download } from 'lucide-react'

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Builder error:', error)
  }, [error])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-900/50">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        <h2 className="mt-6 text-xl font-semibold text-white">
          Builder Error
        </h2>

        <p className="mt-2 text-slate-400">
          {error.message || 'The builder encountered an error. Your work may not be saved.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Builder
          </Button>
          <Button variant="secondary" asChild className="gap-2">
            <Link href="/dashboard/projects">
              <LayoutDashboard className="h-4 w-4" />
              My Projects
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          If this error persists, try downloading your project files and re-importing them.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-slate-600">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
