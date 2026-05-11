import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/shared/AuthProvider'
import { AppProvider } from '@/context/AppContext'
import { ClientLayout } from '@/components/shared/ClientLayout'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'Webstew | AI Website & App Builder',
  description: 'Webstew turns a single prompt into a polished website or working mobile app. No code required — describe it, ship it.',
  keywords: ['Webstew', 'website builder', 'app builder', 'AI', 'Next.js', 'Expo', 'React Native'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
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
