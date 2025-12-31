import { createClient } from './client'
import { createClient as createServerClientFn } from './server'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Client-side auth utilities
export const supabaseAuth = {
  // Sign up with email
  async signUp(email: string, password: string, name?: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) throw error
    return data
  },

  // Sign in with email
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Sign in with OAuth
  async signInWithOAuth(provider: 'google' | 'github') {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // Get current user
  async getUser() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  },
}

// Server-side auth utilities
export const serverAuth = {
  async getSession() {
    const supabase = createServerClientFn()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser() {
    const supabase = createServerClientFn()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user
  },

  async requireAuth() {
    const user = await this.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }
    return user
  },
}

// React hook for auth state
export function useSupabaseAuth() {
  // This is just a placeholder - actual hook implementation
  // would use React state and effects
  return {
    signIn: supabaseAuth.signIn,
    signUp: supabaseAuth.signUp,
    signOut: supabaseAuth.signOut,
    signInWithOAuth: supabaseAuth.signInWithOAuth,
    getUser: supabaseAuth.getUser,
    getSession: supabaseAuth.getSession,
  }
}
