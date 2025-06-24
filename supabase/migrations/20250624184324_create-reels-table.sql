-- Create reels table for combined clips
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reel_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cloudinary_public_id TEXT,
  cloudinary_secure_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  clip_count INTEGER,
  platform TEXT DEFAULT 'tiktok',
  hashtags TEXT[],
  viral_score DECIMAL(3,1),
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reels_video_id ON reels(video_id);
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status);
CREATE INDEX IF NOT EXISTS idx_reels_platform ON reels(platform);

-- Add RLS policies
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reels
CREATE POLICY "Users can view own reels" ON reels
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reels
CREATE POLICY "Users can insert own reels" ON reels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reels
CREATE POLICY "Users can update own reels" ON reels
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reels
CREATE POLICY "Users can delete own reels" ON reels
  FOR DELETE USING (auth.uid() = user_id);

-- Add column to videos table to track reels generated
ALTER TABLE videos ADD COLUMN IF NOT EXISTS reels_generated INTEGER DEFAULT 0;
