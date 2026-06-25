import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { User } from '@ai-website-builder/database'

// A real bcrypt hash to compare against when the account doesn't exist, so a
// missing email takes the same time as a wrong password — closes the login
// timing oracle that otherwise reveals which emails are registered.
const DUMMY_BCRYPT_HASH = '$2a$12$vE.IvorxsUFxzwbzBIcPJuOGCLJ3QMr0WTPVj5x8NXCkhNz0ZJWYe'

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
        // Equalize timing with the wrong-password path so a non-existent email
        // isn't faster to reject (user-enumeration oracle).
        await bcrypt.compare(credentials.password, DUMMY_BCRYPT_HASH)
        throw new Error('Invalid email or password')
      }

      const isValid = await user.matchPassword(credentials.password)

      if (!isValid) {
        throw new Error('Invalid email or password')
      }

      // Email-verification gate. A fake / disposable email can't receive the
      // verification link, so blocking login until verified stops throwaway
      // accounts from burning free credits and walking off with a build.
      // Only EXPLICITLY unverified accounts are blocked — legacy users (no
      // emailVerified field) are grandfathered through. OAuth logins skip
      // this entirely; the provider already verified the address.
      if (user.emailVerified === false) {
        throw new Error('EMAIL_NOT_VERIFIED')
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

// Only add GitHub provider if credentials are configured.
// Names match the Google provider above (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).
// The legacy GITHUB_ID / GITHUB_SECRET names are accepted as a fallback so
// older Render env groups don't break during the rename.
const ghId     = process.env.GITHUB_CLIENT_ID     || process.env.GITHUB_ID
const ghSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_SECRET
if (ghId && ghSecret) {
  providers.push(
    GitHubProvider({
      clientId: ghId,
      clientSecret: ghSecret,
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
          // Email-based linking is an account-takeover vector: if a provider
          // hands us an UNVERIFIED email that matches an existing account, we'd
          // log the OAuth user straight into that account. Only link when the
          // email is provider-verified. Google exposes email_verified; the
          // NextAuth GitHub provider only ever returns the verified primary
          // email, so it's trusted.
          const emailVerified = account.provider === 'google'
            ? (profile as any)?.email_verified === true
            : true
          const byEmail = await User.findOne({ email: user.email })
          if (byEmail) {
            if (!emailVerified) {
              console.warn('[auth] refused OAuth link to existing account — unverified email', user.email)
              return false
            }
            existingUser = byEmail
          }
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
            app: 'webstew',
            firstSeenWebstewAt: new Date(),
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
          // Tenant stamp: any existing user who signs in via Webstew gets
          // marked. Existing VoiceNow-only users in the shared collection
          // who NEVER log into Webstew stay un-stamped and stay out of
          // the admin panel. Bypass mongoose .save() bleed-through by
          // using raw collection update for the new field.
          if (!existingUser.app) {
            const mongoose = (await import('mongoose')).default
            const db = mongoose.connection.db
            if (db) {
              await db.collection('users').updateOne(
                { _id: existingUser._id },
                { $set: { app: 'webstew', firstSeenWebstewAt: new Date(), updatedAt: new Date() } }
              )
            }
          }
          if (dirty) await existingUser.save()
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      // useSession().update({ name }) (e.g. after a profile save) re-runs this
      // with trigger==='update'; without handling it the token name is stale
      // and the header/avatar won't reflect the new name until re-login.
      if (trigger === 'update' && session?.name) {
        token.name = session.name
      }
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
        // Surface the (possibly just-updated) name from the token.
        if (typeof token.name === 'string') session.user.name = token.name
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
