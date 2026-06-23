/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Coordinator, Announcement, ScheduleEvent, DocumentFile, CapelaniaService } from "./types";

export const UMESC_ABOUT = {
  acronym: "UMESC",
  fullName: "União de Militares Evangélicos de Santa Catarina",
  foundationYear: "1989",
  legalStatus: "Organização missionária interdenominacional sem fins lucrativos, consolidada sob a personalidade jurídica de utilidade pública estadual e amparada pela garantia constitucional de assistência religiosa às forças de segurança.",
  mission: "Promover a comunhão, a assistência espiritual, ética e psicológica aos integrantes das Forças de Segurança de Santa Catarina (Polícia Militar, Corpo de Bombeiros, Polícia Científica, Polícia Civil e Forças Armadas), fomentando valores ético-cristãos e prestando apoio missionário interdenominacional.",
  vision: "Ser referência nacional em capelania militar voluntária, apoio social e engajamento ético, impactando positivamente a vida de cada policial e bombeiro militar e estendendo o amparo ético-cristão às suas famílias e à sociedade catarinense.",
  values: [
    "Fidelidade às Escrituras Sagradas",
    "Disciplina e Lealdade Institucional",
    "Solidariedade e Socorro ao Próximo",
    "Transparência Administrativa e Conformidade de Dados (LGPD)",
    "Ecumenismo Interdenominacional Evangélico",
    "Valorização da Vida e Saúde Mental"
  ]
};

export const DEFAULT_DIRETORIA = [
  { id: "dir_1", name: "Coronel PMSC RR, Pastor EMILSON", role: "Presidente", church: "" },
  { id: "dir_2", name: "Sargento PMSC RR, Pastor ROTTA", role: "Vice-Presidente", church: "" },
  { id: "dir_3", name: "Sargento BMSC RR, Pastor CLÁUDIO", role: "Secretário", church: "" },
  { id: "dir_4", name: "Sub Tenente BMSC Evangelísta LIMA", role: "2º Secretário", church: "" },
  { id: "dir_5", name: "Sargento PMSC RR, Pastor AUGUSTO", role: "Tesoureiro", church: "" },
  { id: "dir_6", name: "Sargento PMSC, Pastor ROBERTO", role: "2º Tesoureiro", church: "" },
  { id: "dir_7", name: "Sargento PMSC RR Presbítero JUCELINO", role: "Conselho Fiscal", church: "" },
  { id: "dir_8", name: "Sargento PMSC Presbítero ANDERSON", role: "Conselho Fiscal", church: "" },
  { id: "dir_9", name: "Sargento BMSC Presbítero SELMIR", role: "Conselho Fiscal", church: "" },
  { id: "dir_10", name: "Sargento PMMS Pastor SERGIO", role: "Suplente", church: "" },
  { id: "dir_11", name: "Sargento PMSC RR Presbítero CHARLES ADRIANO", role: "Suplente", church: "" },
  { id: "dir_12", name: "Sargento BMSC RR Presbítero MISAEL", role: "Suplente", church: "" },
  { id: "dir_13", name: "Tenente Coronel PMSC RR, Pastor JURILDO", role: "Assessor Jurídico", church: "" },
  { id: "dir_14", name: "Sargento PMSC RR, Presbítero ANTUNES", role: "Secretário Executivo", church: "" }
];

export const CORE_GOVERNANCE = {
  board: DEFAULT_DIRETORIA,
  legislation: [
    {
      title: "Estatuto Social Oficial do UMESC",
      description: "Documento jurídico fundamental que estabelece os fins, direitos e deveres de todos os sócios e a governança institucional.",
      lawReference: "Lei Federal nº 10.406/02 e registro em cartório sob o nº de ordem 342.980."
    },
    {
      title: "Regimento Interno de Representação",
      description: "Regulamento sobre a atuação em uniforme militar, representação em cerimônias de corporações militares e coordenações regionais.",
      lawReference: "Consonância com o Regulamento de Policiamento e Ordem das Corporações de SC (Decreto Estadual)."
    },
    {
      title: "Resolução de Segurança e Proteção LGPD",
      description: "Diretrizes e salvaguardas internas para a coleta, armazenamento e eliminação de registros cadastrais de membros e doadores militares, protegendo a segurança privada dos agentes de segurança.",
      lawReference: "Conformidade estrita com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
    }
  ]
};

export const COORDINATORS_DATA: Coordinator[] = [
  {
    name: "Subtenente PM Anderson Alves",
    rank: "Subtenente PM",
    role: "Coordenador Regional Grande Florianópolis",
    region: "Grande Florianópolis / Litoral",
    contact: "(48) 98822-1920",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Sargento PM Joel Ferreira",
    rank: "Sargento PM",
    role: "Coordenador Regional Vale do Itajaí",
    region: "Blumenau & Vale Oriental",
    contact: "(47) 99115-3344",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Capitão BM Roberto Schmidt",
    rank: "Capitão BM",
    role: "Coordenador Regional Norte",
    region: "Joinville & Planalto Norte",
    contact: "(47) 98765-4321",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Major PM Vanderlei de Lima",
    rank: "Major PM",
    role: "Coordenador Regional Oeste",
    region: "Chapecó & Extremo Oeste",
    contact: "(49) 99912-8877",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Cabo PM Daniela Souza",
    rank: "Cabo PM",
    role: "Coordenadora Regional Sul",
    region: "Criciúma / Tubarão",
    contact: "(48) 99422-5566",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
  },
  {
    name: "Sargento BM Thiago Luz",
    rank: "Sargento BM",
    role: "Coordenador Regional Planalto Serrano",
    region: "Lages & Planalto Central",
    contact: "(49) 98811-0011",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200"
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj_1",
    title: "Bíblias para Recrutas e Policiais",
    category: "educative",
    description: "Distribuição física de material de apoio bíblico e ética militar de tamanho compacto para acoplamento seguro em fardas, entregues diretamente em formaturas de novos soldados de SC.",
    detailedNeeds: "Recursos financeiros para impressão, frete e embalagem resistente à água. Cada porção de literatura cristão apoia diretamente o militar na superação de adversidades em campo.",
    location: "Batalhões e Escolas de Formação em todo o Estado de SC",
    image: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
    raisedPercent: 68,
    targetAmount: 15000,
    currentAmount: 10200
  },
  {
    id: "proj_2",
    title: "Capelania & Apoio de Saúde Mental aos Heróis de Farda",
    category: "mission",
    description: "Garantia de acolhimento presencial por meio de capelães especializados para policiais e bombeiros militares acometidos por estresse pós-traumático, depressão ou crises familiares decorrentes do serviço operacional.",
    detailedNeeds: "Custos de transporte para visitas hospitalares, retiros de reabilitação emocional das famílias e produção de guias práticos sobre bem-estar e fé militar.",
    location: "Sedes Regionais, Unidades Hospitalares de SC",
    image: "https://images.unsplash.com/photo-1461532252243-85f001ca588a?auto=format&fit=crop&q=80&w=600",
    raisedPercent: 42,
    targetAmount: 30000,
    currentAmount: 12600
  },
  {
    id: "proj_3",
    title: "Operação Sopão e Cobertores Missionária",
    category: "social",
    description: "Ações periódicas coordenadas por policiais e bombeiros evangélicos fora do horário de serviço para resgate de moradores de rua e fornecimento de apoio e refeições quentes em noites de invernos frios.",
    detailedNeeds: "Doação direta de gêneros alimentícios não perecíveis, cobertores de alta qualidade resistentes ao frio e materiais descartáveis para entrega de sopas.",
    location: "Regiões metropolitanas nas noites de inverno (Florianópolis, Lages, Caçador)",
    image: "https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=600",
    raisedPercent: 85,
    targetAmount: 8000,
    currentAmount: 6800
  },
  {
    id: "proj_4",
    title: "Famílias de Heróis - Amparo e Conectividade",
    category: "social",
    description: "Consolo e apoio financeiro e espiritual a viúvas e órfãos de policiais e bombeiros que perderam a vida em combate ou em decorrência do estresse severo provocado pelo exercício da profissão.",
    detailedNeeds: "Criação de fundo assistencial de emergência, bolsas de livros escolares infantis e facilitação de tratamento psicoterapêutico especializado às famílias enlutadas.",
    location: "Territórios Catarinenses",
    image: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&q=80&w=600",
    raisedPercent: 50,
    targetAmount: 25000,
    currentAmount: 12500
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann_1",
    title: "Grande Encontro Estadual de Militares Cristãos 2026",
    category: "Eventos",
    content: "Convidamos todos os militares evangélicos, familiares e amigos do evangelho para o nosso grande congresso estadual no Teatro do CIC em Florianópolis. Teremos pregações, relatos missionários de campo e momentos especiais de louvor.",
    date: '2026-06-15',
    isImportant: true
  },
  {
    id: "ann_2",
    title: "Campanha de Inverno: Coleta de Cobertores Revestidos",
    category: "Geral",
    content: "Estão abertos os pontos de coleta de agasalhos e cobertores em todos os batalhões sede integrados ao UMESC. Colabore com a Operação Inverno para aquecermos as noites frias de Santa Catarina com amor de Cristo.",
    date: '2026-05-20',
    isImportant: false
  },
  {
    id: "ann_3",
    title: "Treinamento Virtual de Capelania e Aconselhamento em Crise",
    category: "Instrução",
    content: "O departamento de instrução do UMESC promoverá um seminário online via videoconferência para capacitar novos voluntários civis e militares para assistência espiritual básica em situações críticas de trauma.",
    date: '2026-05-28',
    isImportant: true
  }
];

export const INITIAL_EVENTS: ScheduleEvent[] = [
  {
    id: "event_1",
    title: "Culto Online de Oração pelas Forças de Segurança",
    date: "2026-05-24",
    time: "20:00",
    location: "Transmissão Oficial pelo YouTube do UMESC",
    type: "Oração",
    description: "Clamor especial pela proteção dos policiais civis, militares, rodoviários e bombeiros que atuam em turnos de alta periculosidade noturna."
  },
  {
    id: "event_2",
    title: "Reunião de Alinhamento com Coordenadores Regionais",
    date: "2026-06-05",
    time: "09:00",
    location: "Sede de Apoio UMESC - Blumenau / SC",
    type: "Reunião",
    description: "Deliberações fiscais e planejamento estratégico do segundo semestre de 2026, com foco na adequação da política de cadastro de dados de novos membros à LGPD."
  },
  {
    id: "event_3",
    title: "Congresso Regional Sul de Militares Evangélicos",
    date: "2026-07-12",
    time: "14:00 às 21:00",
    location: "Auditorito Municipal - Criciúma",
    type: "Regional",
    description: "Preleções especiais focadas na saúde psicológica de fardados evangélicos e louvor ao vivo com bandas de batalhões convidados."
  },
  {
    id: "event_4",
    title: "Devocional de Integração em Batalhão de Joinville",
    date: "2026-05-30",
    time: "07:30",
    location: "Auditório do 8º Batalhão da PM - Joinville / SC",
    type: "Regional",
    description: "Café de comunhão matinal voluntário e partilha de literatura cristã especial para recrutas recém-ingressados."
  }
];

export const INITIAL_DOCUMENTS: DocumentFile[] = [
  {
    id: "doc_1",
    title: "Estatuto Social consolidado da Organização",
    category: "Estatutos",
    fileSize: "1.2 MB",
    publishedDate: "2024-03-12",
    downloadCount: 412,
    url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBAnkaUbqFAZfX/view?usp=sharing"
  },
  {
    id: "doc_2",
    title: "Ficha Física Opcional de Inscrição em PDF",
    category: "Formulários",
    fileSize: "450 KB",
    publishedDate: "2025-01-08",
    downloadCount: 850,
    url: "ficha_cadastro_membro_umesc.pdf"
  },
  {
    id: "doc_3",
    title: "Prestação de Contas Anual e Relatório de Caixa",
    category: "Relatórios",
    fileSize: "2.8 MB",
    publishedDate: "2026-03-31",
    downloadCount: 198,
    url: "balanco_fiscal_anual_2025.pdf"
  },
  {
    id: "doc_4",
    title: "Regimento Interno e Normas de Unidade Estética",
    category: "Legislação",
    fileSize: "820 KB",
    publishedDate: "2024-06-25",
    downloadCount: 310,
    url: "regimento_interno_representacao_e_simbolos.pdf"
  },
  {
    id: "doc_5",
    title: "Guia LGPD - Direitos de Acesso e Termos de Privacidade",
    category: "Legislação",
    fileSize: "680 KB",
    publishedDate: "2025-10-14",
    downloadCount: 540,
    url: "https://drive.google.com/file/d/1yD7XNqf2Qv_bHw8z5O6-1X624o5z9X78/view?usp=sharing"
  }
];

export const DEFAULT_CAPELANIA_SERVICES: CapelaniaService[] = [
  {
    id: "capsrv_1",
    title: "Guarnição e Auxílio",
    description: "Acolhimento imediato a militares em face de estresse severo ou crises emocionais.",
    buttonText: "Fazer Inscrição / Solicitar Ajuda →",
    emoji: "✓",
    imageUrl: "https://images.unsplash.com/photo-1461532252243-85f001ca588a?auto=format&fit=crop&q=80&w=600",
    tabLink: "registration"
  },
  {
    id: "capsrv_2",
    title: "Literaturas de Uniforme",
    description: "Entrega gratuita de Bíblias compactas de bolso para leitura em postos e patrulhas.",
    buttonText: "Quadro de Avisos / Livros →",
    emoji: "📖",
    imageUrl: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
    tabLink: "notices"
  },
  {
    id: "capsrv_3",
    title: "Resgate e Ação Social",
    description: "Sopões e agasalhos na serra e planalto em parcerias voluntárias catarinenses.",
    buttonText: "Projetos e Informativos →",
    emoji: "♥",
    imageUrl: "https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=600",
    tabLink: "notices"
  }
];

