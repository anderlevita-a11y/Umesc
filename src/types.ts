/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string;
  title: string;
  category: "mission" | "social" | "educative";
  description: string;
  detailedNeeds: string;
  location: string;
  image: string;
  raisedPercent: number;
  targetAmount: number;
  currentAmount: number;
}

export interface Coordinator {
  id?: string;
  name: string;
  rank: string; // e.g., "Sargento PM", "Major BM"
  role: string;  // e.g., "Coordenador Regional Norte"
  region: string; // e.g., "Joinville & Região"
  contact: string;
  avatar: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: "Geral" | "Eventos" | "Instrução";
  content: string;
  date: string;
  isImportant?: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "Estadual" | "Regional" | "Oração" | "Reunião";
  description: string;
}

export interface DocumentFile {
  id: string;
  title: string;
  category: "Estatutos" | "Formulários" | "Relatórios" | "Legislação";
  fileSize: string;
  publishedDate: string;
  downloadCount: number;
  url: string;
}

export interface MemberRegistration {
  name: string;
  cpf: string;
  birthDate: string;
  militaryForce: "PM" | "BM" | "FFAA" | "Civil" | "Apoiador"; // PM: Polícia Militar, BM: Bombeiro Militar, Civil / Sympathizer
  rank: string; // Posto/Graduação ou Profissão
  rgMilitar?: string;
  church: string;
  phone: string;
  email: string;
  city: string;
  lgpdConsent: boolean;
  marketingConsent: boolean;
  registrationDate: string;
  securityHash: string; // Simulated encrypted hash representing safe database compliance
  password?: string; // Member password for accessing restricted intranet portal
  approved?: boolean; // New: Administrator homologation/unlocked state
  paused?: boolean; // New: Option to pause registration
  archived?: boolean; // New: Option to archive registration (only for paused registrations)
  photoUrl?: string; // New: Profile / credential photo (3x4)
  isDirector?: boolean; // New: Option to promote member to director (can login to administrative panel)
}

export interface DonationSim {
  projectId: string;
  donorName: string;
  amount: number;
  paymentMethod: "pix" | "transfer";
  email: string;
  isAnonymous: boolean;
  lgpdConsent: boolean;
}

export interface Donation {
  id: string;
  projectId: string;
  projectName: string;
  donorName: string;
  donorWhatsapp: string;
  amount: number;
  paymentStatus: "pendente" | "pago" | "em_analise" | "recusado";
  paymentProofUrl?: string;
  paymentProofName?: string;
  registrationDate: string;
}

export interface FichaFiliacao {
  id: string;
  memberCpf: string;
  memberName: string;
  organ: "PMSC 2801" | "BMSC 2802" | "OUTRO";
  organOther?: string;
  lotacaoMunicipio: string;
  categoria: "ATIVA" | "PRESERVA_REMUNERADA" | "PENSIONISTA" | "REFORMADO";
  matricula: string;
  vinculo: string;
  birthDate: string;
  genero: "M" | "F";
  addressRua: string;
  addressBairro: string;
  addressCep: string;
  addressCidade: string;
  contactCidade: string;
  contactFones: string;
  contactEmail: string;
  opcaoAutorizacao: 1 | 2 | 3;
  percentualDesconto?: 0.6 | 1.2 | 1.8 | 2.4 | 3.0;
  percentualAnterior?: 0.6 | 1.2 | 1.8 | 2.4 | 3.0;
  percentualNovo?: 0.6 | 1.2 | 1.8 | 2.4 | 3.0;
  dataInscricao: string;
  assinaturaNome: string;
  assinaturaDesenho?: string;
  signatureDate: string;
  ipAddress: string;
  securitySeal: string;
}

export interface MemberContent {
  id: string;
  title: string;
  category: "Informativo Geral" | "Devocional Diário" | "Aviso de Farda" | "Convocação de Assembléia" | "Boletim Extraordinário";
  bodyText: string;
  attachmentUrl?: string;
  status: "Pronto" | "Rascunho" | "Arquivado";
  createdAt: string;
}

export interface CapelaniaService {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  emoji?: string;
  imageUrl?: string;
  tabLink: "notices" | "structure" | "registration" | "congressos" | "agenda";
}

export interface ApoioFemininoPost {
  id?: string;
  title: string;
  content: string;
  mediaType: "image" | "video" | "none";
  mediaUrl?: string;
  createdAt?: string;
}



