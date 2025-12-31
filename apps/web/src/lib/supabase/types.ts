export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          skill_level: 'no-code' | 'low-code' | 'full-stack'
          credits: number
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          skill_level?: 'no-code' | 'low-code' | 'full-stack'
          credits?: number
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          skill_level?: 'no-code' | 'low-code' | 'full-stack'
          credits?: number
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          domain: string | null
          template_id: string | null
          html_content: string | null
          css_content: string | null
          js_content: string | null
          settings: Json
          status: 'draft' | 'published' | 'archived'
          published_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          domain?: string | null
          template_id?: string | null
          html_content?: string | null
          css_content?: string | null
          js_content?: string | null
          settings?: Json
          status?: 'draft' | 'published' | 'archived'
          published_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          domain?: string | null
          template_id?: string | null
          html_content?: string | null
          css_content?: string | null
          js_content?: string | null
          settings?: Json
          status?: 'draft' | 'published' | 'archived'
          published_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          industry: string | null
          html_content: string
          css_content: string | null
          js_content: string | null
          thumbnail_url: string | null
          preview_url: string | null
          is_premium: boolean
          price_credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          industry?: string | null
          html_content: string
          css_content?: string | null
          js_content?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          is_premium?: boolean
          price_credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          industry?: string | null
          html_content?: string
          css_content?: string | null
          js_content?: string | null
          thumbnail_url?: string | null
          preview_url?: string | null
          is_premium?: boolean
          price_credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      webstew_ingredients: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          type: 'image' | 'document' | 'spreadsheet' | 'text' | 'video'
          name: string
          original_filename: string | null
          storage_path: string
          file_size: number | null
          mime_type: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          type: 'image' | 'document' | 'spreadsheet' | 'text' | 'video'
          name: string
          original_filename?: string | null
          storage_path: string
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          type?: 'image' | 'document' | 'spreadsheet' | 'text' | 'video'
          name?: string
          original_filename?: string | null
          storage_path?: string
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description: string | null
          project_id: string | null
          stripe_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          project_id?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          project_id?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          project_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      skill_level: 'no-code' | 'low-code' | 'full-stack'
      subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
      project_status: 'draft' | 'published' | 'archived'
      ingredient_type: 'image' | 'document' | 'spreadsheet' | 'text' | 'video'
      transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus'
      message_role: 'user' | 'assistant' | 'system'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience exports
export type User = Tables<'users'>
export type Project = Tables<'projects'>
export type Template = Tables<'templates'>
export type WebStewIngredient = Tables<'webstew_ingredients'>
export type CreditTransaction = Tables<'credit_transactions'>
export type ChatMessage = Tables<'chat_messages'>
