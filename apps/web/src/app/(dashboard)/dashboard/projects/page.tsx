import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Plus, FolderKanban, FileCode, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { connectDB } from '@/lib/db'
import { Project } from '@ai-website-builder/database'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  
  await connectDB()
  const projects = await Project.find({ userId: session?.user?.id })
    .sort({ updatedAt: -1 })
    .select('-files.content')
    .lean()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-generated websites
          </p>
        </div>
        <Link href="/new-project">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground">
              <FolderKanban className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-4">No projects yet</p>
              <p className="mb-6">Create your first AI-generated website</p>
              <Link href="/new-project">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link key={project._id.toString()} href={`/dashboard/projects/${project._id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileCode className="h-6 w-6 text-primary" />
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || `A ${project.type.replace('-', ' ')} website`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {project.type.replace('-', ' ')}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                  {project.files && project.files.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {project.files.length} files generated
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { icon: FolderKanban, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft', spin: false },
    generating: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Generating', spin: true },
    ready: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Ready', spin: false },
    deployed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Deployed', spin: false },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Failed', spin: false },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
      <Icon className={`h-3 w-3 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
