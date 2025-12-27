import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { AppProvider } from '@/context/AppContext'
import { ClientLayout } from '@/components/shared/ClientLayout'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Website Builder | Build Your Website with AI',
  description: 'Create stunning websites with AI-powered coding agents. Build business sites, e-commerce stores, and SaaS apps with guided assistance.',
  keywords: ['website builder', 'AI', 'code generator', 'Next.js', 'React'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
