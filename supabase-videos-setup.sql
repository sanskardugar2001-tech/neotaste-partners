-- ╔═══════════════════════════════════════════════════════════╗
-- ║  NeoTaste Creator Portal — Videos Table Setup           ║
-- ║  Run this AFTER supabase-setup.sql                      ║
-- ╚═══════════════════════════════════════════════════════════╝

-- 1. Create video_status enum
DO $$ BEGIN
  CREATE TYPE video_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title         text NOT NULL,
  video_url     text NOT NULL,
  video_file_url text,
  description   text,
  status        video_status NOT NULL DEFAULT 'pending',
  admin_comment text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  invoice_submitted boolean NOT NULL DEFAULT false
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_submitted_at ON videos(submitted_at DESC);

-- 4. Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Creators can read their own videos
CREATE POLICY "Creators can read own videos"
  ON videos FOR SELECT
  USING (creator_id = auth.uid());

-- Creators can insert their own videos
CREATE POLICY "Creators can insert own videos"
  ON videos FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Creators can update their own videos (for resubmit / marking invoice_submitted)
CREATE POLICY "Creators can update own videos"
  ON videos FOR UPDATE
  USING (creator_id = auth.uid());

-- Admins (service role) bypass RLS automatically.
-- If you want admin users (not service role) to manage videos via the client,
-- add a policy like the one below. Adjust the email or use a roles table.
--
-- CREATE POLICY "Admins can read all videos"
--   ON videos FOR SELECT
--   USING (auth.jwt() ->> 'email' = 'admin@neotaste.app');
--
-- CREATE POLICY "Admins can update all videos"
--   ON videos FOR UPDATE
--   USING (auth.jwt() ->> 'email' = 'admin@neotaste.app');

-- For now, allow authenticated users full access (simple setup with DEMO_CREATOR_ID):
CREATE POLICY "Authenticated users can read all videos"
  ON videos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all videos"
  ON videos FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 6. Storage bucket for video uploads (optional direct uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Allow public read of video files
CREATE POLICY "Public can read video files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');
