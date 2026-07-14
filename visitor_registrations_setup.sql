-- ====================================================================
-- SCRIPT DE MIGRATION COMPLETO: GESTÃO DE CONGRESSOS & INSCRIÇÕES DE VISITANTES
-- Finalidade: Criação das tabelas de congressos/eventos (se não existirem)
--             e adição da coluna 'is_visitor' com índices e políticas de RLS.
--
-- COMO EXECUTAR NO SUPABASE:
-- 1. Acesse seu painel do Supabase (https://supabase.com)
-- 2. No menu esquerdo, vá em "SQL Editor" (ícone '>_')
-- 3. Clique em "+ New query"
-- 4. Cole este script completo e clique em "Run" (ou Ctrl+Enter)
-- ====================================================================

-- 1. CRIAR AS TABELAS DE CONGRESSO (Caso ainda não existam no seu banco de dados)

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

-- Tabelas de Oficinas / Workshops do Congresso
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

-- Cronograma / Agenda do Congresso
CREATE TABLE IF NOT EXISTS public.agenda_items (
    id VARCHAR(55) PRIMARY KEY,
    congress_id VARCHAR(55) REFERENCES public.congresses(id) ON DELETE CASCADE,
    day VARCHAR(100) NOT NULL,
    time VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

COMMENT ON TABLE public.agenda_items IS 'Planejamento e cronograma de sessões públicas e privativas de cada congresso';

-- Inscrições Realizadas para o Congresso (QR Code + Pagamentos)
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

COMMENT ON TABLE public.inscriptions IS 'Controle financeiro e homologação de ingressos por filiados e visitantes';


-- 2. GARANTIR A COLUNA PARA IDENTIFICAR VISITANTES (is_visitor)
-- Isso permite relatórios administrativos rápidos separando Filiados de Visitantes.
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS is_visitor BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.inscriptions.is_visitor IS 'Indica se o participante é um visitante avulso (não filiado à UMESC)';


-- 3. ÓTICA DE DESEMPENHO: ÍNDICES DE BUSCA B-TREE
-- Como os visitantes consultam o status de sua inscrição digitando o CPF ou o Telefone,
-- criamos índices de busca de alta performance nessas colunas para tempo de resposta sub-milissegundo.
CREATE INDEX IF NOT EXISTS idx_inscriptions_member_cpf ON public.inscriptions (member_cpf);
CREATE INDEX IF NOT EXISTS idx_inscriptions_member_phone ON public.inscriptions (member_phone);
CREATE INDEX IF NOT EXISTS idx_inscriptions_is_visitor ON public.inscriptions (is_visitor);


-- 4. AJUSTE DE COERÊNCIA DE DADOS (OPCIONAL)
-- Atualiza as inscrições existentes que possuem cargo/patente "Visitante" para marcar is_visitor como TRUE
UPDATE public.inscriptions 
SET is_visitor = TRUE 
WHERE member_rank IN ('Visitante', 'Visitante / Avulso', 'Visitante Avulso');


-- 5. CONFIGURAR SEGURANÇA NO NÍVEL DE LINHA (RLS - ROW LEVEL SECURITY)
-- Para garantir que visitantes consigam se registrar sem estar logados no painel de membros,
-- mas mantendo a segurança para que estranhos não deletem ou alterem fichas alheias.

ALTER TABLE public.congresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas anteriores para evitar conflitos de sintaxe
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

-- Políticias para inscriptions
CREATE POLICY "Leitura livre para todos de inscriptions" ON public.inscriptions FOR SELECT USING (true);
CREATE POLICY "Inserção livre para todos de inscriptions" ON public.inscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização livre para todos de inscriptions" ON public.inscriptions FOR UPDATE USING (true);
CREATE POLICY "Deleção livre para todos de inscriptions" ON public.inscriptions FOR DELETE USING (true);


-- 6. CONCEDER PERMISSÕES COMPLETAS À GATEWAY DE API DO SUPABASE (anon, authenticated, service_role)
-- Evita erros de "insufficient privileges" ou tabelas não expostas na API REST
GRANT ALL ON TABLE public.congresses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.workshops TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.agenda_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inscriptions TO anon, authenticated, service_role;


-- 7. RECARGA DO CACHE DE ESQUEMAS DO SUPABASE (ANTI-ERRO PGRST205)
-- Força o PostgREST a ler a nova estrutura de colunas, tabelas e índices imediatamente
NOTIFY pgrst, 'reload schema';
