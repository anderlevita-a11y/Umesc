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
    avatar: ""
  },
  {
    name: "Sargento PM Joel Ferreira",
    rank: "Sargento PM",
    role: "Coordenador Regional Vale do Itajaí",
    region: "Blumenau & Vale Oriental",
    contact: "(47) 99115-3344",
    avatar: ""
  },
  {
    name: "Capitão BM Roberto Schmidt",
    rank: "Capitão BM",
    role: "Coordenador Regional Norte",
    region: "Joinville & Planalto Norte",
    contact: "(47) 98765-4321",
    avatar: ""
  },
  {
    name: "Major PM Vanderlei de Lima",
    rank: "Major PM",
    role: "Coordenador Regional Oeste",
    region: "Chapecó & Extremo Oeste",
    contact: "(49) 99912-8877",
    avatar: ""
  },
  {
    name: "Cabo PM Daniela Souza",
    rank: "Cabo PM",
    role: "Coordenadora Regional Sul",
    region: "Criciúma / Tubarão",
    contact: "(48) 99422-5566",
    avatar: ""
  },
  {
    name: "Sargento BM Thiago Luz",
    rank: "Sargento BM",
    role: "Coordenador Regional Planalto Serrano",
    region: "Lages & Planalto Central",
    contact: "(49) 98811-0011",
    avatar: ""
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_EVENTS: ScheduleEvent[] = [];

export const INITIAL_DOCUMENTS: DocumentFile[] = [];

export const DEFAULT_CAPELANIA_SERVICES: CapelaniaService[] = [];

