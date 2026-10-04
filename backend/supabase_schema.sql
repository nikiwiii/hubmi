-- ============================================================
-- SQL Schema dla bazy Supabase: Hubmi / Ideas, Auth, Chat, Grants & Indicators
-- Wklej tę treść w panelu Supabase: SQL Editor -> New Query -> Run
-- ============================================================

-- Włączenie rozszerzenia wektorowego (pgvector dla wyszukiwania semantycznego RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. Użytkownicy (public.users)
-- ============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- 2. Tabela pomysłów / postów (ideas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    user_id UUID,
    author_name TEXT,
    status TEXT DEFAULT 'active',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_user_id_profiles_fkey;
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_user_id_fkey;
ALTER TABLE public.ideas
    ADD CONSTRAINT ideas_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ideas_user ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);

-- ============================================================
-- 3. Tabela reakcji: like, volunteer, dislike
-- ============================================================
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

-- Publiczny bucket na obrazy pomysłów
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('idea-images', 'idea-images', true, 8388608, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "idea_images_insert" ON storage.objects;
CREATE POLICY "idea_images_insert" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'idea-images');

-- ============================================================
-- 4. Tabela innowacji (Innovations) - RAG Matching
-- ============================================================
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

ALTER TABLE public.innovations ADD COLUMN IF NOT EXISTS funding_info TEXT;
ALTER TABLE public.innovations ADD COLUMN IF NOT EXISTS file_source VARCHAR(255);

ALTER TABLE public.innovations
  ALTER COLUMN embedding TYPE vector(384)
  USING embedding::vector(384);

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
-- 5. Czat Ekspert ROPS Kraków - Użytkownicy (Konwersacje)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    idea_id UUID,
    idea_title VARCHAR(255),
    topic VARCHAR(255) DEFAULT 'Zapytanie do eksperta ROPS Kraków',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
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

-- ============================================================
-- 6. Wiadomości czatu (Obsługa Pollingu)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at ASC);

-- ============================================================
-- 7. Zgłoszone problemy mieszkańców i gmin (Baza Wyzwań Regionu)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reported_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    problem_text TEXT NOT NULL,
    category VARCHAR(100),
    powiat VARCHAR(100),
    reporter_type VARCHAR(100) DEFAULT 'Mieszkaniec',
    matched_innovation_id UUID,
    matched_innovation_title VARCHAR(255),
    similarity_score FLOAT,
    status VARCHAR(50) DEFAULT 'matched',
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.reported_problems ADD COLUMN IF NOT EXISTS problem_text TEXT;
ALTER TABLE public.reported_problems ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.reported_problems ADD COLUMN IF NOT EXISTS powiat VARCHAR(100);
ALTER TABLE public.reported_problems ADD COLUMN IF NOT EXISTS reporter_type VARCHAR(100) DEFAULT 'Mieszkaniec';
ALTER TABLE public.reported_problems ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'matched';

CREATE INDEX IF NOT EXISTS idx_reported_problems_cat ON public.reported_problems(category);
CREATE INDEX IF NOT EXISTS idx_reported_problems_powiat ON public.reported_problems(powiat);
CREATE INDEX IF NOT EXISTS idx_reported_problems_status ON public.reported_problems(status);
CREATE INDEX IF NOT EXISTS idx_reported_problems_created ON public.reported_problems(created_at DESC);

-- Funkcja RPC match_reported_problems
CREATE OR REPLACE FUNCTION match_reported_problems (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  problem_text text,
  category varchar,
  powiat varchar,
  reporter_type varchar,
  status varchar,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    reported_problems.id,
    reported_problems.problem_text,
    reported_problems.category,
    reported_problems.powiat,
    reported_problems.reporter_type,
    reported_problems.status,
    reported_problems.created_at,
    1 - (reported_problems.embedding <=> query_embedding) AS similarity
  FROM reported_problems
  WHERE reported_problems.embedding IS NOT NULL
    AND 1 - (reported_problems.embedding <=> query_embedding) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================
-- 8. Tester Innowacji - Oceny użyteczności & Feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS public.idea_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID,
    author_name TEXT NOT NULL,
    author_role TEXT DEFAULT 'Tester społeczny',
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    usability_rating INT CHECK (usability_rating BETWEEN 1 AND 5),
    accessibility_rating INT CHECK (accessibility_rating BETWEEN 1 AND 5),
    impact_rating INT CHECK (impact_rating BETWEEN 1 AND 5),
    strengths TEXT,
    weaknesses TEXT,
    suggested_improvements TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idea_feedback_idea ON public.idea_feedback(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_feedback_created ON public.idea_feedback(created_at DESC);

-- ============================================================
-- 9. Komentarze i dyskusje pod prototypami
-- ============================================================
CREATE TABLE IF NOT EXISTS public.idea_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON public.idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_created ON public.idea_comments(created_at ASC);

-- ============================================================
-- 10. Zgłoszenia testerów innowacji (Tester Applications)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tester_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    idea_title TEXT NOT NULL,
    user_id UUID,
    user_name TEXT NOT NULL,
    user_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    motivation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tester_apps_idea ON public.tester_applications(idea_id);
CREATE INDEX IF NOT EXISTS idx_tester_apps_user ON public.tester_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tester_apps_status ON public.tester_applications(status);

-- ============================================================
<<<<<<< Updated upstream
-- 11. Nabory wniosków grantowych (Kreator pomysłów)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grant_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    template_url TEXT,
    template_filename TEXT,
    template_text TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT grant_calls_window CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_grant_calls_status ON public.grant_calls(status);

-- ============================================================
-- 12. Wnioski w naborach grantowych
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grant_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.grant_calls(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT,
    idea_title TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_filled JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_call_idea_application UNIQUE (call_id, idea_id)
);

CREATE INDEX IF NOT EXISTS idx_grant_applications_call ON public.grant_applications(call_id);
CREATE INDEX IF NOT EXISTS idx_grant_applications_user ON public.grant_applications(user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('grant-templates', 'grant-templates', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "grant_templates_insert" ON storage.objects;
CREATE POLICY "grant_templates_insert" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'grant-templates');


-- ============================================================
-- ============================================================
-- MODUŁ WSKAŹNIKÓW I DIAGNOZY REGIONU (INDICATORS & POWIATY)
-- ============================================================
-- ============================================================

-- ============================================================
-- 13. TABELA: indicator_categories (Kategorie wskaźników)
=======
-- TABELA 11: Kategorie Wskaźników (Indicator Categories)
>>>>>>> Stashed changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.indicator_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
<<<<<<< Updated upstream
    icon VARCHAR(50),
=======
    icon VARCHAR(50) DEFAULT 'activity',
    color VARCHAR(50) DEFAULT '#698B99',
>>>>>>> Stashed changes
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

<<<<<<< Updated upstream
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- KROK 1: NATYCHMIASTOWE ZASILENIE KATEGORII (przed dodaniem kluczy obcych)
INSERT INTO public.indicator_categories (id, name, description, icon, sort_order) VALUES
('demografia', 'Ludność i Demografia', 'Struktura wiekowa, stopień urbanizacji oraz dynamika ludnościowa.', 'users', 1),
('rynek_pracy', 'Rynek Pracy i Zatrudnienie', 'Wskaźniki bezrobocia, aktywności zawodowej i potencjału produkcyjnego.', 'briefcase', 2),
('pomoc_spoleczna', 'Pomoc Społeczna i Ubóstwo', 'Wsparcie finansowe, zasiłki i obciążenie kadr socjalnych.', 'banknote', 3),
('niepelnosprawnosc', 'Niepełnosprawność i Dostępność', 'Wskaźniki orzecznictwa, stopień znaczny oraz pomoc środowiskowa.', 'heart', 4),
('zdrowie', 'Zdrowie i Opieka Medyczna', 'Dostępność placówek aptecznych, hospitalizacja i zachorowalność.', 'activity', 5),
('rodzina', 'Rodzina i Piecza Zastępcza', 'Rodziny zastępcze, placówki opiekuńcze i dostępność przedszkoli.', 'heart', 6),
('finanse', 'Finanse Samorządowe', 'Wydatki budżetów gmin i miast na prawach powiatu per capita.', 'banknote', 7),
('kultura', 'Kultura i Edukacja', 'Dostępność muzeów oraz infrastruktury kulturalno-edukacyjnej.', 'activity', 8)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 14. TABELA: powiaty (22 powiaty województwa małopolskiego)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.powiaty (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    seat VARCHAR(100) NOT NULL,
    is_city BOOLEAN NOT NULL DEFAULT FALSE,
    subregion VARCHAR(100),
    subregion_key VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS seat VARCHAR(100);
ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS is_city BOOLEAN DEFAULT FALSE;
ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS subregion VARCHAR(100);
ALTER TABLE public.powiaty ADD COLUMN IF NOT EXISTS subregion_key VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_powiaty_name'
    ) THEN
        ALTER TABLE public.powiaty ADD CONSTRAINT uq_powiaty_name UNIQUE (name);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

-- KROK 2: NATYCHMIASTOWE ZASILENIE POWIATÓW (kluczowe przed walidacją klucza obcego!)
INSERT INTO public.powiaty (id, name, display_name, seat, is_city, subregion, subregion_key) VALUES
('bochenski', 'powiat bocheński', 'Powiat Bocheński', 'Bochnia', false, 'Subregion Krakowski (KOM)', 'kom'),
('brzeski', 'powiat brzeski', 'Powiat Brzeski', 'Brzesko', false, 'Subregion Tarnowski', 'tarnowski'),
('chrzanowski', 'powiat chrzanowski', 'Powiat Chrzanowski', 'Chrzanów', false, 'Małopolska Zachodnia', 'zachodnia'),
('dabrowski', 'powiat dąbrowski', 'Powiat Dąbrowski', 'Dąbrowa Tarnowska', false, 'Subregion Tarnowski', 'tarnowski'),
('gorlicki', 'powiat gorlicki', 'Powiat Gorlicki', 'Gorlice', false, 'Subregion Sądecki', 'sadecki'),
('krakowski', 'powiat krakowski', 'Powiat Krakowski', 'Kraków', false, 'Subregion Krakowski (KOM)', 'kom'),
('limanowski', 'powiat limanowski', 'Powiat Limanowski', 'Limanowa', false, 'Subregion Sądecki', 'sadecki'),
('krakow', 'powiat m. Kraków', 'Kraków (miasto)', 'Kraków', true, 'Subregion Krakowski (KOM)', 'kom'),
('nowy-sacz', 'powiat m. Nowy Sącz', 'Nowy Sącz (miasto)', 'Nowy Sącz', true, 'Subregion Sądecki', 'sadecki'),
('tarnow', 'powiat m. Tarnów', 'Tarnów (miasto)', 'Tarnów', true, 'Subregion Tarnowski', 'tarnowski'),
('miechowski', 'powiat miechowski', 'Powiat Miechowski', 'Miechów', false, 'Subregion Krakowski (KOM)', 'kom'),
('myslenicki', 'powiat myślenicki', 'Powiat Myślenicki', 'Myślenice', false, 'Subregion Krakowski (KOM)', 'kom'),
('nowosadecki', 'powiat nowosądecki', 'Powiat Nowosądecki', 'Nowy Sącz', false, 'Subregion Sądecki', 'sadecki'),
('nowotarski', 'powiat nowotarski', 'Powiat Nowotarski', 'Nowy Targ', false, 'Subregion Podhalański', 'podhalanski'),
('olkuski', 'powiat olkuski', 'Powiat Olkuski', 'Olkusz', false, 'Małopolska Zachodnia', 'zachodnia'),
('oswiecimski', 'powiat oświęcimski', 'Powiat Oświęcimski', 'Oświęcim', false, 'Małopolska Zachodnia', 'zachodnia'),
('proszowicki', 'powiat proszowicki', 'Powiat Proszowicki', 'Proszowice', false, 'Subregion Krakowski (KOM)', 'kom'),
('suski', 'powiat suski', 'Powiat Suski', 'Sucha Beskidzka', false, 'Subregion Podhalański', 'podhalanski'),
('tarnowski', 'powiat tarnowski', 'Powiat Tarnowski', 'Tarnów', false, 'Subregion Tarnowski', 'tarnowski'),
('tatrzanski', 'powiat tatrzański', 'Powiat Tatrzański', 'Zakopane', false, 'Subregion Podhalański', 'podhalanski'),
('wadowicki', 'powiat wadowicki', 'Powiat Wadowicki', 'Wadowice', false, 'Małopolska Zachodnia', 'zachodnia'),
('wielicki', 'powiat wielicki', 'Powiat Wielicki', 'Wieliczka', false, 'Subregion Krakowski (KOM)', 'kom')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    display_name = EXCLUDED.display_name, 
    seat = EXCLUDED.seat, 
    is_city = EXCLUDED.is_city,
    subregion = EXCLUDED.subregion,
    subregion_key = EXCLUDED.subregion_key;

-- ============================================================
-- 15. TABELA: indicators (Definicje wskaźników)
=======
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#698B99';
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.indicator_categories DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELA 12: Wskaźniki Społeczne (Indicators)
>>>>>>> Stashed changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.indicators (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(64) REFERENCES public.indicator_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    description TEXT,
<<<<<<< Updated upstream
    source VARCHAR(100) DEFAULT 'ROPS Kraków / GUS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS category_id VARCHAR(64);
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'ROPS Kraków / GUS';

-- Bezpieczne dodanie powiązania do kategorii
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicators_category_id_fkey'
    ) THEN 
        ALTER TABLE public.indicators 
            ADD CONSTRAINT indicators_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.indicator_categories(id) ON DELETE SET NULL; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS idx_indicators_category ON public.indicators(category_id);

-- ============================================================
-- 16. TABELA: indicator_measurements (Konkretne rekordy pomiarowe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.indicator_measurements (
    id BIGSERIAL PRIMARY KEY,
    indicator_id VARCHAR(64) NOT NULL,
    powiat_id VARCHAR(64),
    powiat_name VARCHAR(100) NOT NULL,
=======
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS category_id VARCHAR(64) REFERENCES public.indicator_categories(id) ON DELETE SET NULL;
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_indicators_category ON public.indicators(category_id);
ALTER TABLE public.indicators DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELA 13: Pomiary Wskaźników w Powiatach (Indicator Measurements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.indicator_measurements (
    id BIGSERIAL PRIMARY KEY,
    indicator_id VARCHAR(64) NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
    powiat_name VARCHAR(100) NOT NULL,
    powiat_id VARCHAR(50),
>>>>>>> Stashed changes
    year INT NOT NULL,
    val NUMERIC NOT NULL,
    unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS indicator_id VARCHAR(64);
ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS powiat_id VARCHAR(64);
ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS powiat_name VARCHAR(100);
ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS year INT;
ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS val NUMERIC;
ALTER TABLE public.indicator_measurements ADD COLUMN IF NOT EXISTS unit VARCHAR(20);

-- KROK 3: AUTO-SYNC / SANITY CHECK DANYCH PRZED NAŁOŻENIEM KLUCZY OBCYCH
-- 1. Uzupełnienie brakującego powiat_id w istniejących wierszach
UPDATE public.indicator_measurements m
SET powiat_id = p.id
FROM public.powiaty p
WHERE m.powiat_name = p.name AND m.powiat_id IS NULL;

-- 2. Usunięcie ewentualnych osieroconych rekordów o błędnych nazwach powiatu (zabezpieczenie przed 23503)
DELETE FROM public.indicator_measurements
WHERE powiat_name NOT IN (SELECT name FROM public.powiaty);

-- KROK 4: BEZPIECZNE DODANIE KLUCZY OBCYCH
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_measurements_indicator_id_fkey'
    ) THEN 
        ALTER TABLE public.indicator_measurements 
            ADD CONSTRAINT indicator_measurements_indicator_id_fkey 
            FOREIGN KEY (indicator_id) REFERENCES public.indicators(id) ON DELETE CASCADE; 
    END IF; 

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_measurements_powiat_id_fkey'
    ) THEN 
        ALTER TABLE public.indicator_measurements 
            ADD CONSTRAINT indicator_measurements_powiat_id_fkey 
            FOREIGN KEY (powiat_id) REFERENCES public.powiaty(id) ON DELETE CASCADE; 
    END IF; 

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_measurements_powiat_name_fkey'
    ) THEN 
        ALTER TABLE public.indicator_measurements 
            ADD CONSTRAINT indicator_measurements_powiat_name_fkey 
            FOREIGN KEY (powiat_name) REFERENCES public.powiaty(name) ON DELETE CASCADE; 
    END IF; 

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_indicator_powiat_year'
    ) THEN 
        ALTER TABLE public.indicator_measurements 
            ADD CONSTRAINT uq_indicator_powiat_year 
            UNIQUE (indicator_id, powiat_name, year); 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS idx_meas_indicator_lookup 
    ON public.indicator_measurements(indicator_id, powiat_name, year);
CREATE INDEX IF NOT EXISTS idx_meas_powiat_lookup 
    ON public.indicator_measurements(powiat_id, year);

-- Wyłączenie RLS dla tabel (dostęp przez backend JWT / anon key)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tester_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.powiaty DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_measurements DISABLE ROW LEVEL SECURITY;

-- KROK 5: PRZYPISANIE KATEGORII DO ISTNIEJĄCYCH WSKAŹNIKÓW
UPDATE public.indicators SET category_id = 'demografia' WHERE id IN ('working_age_population', 'urbanization_rate');
UPDATE public.indicators SET category_id = 'rynek_pracy' WHERE id IN ('unemployed_longer_than_1_year');
UPDATE public.indicators SET category_id = 'pomoc_spoleczna' WHERE id IN ('cash_social_assistance_benefits', 'residents_per_social_worker');
UPDATE public.indicators SET category_id = 'niepelnosprawnosc' WHERE id IN ('disability_support_share', 'severe_disability_share', 'total_disability_share');
UPDATE public.indicators SET category_id = 'zdrowie' WHERE id IN ('average_hospital_stay', 'pharmacy_availability', 'cancer_incidence');
UPDATE public.indicators SET category_id = 'rodzina' WHERE id IN ('foster_families_count', 'care_and_education_centers', 'kindergarten_availability', 'large_families_share');
UPDATE public.indicators SET category_id = 'finanse' WHERE id IN ('municipal_budget_expenditures');
UPDATE public.indicators SET category_id = 'kultura' WHERE id IN ('museum_availability');
