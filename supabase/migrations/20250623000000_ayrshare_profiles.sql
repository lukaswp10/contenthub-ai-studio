-- Create ayrshare_profiles table
CREATE TABLE IF NOT EXISTS ayrshare_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_key TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_key)
);

-- Add RLS policies
ALTER TABLE ayrshare_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own profiles
CREATE POLICY "Users can view own ayrshare profiles" ON ayrshare_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own profiles
CREATE POLICY "Users can insert own ayrshare profiles" ON ayrshare_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own profiles
CREATE POLICY "Users can update own ayrshare profiles" ON ayrshare_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own profiles
CREATE POLICY "Users can delete own ayrshare profiles" ON ayrshare_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ayrshare_profiles_user_id ON ayrshare_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ayrshare_profiles_profile_key ON ayrshare_profiles(profile_key); 