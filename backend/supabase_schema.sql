-- ============================================================
-- SQL Schema dla bazy Supabase: Hubmi / Ideas & Auth
-- Wklej tę treść w panelu Supabase: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Tabela profili użytkowników
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks na email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Tabela pomysłów / postów (ideas)
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks na autora
CREATE INDEX IF NOT EXISTS idx_ideas_author ON public.ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);

-- 3. Tabela reakcji: like, volunteer, dislike
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'volunteer', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_idea_reaction UNIQUE (idea_id, user_id, reaction_type)
);

-- Indeksy dla reakcji
CREATE INDEX IF NOT EXISTS idx_reactions_idea ON public.reactions(idea_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- Opcjonalny przykładowy administrator (hasło: admin123)
-- Hash bcrypt dla 'admin123': $2b$12$e/aPq7vI8L9k2zL17QZ2yOXoT7U0V0jJjR4g/hXG8N3dO4i6vP9Y6
-- Możesz też zarejestrować admina przez endpoint /api/login/register wybierając role='admin'
