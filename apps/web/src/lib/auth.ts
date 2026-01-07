import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Supabase client for auth operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      plan: string
      githubAccessToken?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan: string
    githubAccessToken?: string
  }
}

// Build providers array conditionally based on available env vars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password required')
      }

      const supabase = getSupabase()

      // Find user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single()

      if (error || !user) {
        throw new Error('Invalid email or password')
      }

      // Verify password
      const isValid = await bcrypt.compare(credentials.password, user.password)

      if (!isValid) {
        throw new Error('Invalid email or password')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
        plan: user.plan || 'free',
      }
    },
  }),
]

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const supabase = getSupabase()

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          // Create new user
          const { error } = await supabase.from('users').insert({
            email: user.email,
            name: user.name || 'User',
            avatar: user.image,
            google_id: account.provider === 'google' ? account.providerAccountId : null,
            github_id: account.provider === 'github' ? account.providerAccountId : null,
            plan: 'free',
            created_at: new Date().toISOString(),
          })

          if (error) {
            console.error('Error creating user:', error)
            return false
          }
        } else {
          // Update OAuth IDs if not set
          const updates: Record<string, string> = {}
          if (account.provider === 'google' && !existingUser.google_id) {
            updates.google_id = account.providerAccountId
          }
          if (account.provider === 'github' && !existingUser.github_id) {
            updates.github_id = account.providerAccountId
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('users')
              .update(updates)
              .eq('id', existingUser.id)
          }
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        const supabase = getSupabase()
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, plan')
          .eq('email', user.email)
          .single()

        token.id = dbUser?.id || user.id
        token.plan = dbUser?.plan || 'free'
      }
      // Store GitHub access token when signing in with GitHub
      if (account?.provider === 'github' && account.access_token) {
        token.githubAccessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.plan = token.plan
        session.user.githubAccessToken = token.githubAccessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
