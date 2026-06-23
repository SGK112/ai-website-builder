import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Sparkles, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="mt-6 text-4xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          That page moved or never existed — but you&apos;re one click from something useful.
        </p>

        {/* CTAs point at PUBLIC activation surfaces. The old "Dashboard" link
            bounced anon visitors to signup — a dead end on a dead end. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/grader">
              <Sparkles className="h-4 w-4" />
              Grade a site free
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Webstew
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
