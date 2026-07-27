-- ====================================================================
-- SCRIPT DE INICIALIZAÇÃO E CORREÇÃO DEFINITIVA (SUPABASE / POSTGRESQL)
-- Finalidade: Criação completa das tabelas 'members' e 'admins' com RLS,
--             permissões de API e recarga do cache de esquemas (Anti-Erro PGRST205)
--
-- COMO UTILIZAR NO SUPABASE:
-- 1. Copie todo o conteúdo deste arquivo.
-- 2. Acesse seu projeto no Supabase (https://supabase.com).
-- 3. No menu lateral esquerdo, clique em "SQL Editor" (ícone de terminal '>_').
-- 4. Clique em "+ New query" para criar uma nova aba.
-- 5. Cole este código no editor.
-- 6. Clique no botão "Run" (ou pressione Ctrl+Enter / Cmd+Enter).
-- ====================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. RESET TOTAL (Opcional - execute para limpar tabelas antigas e recriá-las de forma limpa)
-- Se você possui dados que deseja preservar, comente as duas linhas abaixo com "--"
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- 3. CRIAR TABELA DE ADMINISTRADORES (Acesso ao Painel)
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Armazena a senha administrativa de forma visível ou hash simples coerente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários descritivos da tabela admins
COMMENT ON TABLE public.admins IS 'Gerenciamento de acessos administrativos do Portal UMESC';

-- 4. CRIAR TABELA DE MEMBROS ASSOCIADOS (Ficha cadastral e termo LGPD)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(15) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    military_force VARCHAR(50) NOT NULL, -- PM, BM, FFAA, Civil, Apoiador, etc.
    rank VARCHAR(100) NOT NULL, -- Patente / Posto / Profissão
    rg_militar VARCHAR(100) DEFAULT ''::character varying,
    church VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    lgpd_consent BOOLEAN DEFAULT TRUE NOT NULL,
    marketing_consent BOOLEAN DEFAULT FALSE NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
    security_hash VARCHAR(255) UNIQUE NOT NULL, -- Assinatura hash para acesso individual
    password VARCHAR(255) DEFAULT 'umesc123'::character varying NOT NULL, 
    approved BOOLEAN DEFAULT FALSE NOT NULL, -- Status de moderação pela diretoria
    paused BOOLEAN DEFAULT FALSE NOT NULL, -- Status de pausa das atividades
    archived BOOLEAN DEFAULT FALSE NOT NULL, -- Cadastro arquivado / histórico
    photo_url TEXT DEFAULT ''::text, -- Foto credential 3x4 do associado
    is_director BOOLEAN DEFAULT FALSE NOT NULL, -- Novo: Permite login administrativo de membros da diretoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- CASO SUA TABELA 'members' JÁ EXISTA E VOCÊ PRECISE APENAS ATUALIZAR:
-- Execute os comandos abaixo no SQL Editor do seu Supabase:
--
-- ALTER TABLE public.members ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE NOT NULL;
-- ALTER TABLE public.members ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;
-- ALTER TABLE public.members ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT ''::text;
-- ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_director BOOLEAN DEFAULT FALSE NOT NULL;
-- ====================================================================

-- Comentários descritivos da tabela members
COMMENT ON TABLE public.members IS 'Ficha de inscrição de filiados e termos sob as regras da LGPD';

-- 5. ÍNDICES DE VELOCIDADE DE BUSCA (Melhora latência de consultas no app)
CREATE INDEX IF NOT EXISTS idx_members_cpf ON public.members(cpf);
CREATE INDEX IF NOT EXISTS idx_members_security_hash ON public.members(security_hash);
CREATE INDEX IF NOT EXISTS idx_members_approved ON public.members(approved);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- 6. POPULAR TABELA DE ADMINISTRADORES COM ACESSO PADRÃO
INSERT INTO public.admins (email, password)
VALUES ('admin@umesc.org.br', 'adminUMESC2026')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password;

-- 7. POPULAR MEMBROS INICIAIS DE DEMONSTRAÇÃO (REMOVIDO A PEDIDO DO USUÁRIO)
-- NENHUM ASSOCIADO REGISTRADO INICIALMENTE PRA COMPLETO RESPEITO AO AMBIENTE DE PRODUÇÃO POR PADRÃO


-- 8. CONCEDER PERMISSÕES EXPLICITAS À GATWAY DO SUPABASE (anon, authenticated, service_role)
-- Crucial para evitar erros de permissão ou tabelas não localizadas na API do cliente REST
GRANT ALL ON TABLE public.members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.admins TO anon, authenticated, service_role;

-- 9. CONFIGURAR SEGURANÇA NO NÍVEL DE LINHA (Row Level Security - RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas pré-existentes
DROP POLICY IF EXISTS "Leitura livre para todos" ON public.members;
DROP POLICY IF EXISTS "Inserção livre para todos" ON public.members;
DROP POLICY IF EXISTS "Atualização livre para todos" ON public.members;
DROP POLICY IF EXISTS "Deleção livre para todos" ON public.members;
DROP POLICY IF EXISTS "Leitura livre de admins" ON public.admins;

-- Criar políticas atualizadas com referências explícitas ao schema public
CREATE POLICY "Leitura livre para todos" ON public.members 
    FOR SELECT USING (true);

CREATE POLICY "Inserção livre para todos" ON public.members 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualização livre para todos" ON public.members 
    FOR UPDATE USING (true);

CREATE POLICY "Deleção livre para todos" ON public.members 
    FOR DELETE USING (true);

CREATE POLICY "Leitura livre de admins" ON public.admins 
    FOR SELECT USING (true);

-- 10. RECARREGAR AUTOMATICAMENTE O CACHE DE ESQUEMAS DO PORTGREST NO SUPABASE (PGRST205 FIX)
-- Executa a notificação oficial do Supabase para que a API REST reconheça as tabelas imediatamente!
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- 11. TABELAS PARA CONGRESSOS E EVENTOS INTEGRADOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.congresses (
    id VARCHAR(55) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_receiver_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL, -- 'open' ou 'closed'
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Permite deixar ativo/inativo ocultando do frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.congresses IS 'Gerenciamento de congressos, simpósios e retiros oficiais da UMESC';

-- 12. TABELAS DE OFICINAS / WORKSHOPS DO CONGRESSO
CREATE TABLE IF NOT EXISTS public.workshops (
    id VARCHAR(55) PRIMARY KEY,
    congress_id VARCHAR(55) REFERENCES public.congresses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    speaker VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    registered_count INTEGER DEFAULT 0 NOT NULL,
    time_slot VARCHAR(255) NOT NULL
);

COMMENT ON TABLE public.workshops IS 'Oficinas e simpósios específicos ministrados em cada congresso';

-- 13. CRONOGRAMA / AGENDA DO CONGRESSO
CREATE TABLE IF NOT EXISTS public.agenda_items (
    id VARCHAR(55) PRIMARY KEY,
    congress_id VARCHAR(55) REFERENCES public.congresses(id) ON DELETE CASCADE,
    day VARCHAR(100) NOT NULL,
    time VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

COMMENT ON TABLE public.agenda_items IS 'Planejamento e cronograma de sessões públicas e privativas de cada congresso';

-- 14. INSCRIÇÕES REALIZADAS PARA O CONGRESSO (QR CODE + PAGAMENTOS)
CREATE TABLE IF NOT EXISTS public.inscriptions (
    id VARCHAR(55) PRIMARY KEY, -- INS-XXXXXX
    congress_id VARCHAR(55) REFERENCES public.congresses(id) ON DELETE CASCADE,
    congress_title VARCHAR(255) NOT NULL,
    member_cpf VARCHAR(15) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_email VARCHAR(255) NOT NULL,
    member_phone VARCHAR(30) NOT NULL,
    member_rank VARCHAR(100) NOT NULL,
    selected_workshop_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pendente' NOT NULL, -- pendente, em_analise, pago, recusado
    payment_proof_url TEXT,
    payment_proof_name VARCHAR(255),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    qr_code_token VARCHAR(255) NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE NOT NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.inscriptions IS 'Controle financeiro e homologação de ingressos por filiados fardados';

-- 15. PERMISSÕES PARA AS NOVAS TABELAS NO SUPABASE
GRANT ALL ON TABLE public.congresses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.workshops TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.agenda_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inscriptions TO anon, authenticated, service_role;

-- 16. CONFIGURAR SEGURANÇA NO NÍVEL DE LINHA (RLS) PARA AS NOVAS TABELAS
ALTER TABLE public.congresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas pré-existentes
DROP POLICY IF EXISTS "Leitura livre para todos de congressos" ON public.congresses;
DROP POLICY IF EXISTS "Inserção livre para todos de congressos" ON public.congresses;
DROP POLICY IF EXISTS "Atualização livre para todos de congressos" ON public.congresses;
DROP POLICY IF EXISTS "Deleção livre para todos de congressos" ON public.congresses;

DROP POLICY IF EXISTS "Leitura livre para todos de workshops" ON public.workshops;
DROP POLICY IF EXISTS "Inserção livre para todos de workshops" ON public.workshops;
DROP POLICY IF EXISTS "Atualização livre para todos de workshops" ON public.workshops;
DROP POLICY IF EXISTS "Deleção livre para todos de workshops" ON public.workshops;

DROP POLICY IF EXISTS "Leitura livre para todos de agenda_items" ON public.agenda_items;
DROP POLICY IF EXISTS "Inserção livre para todos de agenda_items" ON public.agenda_items;
DROP POLICY IF EXISTS "Atualização livre para todos de agenda_items" ON public.agenda_items;
DROP POLICY IF EXISTS "Deleção livre para todos de agenda_items" ON public.agenda_items;

DROP POLICY IF EXISTS "Leitura livre para todos de inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Inserção livre para todos de inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Atualização livre para todos de inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Deleção livre para todos de inscriptions" ON public.inscriptions;

-- Criar políticas atualizadas para congresses, workshops, agenda_items e inscriptions
CREATE POLICY "Leitura livre para todos de congressos" ON public.congresses FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de congressos" ON public.congresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de congressos" ON public.congresses FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de congressos" ON public.congresses FOR DELETE USING (true);

CREATE POLICY "Leitura livre para todos de workshops" ON public.workshops FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de workshops" ON public.workshops FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de workshops" ON public.workshops FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de workshops" ON public.workshops FOR DELETE USING (true);

CREATE POLICY "Leitura livre para todos de agenda_items" ON public.agenda_items FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de agenda_items" ON public.agenda_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de agenda_items" ON public.agenda_items FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de agenda_items" ON public.agenda_items FOR DELETE USING (true);

CREATE POLICY "Leitura livre para todos de inscriptions" ON public.inscriptions FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de inscriptions" ON public.inscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de inscriptions" ON public.inscriptions FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de inscriptions" ON public.inscriptions FOR DELETE USING (true);

-- 17. NOTIFICAÇÃO COMPLEMENTAR DO CACHE DO ESQUEMA DO PORTGREST NO SUPABASE
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- 18. TABELA DE DOAÇÕES E CONTROLE FINANCEIRO (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id VARCHAR(55) PRIMARY KEY, -- DON-XXXXXX ou UUID
    project_id VARCHAR(255) DEFAULT 'avulsa' NOT NULL,
    project_name VARCHAR(255) DEFAULT 'Doação Avulsa' NOT NULL,
    donor_name VARCHAR(255) DEFAULT 'Anônimo' NOT NULL,
    donor_whatsapp VARCHAR(50) DEFAULT 'Não Informado' NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pendente' NOT NULL, -- pendente, pago, em_analise, recusado
    payment_proof_url TEXT, -- Arquivo anexado Base64 do comprovante de transferência
    payment_proof_name VARCHAR(255),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.donations IS 'Gerenciamento estruturado de doações vinculadas a ações missionárias e avulsas';

-- Permissões explicitadas no canal REST
GRANT ALL ON TABLE public.donations TO anon, authenticated, service_role;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de donations" ON public.donations;
DROP POLICY IF EXISTS "Inserção livre para todos de donations" ON public.donations;
DROP POLICY IF EXISTS "Atualização livre para todos de donations" ON public.donations;
DROP POLICY IF EXISTS "Deleção livre para todos de donations" ON public.donations;

CREATE POLICY "Leitura livre para todos de donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de donations" ON public.donations FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de donations" ON public.donations FOR DELETE USING (true);

NOTIFY pgrst, 'reload schema';


-- ====================================================================
-- 19. TABELA DE VOLUNTÁRIOS DA CAPELANIA (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.capelania_volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    service_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.capelania_volunteers IS 'Gerenciamento estruturado de inscritos para o voluntariado regional da Capelania';

-- Permissões explicitadas no canal REST
GRANT ALL ON TABLE public.capelania_volunteers TO anon, authenticated, service_role;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.capelania_volunteers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Inserção livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Atualização livre para todos de capelania_volunteers" ON public.capelania_volunteers;
DROP POLICY IF EXISTS "Deleção livre para todos de capelania_volunteers" ON public.capelania_volunteers;

CREATE POLICY "Leitura livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de capelania_volunteers" ON public.capelania_volunteers FOR DELETE USING (true);

NOTIFY pgrst, 'reload schema';

-- Garantia de auto-incremento caso a tabela já existisse
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.capelania_volunteers ALTER COLUMN id TYPE integer USING (id::integer);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter id para integer na tabela capelania_volunteers';
  END;
  CREATE SEQUENCE IF NOT EXISTS public.capelania_volunteers_id_seq;
  ALTER TABLE public.capelania_volunteers ALTER COLUMN id SET DEFAULT nextval('public.capelania_volunteers_id_seq');
  ALTER SEQUENCE public.capelania_volunteers_id_seq OWNED BY public.capelania_volunteers.id;
  EXECUTE 'SELECT setval(''public.capelania_volunteers_id_seq'', COALESCE((SELECT MAX(CASE WHEN id::text ~ ''^[0-9]+$'' THEN id::text::integer ELSE 0 END) FROM public.capelania_volunteers), 0) + 1, false)';
END $$;


-- ====================================================================
-- 20. TABELA DE PEDIDOS DE ORAÇÃO (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    request TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending' ou 'prayed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.prayer_requests IS 'Gerenciamento estruturado de pedidos de oração públicos/privados';

-- Permissões explicitadas no canal REST
GRANT ALL ON TABLE public.prayer_requests TO anon, authenticated, service_role;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Inserção livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Atualização livre para todos de prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Deleção livre para todos de prayer_requests" ON public.prayer_requests;

CREATE POLICY "Leitura livre para todos de prayer_requests" ON public.prayer_requests FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de prayer_requests" ON public.prayer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de prayer_requests" ON public.prayer_requests FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de prayer_requests" ON public.prayer_requests FOR DELETE USING (true);

NOTIFY pgrst, 'reload schema';

-- Garantia de auto-incremento caso a tabela já existisse
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.prayer_requests ALTER COLUMN id TYPE integer USING (id::integer);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível converter id para integer na tabela prayer_requests';
  END;
  CREATE SEQUENCE IF NOT EXISTS public.prayer_requests_id_seq;
  ALTER TABLE public.prayer_requests ALTER COLUMN id SET DEFAULT nextval('public.prayer_requests_id_seq');
  ALTER SEQUENCE public.prayer_requests_id_seq OWNED BY public.prayer_requests.id;
  EXECUTE 'SELECT setval(''public.prayer_requests_id_seq'', COALESCE((SELECT MAX(CASE WHEN id::text ~ ''^[0-9]+$'' THEN id::text::integer ELSE 0 END) FROM public.prayer_requests), 0) + 1, false)';
END $$;


-- ====================================================================
-- 21. TABELA DE APOIO FEMININO (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.apoio_feminino (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image' NOT NULL, -- 'image', 'video', 'none'
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.apoio_feminino IS 'Gerenciamento de publicações da área de Apoio Feminino da UMESC';

-- Permissões explicitadas no canal REST
GRANT ALL ON TABLE public.apoio_feminino TO anon, authenticated, service_role;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.apoio_feminino ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Inserção livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Atualização livre para todos de apoio_feminino" ON public.apoio_feminino;
DROP POLICY IF EXISTS "Deleção livre para todos de apoio_feminino" ON public.apoio_feminino;

CREATE POLICY "Leitura livre para todos de apoio_feminino" ON public.apoio_feminino FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de apoio_feminino" ON public.apoio_feminino FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de apoio_feminino" ON public.apoio_feminino FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de apoio_feminino" ON public.apoio_feminino FOR DELETE USING (true);

-- Garantia de auto-incremento caso a tabela já existisse
DO $$
BEGIN
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
-- 22. TABELA DE FICHAS DE FILIAÇÃO (NOVO)
-- ====================================================================
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

COMMENT ON TABLE public.fichas_filiacao IS 'Fichas de filiação autorizadas e assinadas eletronicamente';

GRANT ALL ON TABLE public.fichas_filiacao TO anon, authenticated, service_role;

ALTER TABLE public.fichas_filiacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Inserção livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Atualização livre para todos de fichas_filiacao" ON public.fichas_filiacao;
DROP POLICY IF EXISTS "Deleção livre para todos de fichas_filiacao" ON public.fichas_filiacao;

CREATE POLICY "Leitura livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de fichas_filiacao" ON public.fichas_filiacao FOR DELETE USING (true);

-- ====================================================================
-- 23. TABELA DE COORDENADORES (NOVO)
-- ====================================================================
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

COMMENT ON TABLE public.coordinators IS 'Gerenciamento de Coordenadores Regionais da UMESC';

-- Permissões
GRANT ALL ON TABLE public.coordinators TO anon, authenticated, service_role;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Inserção livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Atualização livre para todos de coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Deleção livre para todos de coordinators" ON public.coordinators;

CREATE POLICY "Leitura livre para todos de coordinators" ON public.coordinators FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de coordinators" ON public.coordinators FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de coordinators" ON public.coordinators FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de coordinators" ON public.coordinators FOR DELETE USING (true);

-- ====================================================================
-- 24. ATIVAÇÃO DE REALTIME E IDENTIDADE DE RÉPLICA (NOVO)
-- ====================================================================
-- Configura para que atualizações e deleções enviem todos os campos em tempo real
ALTER TABLE public.coordinators REPLICA IDENTITY FULL;

-- Adiciona a tabela de coordenadores na publicação supabase_realtime de forma segura
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'coordinators'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinators;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 25. TABELA DE PROJETOS MISSIONÁRIOS (NOVO)
-- ====================================================================
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

GRANT ALL ON TABLE public.projects TO anon, authenticated, service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Inserção livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Atualização livre para todos de projects" ON public.projects;
DROP POLICY IF EXISTS "Deleção livre para todos de projects" ON public.projects;

CREATE POLICY "Leitura livre para todos de projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de projects" ON public.projects FOR DELETE USING (true);

ALTER TABLE public.projects REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'projects'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 26. TABELA DE ANUNCIOS/MURAL (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    date VARCHAR(100) NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.announcements TO anon, authenticated, service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Inserção livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Atualização livre para todos de announcements" ON public.announcements;
DROP POLICY IF EXISTS "Deleção livre para todos de announcements" ON public.announcements;

CREATE POLICY "Leitura livre para todos de announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de announcements" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de announcements" ON public.announcements FOR DELETE USING (true);

ALTER TABLE public.announcements REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'announcements'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 27. TABELA DE DOCUMENTOS/FICHEIROS (NOVO)
-- ====================================================================
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

GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Inserção livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Atualização livre para todos de documents" ON public.documents;
DROP POLICY IF EXISTS "Deleção livre para todos de documents" ON public.documents;

CREATE POLICY "Leitura livre para todos de documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de documents" ON public.documents FOR DELETE USING (true);

ALTER TABLE public.documents REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'documents'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 28. TABELA DE REVISTAS E EDITORIAIS (NOVO)
-- ====================================================================
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

GRANT ALL ON TABLE public.revistas TO anon, authenticated, service_role;
ALTER TABLE public.revistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Inserção livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Atualização livre para todos de revistas" ON public.revistas;
DROP POLICY IF EXISTS "Deleção livre para todos de revistas" ON public.revistas;

CREATE POLICY "Leitura livre para todos de revistas" ON public.revistas FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de revistas" ON public.revistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de revistas" ON public.revistas FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de revistas" ON public.revistas FOR DELETE USING (true);

ALTER TABLE public.revistas REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'revistas'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.revistas;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 29. TABELA DE CONFIGURAÇÕES/SETTINGS (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Inserção livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Atualização livre para todos de settings" ON public.settings;
DROP POLICY IF EXISTS "Deleção livre para todos de settings" ON public.settings;

CREATE POLICY "Leitura livre para todos de settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de settings" ON public.settings FOR DELETE USING (true);

ALTER TABLE public.settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'settings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 30. TABELA DE MEMBROS DA SECRETARIA (NOVO)
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

-- ====================================================================
-- 31. TABELA DE CARROSSEL: CONVITES ESTADUAIS (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.carousel_convites (
    id VARCHAR(100) PRIMARY KEY,
    image TEXT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.carousel_convites TO anon, authenticated, service_role;
ALTER TABLE public.carousel_convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de carousel_convites" ON public.carousel_convites;
DROP POLICY IF EXISTS "Inserção livre para todos de carousel_convites" ON public.carousel_convites;
DROP POLICY IF EXISTS "Atualização livre para todos de carousel_convites" ON public.carousel_convites;
DROP POLICY IF EXISTS "Deleção livre para todos de carousel_convites" ON public.carousel_convites;

CREATE POLICY "Leitura livre para todos de carousel_convites" ON public.carousel_convites FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de carousel_convites" ON public.carousel_convites FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de carousel_convites" ON public.carousel_convites FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de carousel_convites" ON public.carousel_convites FOR DELETE USING (true);

ALTER TABLE public.carousel_convites REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'carousel_convites'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.carousel_convites;
    END IF;
  END IF;
END $$;

-- ====================================================================
-- 32. TABELA DE CARROSSEL: EVENTOS E CAMPANHAS ESTADUAIS (NOVO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.carousel_eventos (
    id VARCHAR(100) PRIMARY KEY,
    image TEXT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    place VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.carousel_eventos TO anon, authenticated, service_role;
ALTER TABLE public.carousel_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura livre para todos de carousel_eventos" ON public.carousel_eventos;
DROP POLICY IF EXISTS "Inserção livre para todos de carousel_eventos" ON public.carousel_eventos;
DROP POLICY IF EXISTS "Atualização livre para todos de carousel_eventos" ON public.carousel_eventos;
DROP POLICY IF EXISTS "Deleção livre para todos de carousel_eventos" ON public.carousel_eventos;

CREATE POLICY "Leitura livre para todos de carousel_eventos" ON public.carousel_eventos FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de carousel_eventos" ON public.carousel_eventos FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de carousel_eventos" ON public.carousel_eventos FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de carousel_eventos" ON public.carousel_eventos FOR DELETE USING (true);

ALTER TABLE public.carousel_eventos REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'carousel_eventos'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.carousel_eventos;
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';


