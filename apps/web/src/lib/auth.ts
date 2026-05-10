import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { connectDB } from './db'
import { User } from '@ai-website-builder/database'

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

      await connectDB()

      const user = await User.findOne({ email: credentials.email }).select(
        '+password'
      )

      if (!user || !user.password) {
        throw new Error('Invalid email or password')
      }

      const isValid = await user.matchPassword(credentials.password)

      if (!isValid) {
        throw new Error('Invalid email or password')
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.avatar,
        plan: user.plan,
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        await connectDB()

        const providerIdField = account.provider === 'google' ? 'googleId' : 'githubId'
        const providerId = account.providerAccountId

        // Look up by provider ID FIRST (it's unique per OAuth provider, more
        // reliable than email which GitHub doesn't always return). Fall back
        // to email match for users who signed up with credentials and are
        // now linking an OAuth provider.
        let existingUser = await User.findOne({ [providerIdField]: providerId })
        if (!existingUser && user.email) {
          existingUser = await User.findOne({ email: user.email })
        }

        if (!existingUser) {
          // Truly new user — create. Email may be missing if the GitHub
          // account has no public email; that's fine, NextAuth still gives
          // us providerAccountId which is unique.
          await User.create({
            email: user.email || `${providerId}@${account.provider}.oauth`,
            name: user.name || 'User',
            avatar: user.image,
            googleId: account.provider === 'google' ? providerId : undefined,
            githubId: account.provider === 'github' ? providerId : undefined,
            plan: 'free',
          })
        } else {
          // Backfill missing fields without overwriting existing data
          let dirty = false
          if (!existingUser[providerIdField]) {
            existingUser[providerIdField] = providerId
            dirty = true
          }
          if (!existingUser.email && user.email) {
            existingUser.email = user.email
            dirty = true
          }
          if (!existingUser.avatar && user.image) {
            existingUser.avatar = user.image
            dirty = true
          }
          if (dirty) await existingUser.save()
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        await connectDB()
        // Match the same lookup priority as signIn: provider ID first, then
        // email. Otherwise users without a public email lose their plan info.
        let dbUser = null
        if (account?.providerAccountId) {
          const field = account.provider === 'google' ? 'googleId' :
                        account.provider === 'github' ? 'githubId' : null
          if (field) {
            dbUser = await User.findOne({ [field]: account.providerAccountId })
          }
        }
        if (!dbUser && user.email) {
          dbUser = await User.findOne({ email: user.email })
        }
        token.id = dbUser?._id.toString() || user.id
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
