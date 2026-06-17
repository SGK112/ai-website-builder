'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Load studio client-only — FFmpeg.wasm can't run in SSR
const VideoStudio = dynamic(() => import('./VideoStudio'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        <span className="text-sm">Loading video studio…</span>
      </div>
    </div>
  ),
})

export default function VideoPage() {
  return (
    <Suspense>
      <VideoStudio />
    </Suspense>
  )
}
