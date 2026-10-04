-- ==============================================================================
-- SQL Schema dla wskaźników społecznych ROPS Kraków (Obserwator)
-- Tabela kategorii, wskaźników oraz punktów pomiarowych dla 22 powiatów Małopolski
-- Wklej tę treść w Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabela: Kategorie wskaźników (Indicator Categories)
-- Zawiera oficjalne grupy tematyczne ROPS Obserwator wraz z kolorami do wykresów i map
CREATE TABLE IF NOT EXISTS public.indicator_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'activity',
    color VARCHAR(50) DEFAULT '#698B99',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Zapewnienie istnienia kolumny 'color' jeśli tabela już istniała wcześniej
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#698B99';
ALTER TABLE public.indicator_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.indicator_categories DISABLE ROW LEVEL SECURITY;

-- 2. Tabela: Wskaźniki (Indicators)
-- Definicje poszczególnych wskaźników społecznych (np. wskaźnik urbanizacji, ludność w wieku produkcyjnym)
CREATE TABLE IF NOT EXISTS public.indicators (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(64) REFERENCES public.indicator_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    description TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS category_id VARCHAR(64) REFERENCES public.indicator_categories(id) ON DELETE SET NULL;
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_indicators_category ON public.indicators(category_id);
ALTER TABLE public.indicators DISABLE ROW LEVEL SECURITY;

-- 3. Tabela: Pomiary wskaźników (Indicator Measurements)
-- Szeregi czasowe dla 22 powiatów Małopolski z dokładnymi wartościami liczbowymi
CREATE TABLE IF NOT EXISTS public.indicator_measurements (
    id BIGSERIAL PRIMARY KEY,
    indicator_id VARCHAR(64) NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
    powiat_name VARCHAR(100) NOT NULL,
    powiat_id VARCHAR(50),
    year INT NOT NULL,
    val NUMERIC NOT NULL,
    unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indicator_measurements_ind ON public.indicator_measurements(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_measurements_powiat ON public.indicator_measurements(powiat_name);
CREATE INDEX IF NOT EXISTS idx_indicator_measurements_year ON public.indicator_measurements(year);
CREATE INDEX IF NOT EXISTS idx_indicator_measurements_lookup ON public.indicator_measurements(indicator_id, year, powiat_name);
ALTER TABLE public.indicator_measurements DISABLE ROW LEVEL SECURITY;
