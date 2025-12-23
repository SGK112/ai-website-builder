import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Plus, FolderKanban, Rocket, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Create and manage your AI-generated websites
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link href="/new-project">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>New Project</CardTitle>
              <CardDescription>
                Start a new website with AI assistance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/projects">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <FolderKanban className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>
                View and manage your existing projects
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Deployed Sites</CardTitle>
            <CardDescription>
              0 sites currently live on Render
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No projects yet</p>
            <Link href="/new-project">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
