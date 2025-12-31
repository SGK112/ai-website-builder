-- AI Website Builder - Initial Database Schema
-- Run this in Supabase SQL Editor: https://cpnqippzgcezidoorwry.supabase.co/project/cpnqippzgcezidoorwry/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- ENUM TYPES
-- ===================

CREATE TYPE skill_level AS ENUM ('no-code', 'low-code', 'full-stack');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');
CREATE TYPE project_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE ingredient_type AS ENUM ('image', 'document', 'spreadsheet', 'text', 'video');
CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- ===================
-- USERS TABLE
-- ===================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  skill_level skill_level DEFAULT 'no-code',
  credits INTEGER DEFAULT 100,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ===================
-- PROJECTS TABLE
-- ===================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  template_id UUID,
  html_content TEXT,
  css_content TEXT,
  js_content TEXT,
  settings JSONB DEFAULT '{}',
  status project_status DEFAULT 'draft',
  published_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ===================
-- TEMPLATES TABLE
-- ===================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  industry TEXT,
  html_content TEXT NOT NULL,
  css_content TEXT,
  js_content TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  price_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates
CREATE POLICY "Anyone can view templates" ON templates
  FOR SELECT USING (true);

-- Index for filtering
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_industry ON templates(industry);
CREATE INDEX idx_templates_is_premium ON templates(is_premium);

-- ===================
-- WEBSTEW INGREDIENTS TABLE
-- ===================

CREATE TABLE webstew_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type ingredient_type NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE webstew_ingredients ENABLE ROW LEVEL SECURITY;

-- Users can only access their own ingredients
CREATE POLICY "Users can view own ingredients" ON webstew_ingredients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ingredients" ON webstew_ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredients" ON webstew_ingredients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredients" ON webstew_ingredients
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ingredients_user_id ON webstew_ingredients(user_id);
CREATE INDEX idx_ingredients_project_id ON webstew_ingredients(project_id);
CREATE INDEX idx_ingredients_type ON webstew_ingredients(type);

-- ===================
-- CREDIT TRANSACTIONS TABLE
-- ===================

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only system/admin can create transactions (via service role)
CREATE POLICY "Service role can manage transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_transactions_type ON credit_transactions(type);
CREATE INDEX idx_transactions_created_at ON credit_transactions(created_at DESC);

-- ===================
-- CHAT MESSAGES TABLE
-- ===================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access messages for their own projects
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ===================
-- FUNCTIONS & TRIGGERS
-- ===================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to projects table
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to templates table
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits FROM users WHERE id = p_user_id FOR UPDATE;

  -- Check if enough credits
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE users SET credits = credits - p_amount WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, project_id)
  VALUES (p_user_id, -p_amount, 'usage', p_description, p_project_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type transaction_type,
  p_description TEXT DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Add credits
  UPDATE users SET credits = credits + p_amount WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_stripe_payment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup (auto-create user record)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ===================
-- STORAGE BUCKETS
-- ===================

-- Create storage buckets (run these separately if they fail)
INSERT INTO storage.buckets (id, name, public) VALUES ('webstew-uploads', 'webstew-uploads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-thumbnails', 'project-thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('template-assets', 'template-assets', true);

-- Storage policies for webstew-uploads
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'webstew-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'webstew-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'webstew-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for thumbnails and template assets
CREATE POLICY "Public read access for thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id IN ('project-thumbnails', 'template-assets'));
