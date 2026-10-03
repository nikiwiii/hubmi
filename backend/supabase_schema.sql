-- ============================================================
-- SQL Schema dla bazy Supabase: Hubmi / Ideas & Auth & Chat
-- Wklej tę treść w panelu Supabase: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Konta są w istniejącej tabeli public.users (id, password_hash, full_name, role, created_at).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Tabela pomysłów / postów (ideas)
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    user_id UUID,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_user_id_profiles_fkey;
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_user_id_fkey;
ALTER TABLE public.ideas
    ADD CONSTRAINT ideas_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Indeks na autora
CREATE INDEX IF NOT EXISTS idx_ideas_user ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);

-- 3. Tabela reakcji: like, volunteer, dislike
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'volunteer', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_idea_reaction UNIQUE (idea_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_idea ON public.reactions(idea_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;
ALTER TABLE public.reactions
    ADD CONSTRAINT reactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;

-- Wizualizacje pomysłów z kreatora (POST /api/idea-creator/projects z polem "image")
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Publiczny bucket na obrazy (odczyt przez publiczny URL, limit 8 MB, tylko png/jpeg/webp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('idea-images', 'idea-images', true, 8388608, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Backend używa klucza publishable (rola anon), więc potrzebuje prawa do dodawania plików (bez nadpisywania i usuwania)
DROP POLICY IF EXISTS "idea_images_insert" ON storage.objects;
CREATE POLICY "idea_images_insert" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'idea-images');

-- Wyłączenie RLS dla tabel jeśli backend loguje się własnym JWT
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;

-- 4. Tabela innowacji (Innovations) - RAG Matching
CREATE TABLE IF NOT EXISTS public.innovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  addressed_problems TEXT,
  target_group VARCHAR(255),
  beneficiaries VARCHAR(255),
  validation TEXT,
  authors VARCHAR(255),
  funding_info TEXT,
  url TEXT,
  file_source VARCHAR(255),
  embedding VECTOR(384),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS innovations_embedding_idx ON public.innovations USING hnsw (embedding vector_cosine_ops);

-- Funkcja RPC dla Supabase: match_innovations
CREATE OR REPLACE FUNCTION match_innovations (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title varchar,
  description text,
  addressed_problems text,
  target_group varchar,
  funding_info text,
  url text,
  file_source varchar,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    innovations.id,
    innovations.title,
    innovations.description,
    innovations.addressed_problems,
    innovations.target_group,
    innovations.funding_info,
    innovations.url,
    innovations.file_source,
    1 - (innovations.embedding <=> query_embedding) AS similarity
  FROM innovations
  WHERE 1 - (innovations.embedding <=> query_embedding) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================
-- TABELA 5: Czat Ekspert ROPS Kraków - Użytkownicy (Konwersacje)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    idea_id UUID, -- Opcjonalne powiązanie z postem / pomysłem ("Napisz do eksperta")
    idea_title VARCHAR(255),
    topic VARCHAR(255) DEFAULT 'Zapytanie do eksperta ROPS Kraków',
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'closed'
    assigned_admin_id UUID,
    assigned_admin_name VARCHAR(255),
    unread_by_admin INT DEFAULT 0,
    unread_by_user INT DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELA 6: Wiadomości czatu (Obsługa Pollingu co 3 sekundy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL, -- 'user', 'admin', 'expert'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at ASC);
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
