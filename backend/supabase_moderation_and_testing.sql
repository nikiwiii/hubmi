-- ============================================================
-- SQL Schema dla tabel Testera Innowacji, Feedbacku i Moderacji
-- Wklej tę treść w Supabase: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Status pomysłów (moderacja: pending, active, rejected)
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Tabela ocen użyteczności i feedbacku testerów (Idea Feedback)
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
ALTER TABLE public.idea_feedback DISABLE ROW LEVEL SECURITY;

-- 3. Tabela komentarzy i dyskusji pod prototypami (Idea Comments)
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
ALTER TABLE public.idea_comments DISABLE ROW LEVEL SECURITY;

-- 4. Tabela aplikacji / zgłoszeń testerów (Tester Applications)
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
ALTER TABLE public.tester_applications DISABLE ROW LEVEL SECURITY;

-- 5. Tabele czatu z ekspertem ROPS Kraków (opcjonalne)
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
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL DEFAULT 'user',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
