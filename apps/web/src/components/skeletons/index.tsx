import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-5 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-5 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-8 w-16 mt-2" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-card p-4 space-y-2">
      <Skeleton className="h-8 w-full mb-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export function FileTreeSkeleton() {
  return (
    <div className="w-60 border-r bg-card p-3 space-y-1">
      <Skeleton className="h-6 w-32 mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
        </div>
      ))}
    </div>
  )
}

export function EditorSkeleton() {
  return (
    <div className="flex-1 bg-slate-900 p-4">
      <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
        <Skeleton className="h-8 w-24 bg-slate-700" />
        <Skeleton className="h-8 w-24 bg-slate-700" />
        <Skeleton className="h-8 w-24 bg-slate-700" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-8 bg-slate-700" />
            <Skeleton
              className="h-4 bg-slate-700"
              style={{ width: `${20 + Math.random() * 60}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PreviewSkeleton() {
  return (
    <div className="flex-1 bg-white p-4">
      <div className="flex justify-center gap-2 mb-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full mt-4" />
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <div className="flex justify-center gap-4 mt-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="w-80 border-l bg-card p-4">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
            <Skeleton
              className="h-16 rounded-lg"
              style={{ width: `${50 + Math.random() * 30}%` }}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

// Builder-specific skeleton that combines all panels
export const BuilderSkeleton = {
  FileTree: FileTreeSkeleton,
  Editor: EditorSkeleton,
  Preview: PreviewSkeleton,
  Chat: ChatSkeleton,
  Full: function FullBuilderSkeleton() {
    return (
      <div className="flex h-screen">
        <FileTreeSkeleton />
        <div className="flex-1 flex">
          <EditorSkeleton />
          <PreviewSkeleton />
        </div>
        <ChatSkeleton />
      </div>
    )
  }
}
