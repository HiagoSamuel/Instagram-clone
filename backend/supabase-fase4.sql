-- Instagram Clone - Fase 4: descoberta, escala e PWA
-- Execute este arquivo no SQL Editor do Supabase.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Posts publicos entram no Explorar. Se quiser privacidade por post no futuro,
-- troque este default por um controle no formulario de criacao.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Busca full-text por legenda. A trigger mantem o vetor sincronizado com a caption.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', unaccent(coalesce(NEW.caption, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_search_vector_update ON posts;
CREATE TRIGGER trg_posts_search_vector_update
BEFORE INSERT OR UPDATE OF caption ON posts
FOR EACH ROW
EXECUTE FUNCTION posts_search_vector_update();

UPDATE posts
SET search_vector = to_tsvector('simple', unaccent(coalesce(caption, '')))
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_search_vector
  ON posts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
  ON users USING gin(username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
  ON users USING gin(full_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_created ON post_hashtags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- Assinaturas de Web Push. O endpoint e unico por navegador/dispositivo.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);
