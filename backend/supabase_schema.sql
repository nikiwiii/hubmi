-- ==========================================
-- TABELA: Użytkownicy (Users)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Do bezpiecznego przechowywania haseł
    full_name VARCHAR(255), -- Imię i nazwisko lub nazwa organizacji
    organization_type VARCHAR(100), -- Opcjonalne pole, np. 'Fundacja', 'Gmina'
    role VARCHAR(50) NOT NULL DEFAULT 'resident', -- role np.: 'resident', 'ngo', 'jst', 'rops_admin', 'expert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ZAKTUALIZOWANA TABELA 2: Zgłaszane wyzwania
-- ==========================================
CREATE TABLE reported_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Klucz obcy do tabeli users
    problem_description TEXT NOT NULL,
    embedding VECTOR(1536), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX reported_problems_embedding_idx ON reported_problems USING hnsw (embedding vector_cosine_ops);


-- ==========================================
-- ZAKTUALIZOWANA TABELA 3: Kreator pomysłów
-- ==========================================
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Powiązanie pomysłu z jego autorem
    title VARCHAR(255) NOT NULL,
    essence TEXT NOT NULL,
    dedicated_to VARCHAR(255),
    stage VARCHAR(100), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS innovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  addressed_problems TEXT,
  target_group VARCHAR(255),
  beneficiaries VARCHAR(255),
  validation TEXT,
  authors VARCHAR(255),
  funding_info TEXT, -- Informacje o dofinansowaniu / grantach
  url TEXT, -- Link do projektu / szczegółów (kliknij aby wejść i zobaczyć)
  file_source VARCHAR(255), -- Nazwa pliku źródłowego dokumentującego innowację
  embedding VECTOR(384), -- Wektor dla wyszukiwania semantycznego (384-dim all-MiniLM-L6-v2)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks HNSW dla bardzo szybkiego wyszukiwania wektorowego (korzystamy z dystansu cosinusowego)
CREATE INDEX IF NOT EXISTS innovations_embedding_idx ON innovations USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- Funkcja RPC dla Supabase: match_innovations (Vector Search)
-- ============================================================
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
