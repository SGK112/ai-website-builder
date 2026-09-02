'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Workspace Error:', error)
  }, [error])

  // Solid bg + WCAG-AA-passing text colors so the page reads regardless of
  // user theme. The translucent-on-gradient version mixed under light themes
  // and turned the error details into unreadable low-contrast prose.
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-700 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <AlertTriangle className="w-10 h-10 text-red-700 dark:text-red-300" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Workspace Error
        </h1>
        <p className="text-slate-200 mb-6">
          Something went wrong while loading the workspace. Your work should be safe.
        </p>

        {/* Error details — open by default so users actually see the message.
            Was buried in a <details summary> that defaulted closed. */}
        <details open className="mb-6 text-left">
          <summary className="text-sm text-slate-300 cursor-pointer hover:text-white flex items-center gap-2 font-medium">
            <Bug className="w-4 h-4" />
            Error details
          </summary>
          <div className="mt-2 p-3 bg-black/50 border border-white/10 rounded-lg overflow-auto max-h-48">
            <pre className="text-xs text-red-700 dark:text-red-200 whitespace-pre-wrap font-mono leading-relaxed">
              {error.message || '(no message)'}
              {error.digest && `\n\nDigest: ${error.digest}`}
              {error.stack && `\n\n${error.stack.split('\n').slice(0, 6).join('\n')}`}
            </pre>
          </div>
        </details>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/'}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </motion.button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          If this keeps happening, try clearing your browser cache or contact support.
        </p>
      </motion.div>
    </div>
  )
}
