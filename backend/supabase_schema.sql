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
CREATE TABLE innovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  addressed_problems TEXT,
  target_group VARCHAR(255),
  beneficiaries VARCHAR(255),
  validation TEXT,
  authors VARCHAR(255),
  embedding VECTOR(1536), -- Wektor dla wyszukiwania semantycznego
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks HNSW dla bardzo szybkiego wyszukiwania wektorowego (korzystamy z dystansu cosinusowego)
CREATE INDEX innovations_embedding_idx ON innovations USING hnsw (embedding vector_cosine_ops);
