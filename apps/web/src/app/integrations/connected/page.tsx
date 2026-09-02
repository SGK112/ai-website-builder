'use client'

// Default landing after an end-user completes a Composio OAuth connection from
// a published app (the connect endpoint's fallback returnUrl). Apps usually
// pass their own returnUrl via the SDK, so this is the no-returnUrl fallback —
// a friendly confirmation rather than a 404.

import { CheckCircle2 } from 'lucide-react'

export default function IntegrationConnectedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-500/20 bg-muted/40 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Account connected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can close this tab and return to the app — your connection is ready to use.
        </p>
      </div>
    </div>
  )
}
