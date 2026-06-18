ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

CREATE INDEX IF NOT EXISTS idx_posts_media_type ON posts(media_type);
