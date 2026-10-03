-- ============================================================
-- SQL Schema dla bazy Supabase: Hubmi / Ideas & Auth
-- Wklej tę treść w panelu Supabase: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Konta są w istniejącej tabeli public.users (id, password_hash, full_name, role, created_at).
-- Brakuje w niej e-maila, którego używa logowanie.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Tabela pomysłów / postów (ideas)
-- Istniejąca tabela ma już: id, user_id, title, created_at.
-- Poniższe CREATE dotyczy świeżej bazy, ALTER dopisuje brakujące kolumny do obecnej.
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

-- Indeksy dla reakcji
CREATE INDEX IF NOT EXISTS idx_reactions_idea ON public.reactions(idea_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- Istniejąca tabela reactions mogła wskazywać profiles. Przepinamy ją na users.
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;
ALTER TABLE public.reactions
    ADD CONSTRAINT reactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;

-- Backend loguje się własnym JWT i używa klucza publishable.
-- Domyślne RLS Supabase blokuje zapis, więc wyłączamy je na tych tabelach.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;

-- Opcjonalny przykładowy administrator (hasło: admin123)
-- Hash bcrypt dla 'admin123': $2b$12$e/aPq7vI8L9k2zL17QZ2yOXoT7U0V0jJjR4g/hXG8N3dO4i6vP9Y6
-- Możesz też zarejestrować admina przez endpoint /api/login/register wybierając role='admin'
