-- Instagram Clone - Engajamento: likes + comentarios
-- Execute no SQL Editor do Supabase. Este arquivo e idempotente.

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE likes
  ADD COLUMN IF NOT EXISTS post_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_post_id_fkey'
  ) THEN
    ALTER TABLE likes
      ADD CONSTRAINT likes_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_user_id_fkey'
  ) THEN
    ALTER TABLE likes
      ADD CONSTRAINT likes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_user_unique
  ON likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id
  ON likes(post_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id
  ON likes(user_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS post_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_post_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_fkey'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON comments(post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_created_at
  ON comments(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_file_url
  ON comments(file_url);
