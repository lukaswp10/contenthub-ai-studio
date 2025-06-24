-- Limpar schema anterior
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;
DROP TABLE IF EXISTS clips CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;

-- Profiles com campos expandidos para analytics
CREATE TABLE profiles (
  id uuid references auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  company_name text,
  phone_number text,
  country text DEFAULT 'BR',
  timezone text DEFAULT 'America/Sao_Paulo',
  language text DEFAULT 'pt',
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  
  -- Usage tracking
  usage_videos_current_month integer DEFAULT 0,
  usage_clips_generated_total integer DEFAULT 0,
  usage_storage_bytes bigint DEFAULT 0,
  usage_api_calls_current_month integer DEFAULT 0,
  usage_reset_date timestamp with time zone DEFAULT (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'),
  
  -- Preferences
  onboarding_completed boolean DEFAULT false,
  email_notifications jsonb DEFAULT '{"processing_complete": true, "post_published": true, "weekly_summary": true}',
  processing_preferences jsonb DEFAULT '{"clip_duration": 30, "language": "auto", "generate_subtitles": false}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_login_at timestamp with time zone
);

-- Videos com campos para analytics
CREATE TABLE videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Video info
  title text NOT NULL,
  description text,
  original_filename text NOT NULL,
  file_size_bytes bigint NOT NULL,
  duration_seconds numeric(10,2),
  fps numeric(5,2),
  resolution text,
  codec text,
  
  -- Cloudinary
  cloudinary_public_id text UNIQUE,
  cloudinary_secure_url text,
  cloudinary_format text,
  cloudinary_resource_type text DEFAULT 'video',
  
  -- Transcription
  transcription jsonb,
  transcription_language text,
  transcription_confidence numeric(3,2),
  speakers_detected integer DEFAULT 0,
  
  -- Processing
  processing_status text DEFAULT 'uploading' CHECK (
    processing_status IN ('uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips', 'ready', 'failed', 'cancelled')
  ),
  processing_started_at timestamp with time zone,
  processing_completed_at timestamp with time zone,
  processing_duration_seconds integer,
  error_message text,
  error_details jsonb,
  
  -- AI Analysis
  ai_content_type text,
  ai_main_topics text[],
  ai_key_moments jsonb,
  ai_suggested_clips integer,
  
  -- Metadata
  tags text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Clips com score viral e análise
CREATE TABLE clips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid references videos(id) ON DELETE CASCADE NOT NULL,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Clip info
  title text NOT NULL,
  description text,
  clip_number integer NOT NULL,
  start_time_seconds numeric(10,3) NOT NULL,
  end_time_seconds numeric(10,3) NOT NULL,
  duration_seconds numeric(8,3) GENERATED ALWAYS AS (end_time_seconds - start_time_seconds) STORED,
  
  -- Cloudinary
  cloudinary_public_id text,
  cloudinary_secure_url text,
  thumbnail_url text,
  preview_gif_url text,
  
  -- AI Analysis
  ai_viral_score numeric(3,1) DEFAULT 0 CHECK (ai_viral_score >= 0 AND ai_viral_score <= 10),
  ai_hook_strength numeric(3,1),
  ai_engagement_prediction text,
  ai_best_platform text[],
  ai_analysis_reason text,
  ai_detected_emotions text[],
  ai_content_category text,
  
  -- SEO
  suggested_title text,
  suggested_description text,
  hashtags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  
  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'archived', 'deleted')),
  is_favorite boolean DEFAULT false,
  edit_history jsonb DEFAULT '[]',
  
  -- Performance tracking
  total_posts integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  avg_watch_time_seconds numeric(8,2),
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Social Accounts com OAuth e rate limiting
CREATE TABLE social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Platform info
  platform text NOT NULL CHECK (
    platform IN ('tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'reddit', 'telegram', 'whatsapp', 'discord')
  ),
  account_type text DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'creator')),
  
  -- Account details
  platform_user_id text,
  username text NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  profile_url text,
  verified boolean DEFAULT false,
  
  -- OAuth tokens (encrypted)
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  token_scopes text[],
  
  -- Ayrshare integration
  ayrshare_profile_key text UNIQUE,
  ayrshare_status text DEFAULT 'active',
  
  -- Connection status
  is_active boolean DEFAULT true,
  connection_status text DEFAULT 'connected' CHECK (
    connection_status IN ('connected', 'expired', 'error', 'disconnected', 'rate_limited', 'suspended')
  ),
  last_error_message text,
  last_error_at timestamp with time zone,
  
  -- Rate limiting
  posts_today integer DEFAULT 0,
  posts_this_hour integer DEFAULT 0,
  last_post_at timestamp with time zone,
  daily_post_limit integer,
  hourly_post_limit integer,
  
  -- Posting preferences
  posting_schedule jsonb DEFAULT '{
    "enabled": true,
    "times": ["09:00", "15:00", "21:00"],
    "timezone": "America/Sao_Paulo",
    "days": [1,2,3,4,5,6,0],
    "max_posts_per_day": 3,
    "min_interval_minutes": 180,
    "randomize_minutes": 30
  }',
  default_hashtags text[] DEFAULT '{}',
  auto_posting_enabled boolean DEFAULT false,
  post_format_template text,
  
  -- Analytics
  total_followers integer DEFAULT 0,
  total_following integer DEFAULT 0,
  engagement_rate numeric(5,2),
  avg_views_per_post integer,
  best_posting_times jsonb,
  
  -- Timestamps
  connected_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_refreshed_at timestamp with time zone,
  last_posted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Unique constraint
  UNIQUE(user_id, platform, username)
);

-- Social Posts com analytics detalhado
CREATE TABLE social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clip_id uuid references clips(id) ON DELETE CASCADE NOT NULL,
  social_account_id uuid references social_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Post content
  post_title text,
  post_description text,
  hashtags text[] DEFAULT '{}',
  mentions text[] DEFAULT '{}',
  post_format text DEFAULT 'video',
  
  -- Media URLs
  media_url text,
  thumbnail_url text,
  platform_specific_data jsonb,
  
  -- Scheduling
  scheduled_for timestamp with time zone NOT NULL,
  posted_at timestamp with time zone,
  publish_immediately boolean DEFAULT false,
  
  -- Platform IDs
  ayrshare_post_id text,
  platform_post_id text,
  platform_post_url text,
  platform_insights_id text,
  
  -- Status tracking
  status text DEFAULT 'scheduled' CHECK (
    status IN ('draft', 'scheduled', 'queued', 'posting', 'posted', 'failed', 'cancelled', 'deleted')
  ),
  failure_reason text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  
  -- Analytics (real-time)
  analytics_views integer DEFAULT 0,
  analytics_likes integer DEFAULT 0,
  analytics_comments integer DEFAULT 0,
  analytics_shares integer DEFAULT 0,
  analytics_saves integer DEFAULT 0,
  analytics_reach integer DEFAULT 0,
  analytics_impressions integer DEFAULT 0,
  analytics_engagement_rate numeric(5,2) DEFAULT 0,
  analytics_avg_watch_time numeric(8,2),
  analytics_completion_rate numeric(5,2),
  analytics_click_through_rate numeric(5,2),
  analytics_last_updated timestamp with time zone,
  
  -- A/B testing
  experiment_id uuid,
  variant text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Subscriptions com histórico
CREATE TABLE subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_price_id text NOT NULL,
  stripe_product_id text,
  
  -- Plan details
  plan_name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'pro', 'agency')),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Status
  status text NOT NULL CHECK (
    status IN ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused')
  ),
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  cancellation_reason text,
  
  -- Billing
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  
  -- Amounts
  amount_cents integer NOT NULL,
  currency text DEFAULT 'brl',
  tax_percentage numeric(5,2) DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- API Keys para plano Agency
CREATE TABLE api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid references profiles(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL,
  key_hash text UNIQUE NOT NULL,
  key_prefix text NOT NULL,
  description text,
  
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  
  -- Permissions
  scopes text[] DEFAULT '{read}',
  allowed_ips text[],
  allowed_origins text[],
  
  -- Rate limiting
  rate_limit_per_minute integer DEFAULT 60,
  rate_limit_per_hour integer DEFAULT 1000,
  rate_limit_per_day integer DEFAULT 10000,
  
  -- Usage tracking
  last_used_at timestamp with time zone,
  last_used_ip text,
  total_requests bigint DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  revoked_at timestamp with time zone
);

-- Performance indexes
CREATE INDEX idx_videos_user_status ON videos(user_id, processing_status) WHERE is_archived = false;
CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_clips_video_user ON clips(video_id, user_id) WHERE status = 'ready';
CREATE INDEX idx_clips_viral_score ON clips(ai_viral_score DESC) WHERE status = 'ready';
CREATE INDEX idx_social_accounts_active ON social_accounts(user_id, platform) WHERE is_active = true;
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_account ON social_posts(social_account_id, posted_at DESC);
CREATE INDEX idx_social_posts_analytics ON social_posts(analytics_views DESC) WHERE status = 'posted';
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
CREATE INDEX idx_api_keys_user ON api_keys(user_id) WHERE is_active = true;

-- Full text search
CREATE INDEX idx_videos_search ON videos USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_clips_search ON clips USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Videos policies  
CREATE POLICY "Users can view own videos" ON videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- Clips policies
CREATE POLICY "Users can manage own clips" ON clips FOR ALL USING (auth.uid() = user_id);

-- Social accounts policies
CREATE POLICY "Users can manage own social accounts" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- Social posts policies
CREATE POLICY "Users can manage own posts" ON social_posts FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- API Keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON clips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE social_accounts 
  SET posts_today = 0, posts_this_hour = 0
  WHERE posts_today > 0 OR posts_this_hour > 0;
END;
$$ language plpgsql;

-- Function to check posting limits
CREATE OR REPLACE FUNCTION check_posting_limits(account_id uuid)
RETURNS boolean AS $$
DECLARE
  account social_accounts%ROWTYPE;
  can_post boolean := true;
BEGIN
  SELECT * INTO account FROM social_accounts WHERE id = account_id;
  
  -- Check daily limit
  IF account.daily_post_limit IS NOT NULL AND account.posts_today >= account.daily_post_limit THEN
    can_post := false;
  END IF;
  
  -- Check hourly limit
  IF account.hourly_post_limit IS NOT NULL AND account.posts_this_hour >= account.hourly_post_limit THEN
    can_post := false;
  END IF;
  
  -- Check minimum interval
  IF account.last_post_at IS NOT NULL THEN
    DECLARE
      min_interval integer;
    BEGIN
      min_interval := (account.posting_schedule->>'min_interval_minutes')::integer;
      IF account.last_post_at + (min_interval || ' minutes')::interval > NOW() THEN
        can_post := false;
      END IF;
    END;
  END IF;
  
  RETURN can_post;
END;
$$ language plpgsql;

-- Analytics aggregation function
CREATE OR REPLACE FUNCTION calculate_clip_performance(clip_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clips c
  SET 
    total_posts = (SELECT COUNT(*) FROM social_posts WHERE clip_id = c.id AND status = 'posted'),
    total_views = (SELECT COALESCE(SUM(analytics_views), 0) FROM social_posts WHERE clip_id = c.id),
    total_likes = (SELECT COALESCE(SUM(analytics_likes), 0) FROM social_posts WHERE clip_id = c.id),
    total_shares = (SELECT COALESCE(SUM(analytics_shares), 0) FROM social_posts WHERE clip_id = c.id)
  WHERE c.id = clip_id;
END;
$$ language plpgsql;