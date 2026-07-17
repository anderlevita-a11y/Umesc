-- ====================================================================
-- SCRIPT DE CONFIGURAÇÃO DE REALTIME & SEGURANÇA (RLS) COMPLETO
-- Finalidade: Habilita o tempo real (Realtime) e configura as políticas
--             de segurança (RLS) corretas para todas as tabelas da UMESC:
--             Membros, Voluntários, Pedidos de Oração, Apoio Feminino,
--             Fichas de Filiação, Coordenadores, Projetos, Avisos/Mural, 
--             Documentos, Revistas, Configurações (settings).
--
-- COMO EXECUTAR NO SUPABASE:
-- 1. Acesse seu painel do Supabase (https://supabase.com)
-- 2. No menu esquerdo, vá em "SQL Editor" (ícone '>_')
-- 3. Clique em "+ New query"
-- 4. Cole este script e clique em "Run" (ou Ctrl+Enter)
-- ====================================================================

-- Habilitar extensão de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- A. CRIAÇÃO DE TODAS AS TABELAS CASO NÃO EXISTAM
-- ====================================================================

-- 1. MEMBERS
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(15) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    military_force VARCHAR(50) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    rg_militar VARCHAR(100) DEFAULT ''::character varying,
    church VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    lgpd_consent BOOLEAN DEFAULT TRUE NOT NULL,
    marketing_consent BOOLEAN DEFAULT FALSE NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
    security_hash VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'umesc123'::character varying NOT NULL, 
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    paused BOOLEAN DEFAULT FALSE NOT NULL,
    archived BOOLEAN DEFAULT FALSE NOT NULL,
    photo_url TEXT DEFAULT ''::text,
    is_director BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. VOLUNTÁRIOS DA CAPELANIA
CREATE TABLE IF NOT EXISTS public.capelania_volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    service_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PEDIDOS DE ORAÇÃO
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    request TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. APOIO FEMININO
CREATE TABLE IF NOT EXISTS public.apoio_feminino (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image' NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. FICHAS DE FILIAÇÃO
CREATE TABLE IF NOT EXISTS public.fichas_filiacao (
    id VARCHAR(55) PRIMARY KEY,
    member_cpf VARCHAR(15) UNIQUE NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    organ VARCHAR(50) NOT NULL,
    organ_other VARCHAR(255),
    lotacao_municipio VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    matricula VARCHAR(100) NOT NULL,
    vinculo VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    genero VARCHAR(10) NOT NULL,
    address_rua VARCHAR(255) NOT NULL,
    address_bairro VARCHAR(255) NOT NULL,
    address_cep VARCHAR(30) NOT NULL,
    address_cidade VARCHAR(255) NOT NULL,
    contact_cidade VARCHAR(255) NOT NULL,
    contact_fones VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    opcao_autorizacao INT NOT NULL,
    percentual_desconto NUMERIC(3,2),
    percentual_anterior NUMERIC(3,2),
    percentual_novo NUMERIC(3,2),
    data_inscricao VARCHAR(255) NOT NULL,
    assinatura_nome VARCHAR(255) NOT NULL,
    assinatura_desenho TEXT,
    signature_date VARCHAR(100) NOT NULL,
    ip_address VARCHAR(100) NOT NULL,
    security_seal VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COORDENADORES
CREATE TABLE IF NOT EXISTS public.coordinators (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    role VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    contact VARCHAR(100) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PROJETOS MISSIONÁRIOS
CREATE TABLE IF NOT EXISTS public.projects (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    detailed_needs TEXT,
    location VARCHAR(255),
    image TEXT,
    raised_percent NUMERIC DEFAULT 0,
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. QUADRO DE AVISOS / MURAL
CREATE TABLE IF NOT EXISTS public.announcements (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    date VARCHAR(100) NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. REPOSITÓRIO DE DOCUMENTOS / ARQUIVOS
CREATE TABLE IF NOT EXISTS public.documents (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_size VARCHAR(100),
    published_date VARCHAR(100),
    download_count INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. REVISTAS E BOLETINS
CREATE TABLE IF NOT EXISTS public.revistas (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    volume VARCHAR(100) NOT NULL,
    published_date VARCHAR(100),
    description TEXT,
    cover_image TEXT,
    download_url TEXT,
    downloads INTEGER DEFAULT 0,
    google_drive_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. CONFIGURAÇÕES / OUTROS
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- B. CONCESSÃO DE PERMISSÕES GERAIS (anon, authenticated, service_role)
-- ====================================================================
GRANT ALL ON TABLE public.members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.capelania_volunteers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prayer_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.apoio_feminino TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.fichas_filiacao TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coordinators TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.announcements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.revistas TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;

-- ====================================================================
-- C. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capelania_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoio_feminino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_filiacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- D. CONFIGURAÇÃO DAS POLÍTICAS DE RLS LIVRES (PARA SINCRONIZAÇÃO EM TEMPO REAL)
-- ====================================================================

-- 1. members
DROP POLICY IF EXISTS "Leitura livre para todos de members" ON public.members;
DROP POLICY IF EXISTS "Inserção livre para todos de members" ON public.members;
DROP POLICY IF EXISTS "Atualização livre para todos de members" ON public.members;
DROP POLICY IF EXISTS "Deleção livre para todos de members" ON public.members;

CREATE POLICY "Leitura livre para todos de members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de members" ON public.members FOR DELETE USING (true);

-- 2. capelania_volunteers
DROP POLICY IF EXISTS "Leitura livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Inserção livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Atualização livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Deleção livre para todos de capelania_volunteers" ON public.capelania_volunteers;

CREATE POLICY "Leitura livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR DELETE USING (true);

-- 3. prayer_requests
DROP POLICY IF EXISTS "Leitura livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Inserção livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Atualização livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Deleção livre para todos de prayer_requests" ON public.prayer_requests;

CREATE POLICY "Leitura livre para todos de prayer_requests" ON public.prayer_requests FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de prayer_requests" ON public.prayer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de prayer_requests" ON public.prayer_requests FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de prayer_requests" ON public.prayer_requests FOR DELETE USING (true);

-- 4. apoio_feminino
DROP POLICY IF EXISTS "Leitura livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Inserção livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Atualização livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Deleção livre para todos de apoio_feminino" ON public.apoio_feminino;

CREATE POLICY "Leitura livre para todos de apoio_feminino" ON public.apoio_feminino FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de apoio_feminino" ON public.apoio_feminino FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de apoio_feminino" ON public.apoio_feminino FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de apoio_feminino" ON public.apoio_feminino FOR DELETE USING (true);

-- 5. fichas_filiacao
DROP POLICY IF EXISTS "Leitura livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Inserção livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Atualização livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Deleção livre para todos de fichas_filiacao" ON public.fichas_filiacao;

CREATE POLICY "Leitura livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR DELETE USING (true);

-- 6. coordinators
DROP POLICY IF EXISTS "Leitura livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Inserção livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Atualização livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Deleção livre para todos de coordinators" ON public.coordinators;

CREATE POLICY "Leitura livre para todos de coordinators" ON public.coordinators FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de coordinators" ON public.coordinators FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de coordinators" ON public.coordinators FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de coordinators" ON public.coordinators FOR DELETE USING (true);

-- 7. projects
DROP POLICY IF EXISTS "Leitura livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Inserção livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Atualização livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Deleção livre para todos de projects" ON public.projects;

CREATE POLICY "Leitura livre para todos de projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de projects" ON public.projects FOR DELETE USING (true);

-- 8. announcements
DROP POLICY IF EXISTS "Leitura livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Inserção livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Atualização livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Deleção livre para todos de announcements" ON public.announcements;

CREATE POLICY "Leitura livre para todos de announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de announcements" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de announcements" ON public.announcements FOR DELETE USING (true);

-- 9. documents
DROP POLICY IF EXISTS "Leitura livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Inserção livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Atualização livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Deleção livre para todos de documents" ON public.documents;

CREATE POLICY "Leitura livre para todos de documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de documents" ON public.documents FOR DELETE USING (true);

-- 10. revistas
DROP POLICY IF EXISTS "Leitura livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Inserção livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Atualização livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Deleção livre para todos de revistas" ON public.revistas;

CREATE POLICY "Leitura livre para todos de revistas" ON public.revistas FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de revistas" ON public.revistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de revistas" ON public.revistas FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de revistas" ON public.revistas FOR DELETE USING (true);

-- 11. settings
DROP POLICY IF EXISTS "Leitura livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Inserção livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Atualização livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Deleção livre para todos de settings" ON public.settings;

CREATE POLICY "Leitura livre para todos de settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de settings" ON public.settings FOR DELETE USING (true);

-- ====================================================================
-- E. IDENTIDADE DE RÉPLICA TOTAL (REPLICA IDENTITY FULL)
-- ====================================================================
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.capelania_volunteers REPLICA IDENTITY FULL;
ALTER TABLE public.prayer_requests REPLICA IDENTITY FULL;
ALTER TABLE public.apoio_feminino REPLICA IDENTITY FULL;
ALTER TABLE public.fichas_filiacao REPLICA IDENTITY FULL;
ALTER TABLE public.coordinators REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.revistas REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;

-- ====================================================================
-- F. HABILITAÇÃO NA PUBLICAÇÃO DO SUPABASE REALTIME
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- members
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'members') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
    END IF;

    -- capelania_volunteers
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'capelania_volunteers') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.capelania_volunteers;
    END IF;

    -- prayer_requests
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prayer_requests') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;
    END IF;

    -- apoio_feminino
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'apoio_feminino') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.apoio_feminino;
    END IF;

    -- fichas_filiacao
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fichas_filiacao') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.fichas_filiacao;
    END IF;

    -- coordinators
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coordinators') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinators;
    END IF;

    -- projects
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'projects') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    END IF;

    -- announcements
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'announcements') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
    END IF;

    -- documents
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'documents') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
    END IF;

    -- revistas
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'revistas') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.revistas;
    END IF;

    -- settings
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
    END IF;
  END IF;
END $$;

-- Recarregar o cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- G. GARANTIA DE AUTO-INCREMENTO PARA TABELAS JÁ EXISTENTES (FIX ERRO NOT-NULL)
-- Finalidade: Garante que as sequências de ID auto-incremento sejam criadas
--             e corretamente vinculadas às tabelas 'prayer_requests',
--             'capelania_volunteers' e 'apoio_feminino', mesmo se as tabelas
--             já existiam anteriormente sem o tipo SERIAL correto.
-- ====================================================================

DO $$
BEGIN
  -- 1. Tabela: prayer_requests
  BEGIN
    ALTER TABLE public.prayer_requests ALTER COLUMN id TYPE integer USING (id::integer);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter id para integer na tabela prayer_requests';
  END;
  CREATE SEQUENCE IF NOT EXISTS public.prayer_requests_id_seq;
  ALTER TABLE public.prayer_requests ALTER COLUMN id SET DEFAULT nextval('public.prayer_requests_id_seq');
  ALTER SEQUENCE public.prayer_requests_id_seq OWNED BY public.prayer_requests.id;
  EXECUTE 'SELECT setval(''public.prayer_requests_id_seq'', COALESCE((SELECT MAX(CASE WHEN id::text ~ ''^[0-9]+$'' THEN id::text::integer ELSE 0 END) FROM public.prayer_requests), 0) + 1, false)';

  -- 2. Tabela: capelania_volunteers
  BEGIN
    ALTER TABLE public.capelania_volunteers ALTER COLUMN id TYPE integer USING (id::integer);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter id para integer na tabela capelania_volunteers';
  END;
  CREATE SEQUENCE IF NOT EXISTS public.capelania_volunteers_id_seq;
  ALTER TABLE public.capelania_volunteers ALTER COLUMN id SET DEFAULT nextval('public.capelania_volunteers_id_seq');
  ALTER SEQUENCE public.capelania_volunteers_id_seq OWNED BY public.capelania_volunteers.id;
  EXECUTE 'SELECT setval(''public.capelania_volunteers_id_seq'', COALESCE((SELECT MAX(CASE WHEN id::text ~ ''^[0-9]+$'' THEN id::text::integer ELSE 0 END) FROM public.capelania_volunteers), 0) + 1, false)';

  -- 3. Tabela: apoio_feminino
  BEGIN
    ALTER TABLE public.apoio_feminino ALTER COLUMN id TYPE integer USING (id::integer);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter id para integer na tabela apoio_feminino';
  END;
  CREATE SEQUENCE IF NOT EXISTS public.apoio_feminino_id_seq;
  ALTER TABLE public.apoio_feminino ALTER COLUMN id SET DEFAULT nextval('public.apoio_feminino_id_seq');
  ALTER SEQUENCE public.apoio_feminino_id_seq OWNED BY public.apoio_feminino.id;
  EXECUTE 'SELECT setval(''public.apoio_feminino_id_seq'', COALESCE((SELECT MAX(CASE WHEN id::text ~ ''^[0-9]+$'' THEN id::text::integer ELSE 0 END) FROM public.apoio_feminino), 0) + 1, false)';
END $$;

-- ====================================================================
-- G2. TABELA DE MEMBROS DA SECRETARIA (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.secretaria_members (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(100) UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cod VARCHAR(10),
    telefone VARCHAR(100),
    cidade VARCHAR(255),
    data_nascimento VARCHAR(100),
    opm VARCHAR(50),
    grupo VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.secretaria_members TO anon, authenticated, service_role;
ALTER TABLE public.secretaria_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de secretaria_members" ON public.secretaria_members;
DROP POLICY IF EXISTS "Inserção livre para todos de secretaria_members" ON public.secretaria_members;
DROP POLICY IF EXISTS "Atualização livre para todos de secretaria_members" ON public.secretaria_members;
DROP POLICY IF EXISTS "Deleção livre para todos de secretaria_members" ON public.secretaria_members;

CREATE POLICY "Leitura livre para todos de secretaria_members" ON public.secretaria_members FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de secretaria_members" ON public.secretaria_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de secretaria_members" ON public.secretaria_members FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de secretaria_members" ON public.secretaria_members FOR DELETE USING (true);

ALTER TABLE public.secretaria_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'secretaria_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.secretaria_members;
    END IF;
  END IF;
END $$;

-- Recarregar o cache novamente após alterações de estrutura
NOTIFY pgrst, 'reload schema';

