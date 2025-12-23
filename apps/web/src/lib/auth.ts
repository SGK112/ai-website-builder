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
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plan: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        await connectDB()

        const existingUser = await User.findOne({ email: user.email })

        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name || 'User',
            avatar: user.image,
            googleId: account.provider === 'google' ? account.providerAccountId : undefined,
            githubId: account.provider === 'github' ? account.providerAccountId : undefined,
            plan: 'free',
          })
        } else {
          // Update OAuth IDs if not set
          if (account.provider === 'google' && !existingUser.googleId) {
            existingUser.googleId = account.providerAccountId
            await existingUser.save()
          }
          if (account.provider === 'github' && !existingUser.githubId) {
            existingUser.githubId = account.providerAccountId
            await existingUser.save()
          }
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        await connectDB()
        const dbUser = await User.findOne({ email: user.email })
        token.id = dbUser?._id.toString() || user.id
        token.plan = dbUser?.plan || 'free'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.plan = token.plan
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
