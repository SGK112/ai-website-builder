'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.replace('/login')
    } else {
      // Redirect to workspace as the main dashboard
      router.replace('/workspace')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
}
