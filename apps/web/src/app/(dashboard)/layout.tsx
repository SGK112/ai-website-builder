import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/shared/Sidebar'

// Mock user for development - remove auth requirement
const MOCK_USER = {
  id: 'dev-user',
  email: 'dev@localhost',
  name: 'Developer',
  plan: 'pro',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Use session user or fall back to mock user for development
  const user = session?.user || MOCK_USER

  return (
    <div className="flex h-[calc(100vh-64px)] text-white overflow-hidden">
      <Sidebar user={user} />
      <main className="relative flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
