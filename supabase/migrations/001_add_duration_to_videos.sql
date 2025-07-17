-- Add duration column to videos table
-- This migration adds the missing duration column that is referenced in the TypeScript types

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS duration FLOAT;

-- Add comment to the column
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';

-- Update existing records to have a default duration if needed
UPDATE videos 
SET duration = 0 
WHERE duration IS NULL;
