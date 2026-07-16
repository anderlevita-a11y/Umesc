/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  User, 
  LogOut, 
  Bell, 
  Calendar, 
  Users, 
  Scale, 
  Trash2, 
  FileDown, 
  UserPlus, 
  UserX,
  Download, 
  CheckCircle2, 
  Clock, 
  Building, 
  HelpCircle, 
  FileCheck, 
  MapPin, 
  ChevronRight, 
  AlertCircle,
  BookOpen,
  MessageCircle,
  UploadCloud,
  ExternalLink,
  Compass
} from "lucide-react";
import { MemberRegistration, Coordinator, Announcement, ScheduleEvent, DocumentFile, FichaFiliacao } from "../types";
import { generateFichaPdf } from "../lib/fichaPdfHelper.ts";
import FichaFiliacaoForm from "./FichaFiliacaoForm.tsx";
import PlanoLeituraBiblica from "./PlanoLeituraBiblica.tsx";
import CongressoInscricaoMembro from "./CongressoInscricaoMembro.tsx";
import CapelaniaVolunteeringForm from "./CapelaniaVolunteeringForm.tsx";
import { membersService, isSupabaseConfigured, fichasFiliacaoService, coordinatorsService } from "../lib/supabase.ts";
import { termsService } from "../lib/termsService.ts";
import { sanitizeInput, isValidCPF, formatPhone, isValidPhone, isValidEmail, getWhatsAppLink } from "../lib/validation.ts";
import { 
  CORE_GOVERNANCE, 
  COORDINATORS_DATA, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_EVENTS, 
  INITIAL_DOCUMENTS 
} from "../data";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";

interface SpecialCalendarDate {
  date: string; // YYYY-MM-DD
  title: string;
  type: "feriado" | "pmsc_bmsc" | "umesc";
  description: string;
}

const SPECIAL_DATES: SpecialCalendarDate[] = [
  // Feriados Nacionais Brasileros
  { date: "2026-01-01", title: "Confraternização Universal", type: "feriado", description: "Ano Novo - Feriado Nacional que celebra o início de um novo ciclo civil." },
  { date: "2026-04-03", title: "Sexta-feira Santa", type: "feriado", description: "Sexta-feira da Paixão - Feriado Nacional de profunda reflexão cristã." },
  { date: "2026-04-21", title: "Tiradentes (Patrono Policial)", type: "feriado", description: "Feriado Nacional. Homenagem a Tiradentes, reconhecido Patrono das Polícias Civis e Militares brasileiras por sua bravura e ideais." },
  { date: "2026-05-01", title: "Dia do Trabalhador", type: "feriado", description: "Feriado Nacional dedicado ao Dia Mundial do Trabalho e reconhecimento laboral." },
  { date: "2026-06-04", title: "Corpus Christi", type: "feriado", description: "Feriado Nacional / Ponto Facultativo de cunho religioso e litúrgico tradicional." },
  { date: "2026-09-07", title: "Independência do Brasil", type: "feriado", description: "Feriado Nacional que comemora a proclamação da independência do país com solenidades e desfiles fardados estatutários." },
  { date: "2026-10-12", title: "Nossa Senhora Aparecida", type: "feriado", description: "Feriado Nacional consagrado à Padroeira do Brasil." },
  { date: "2026-11-02", title: "Finados", type: "feriado", description: "Feriado Nacional de luto honroso e memória aos entes já falecidos." },
  { date: "2026-11-15", title: "Proclamação da República", type: "feriado", description: "Feriado Nacional comemorando a instauração da sociedade repressora da monarquia militar e reerguendo a república federativa." },
  { date: "2026-12-25", title: "Natal do Senhor Jesus", type: "feriado", description: "Feriado Nacional. Celebração universal do nascimento do Salvador." },

  // PMSC / CBMSC de Santa Catarina
  { date: "2026-05-05", title: "Aniversário Oficial da PMSC (1835)", type: "pmsc_bmsc", description: "Aniversário de Criação da Polícia Militar de Santa Catarina. Em 1835, sob a presidência provincial de Feliciano Nunes Pires, foi fundada a valorosa corporação destinada à manutenção da ordem e segurança do solo catarinense." },
  { date: "2026-07-02", title: "Dia Nacional do Bombeiro Militar", type: "pmsc_bmsc", description: "Dia do Bombeiro Militar em SC, celebrando os heróis do Corpo de Bombeiros que arriscam suas vidas na prevenção de incêndios, resgates e salvamentos de urgência." },
  { date: "2026-09-26", title: "Dia da Emancipação do BMSC (2003)", type: "pmsc_bmsc", description: "Emenda Constitucional nº 33 de 2003 emancipa o Corpo de Bombeiros Militar de Santa Catarina, desmembrando-o organizacionalmente da PMSC para atuar de forma autônoma e especializada com o tradicional selo de heroísmo." },
  { date: "2026-08-25", title: "Dia do Soldado", type: "pmsc_bmsc", description: "Data de alta condecoração aos soldados das Forças de Segurança e das corporações coirmãs de Santa Catarina." },
  { date: "2026-12-11", title: "Dia do Guarda-Vidas Catarinense (BMSC)", type: "pmsc_bmsc", description: "Reconhecimento solene de salvamento balneário. Data comemorativa de suma importância do veraneio de Santa Catarina para prevenir afogamentos." },
  { date: "2026-10-20", title: "Dia do Policial e Bombeiro Inativo da PMSC/BMSC", type: "pmsc_bmsc", description: "Dia Estadual do Militar Estadual Inativo de SC, reverenciando a folha de serviços prestados pelos oficiais e praças que honraram a farda nas ruas de Santa Catarina." }
];

const MONTHS_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MemberDashboardProps {
  onBackToHome?: () => void;
  initialTab?: "notices" | "structure" | "registration" | "filiacao" | "leitura" | "congressos" | "voluntariado";
  onEnterAdminMode?: () => void;
}

export default function MemberDashboard({ onBackToHome, initialTab, onEnterAdminMode }: MemberDashboardProps) {
  // Session / Auth simulation state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{
    name: string;
    rank: string;
    force: string;
    city: string;
    registrationID: string;
    sessionID: string;
    approved?: boolean;
    paused?: boolean;
    archived?: boolean;
    securityHash?: string;
    rawCpf?: string;
    rawForce?: string;
    rawChurch?: string;
    rawPhone?: string;
    rawEmail?: string;
    rawBirthDate?: string;
    password?: string;
  } | null>(null);

  const isSuspended = !!loggedInUser?.paused || !!loggedInUser?.archived;
  const isRestrictedAccess = loggedInUser?.approved === false || isSuspended;

  // Ficha de Filiação States
  const [submittedFicha, setSubmittedFicha] = useState<FichaFiliacao | null>(null);
  const [fichaForm, setFichaForm] = useState({
    organ: "PMSC 2801" as "PMSC 2801" | "BMSC 2802" | "OUTRO",
    organOther: "",
    lotacaoMunicipio: "",
    categoria: "ATIVA" as "ATIVA" | "PRESERVA_REMUNERADA" | "PENSIONISTA" | "REFORMADO",
    matricula: "",
    vinculo: "1",
    birthDate: "",
    genero: "M" as "M" | "F",
    addressRua: "",
    addressBairro: "",
    addressCep: "",
    addressCidade: "",
    contactCidade: "",
    contactFones: "",
    contactEmail: "",
    opcaoAutorizacao: 1 as 1 | 2 | 3,
    percentualDesconto: 1.2 as 0.6 | 1.2 | 1.8 | 2.4 | 3.0,
    percentualAnterior: 1.2 as 0.6 | 1.2 | 1.8 | 2.4 | 3.0,
    percentualNovo: 1.8 as 0.6 | 1.2 | 1.8 | 2.4 | 3.0,
    dataInscricao: "",
    assinaturaNome: "",
    assinaturaType: "type" as "type" | "draw",
  });
  const [fichaConsent, setFichaConsent] = useState(false);
  const [fichaSuccessMsg, setFichaSuccessMsg] = useState("");
  const [fichaErrorMsg, setFichaErrorMsg] = useState("");

  // Profile editing fields state
  const [profileName, setProfileName] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [profileForce, setProfileForce] = useState<"PM" | "BM" | "FFAA" | "Civil" | "Apoiador">("PM");
  const [profileRank, setProfileRank] = useState("");
  const [profileRgMilitar, setProfileRgMilitar] = useState("");
  const [profileChurch, setProfileChurch] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto ] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // On-screen notification states for auth and user activities
  const [loginError, setLoginError] = useState("");
  const [firstAccessError, setFirstAccessError] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [regErrorMsg, setRegErrorMsg] = useState("");

  // States for self-deletion under the right to be forgotten (LGPD compliance)
  const [deleteSafetyChecked, setDeleteSafetyChecked] = useState(false);
  const [deleteInputConfirmation, setDeleteInputConfirmation] = useState("");
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userDeletionError, setUserDeletionError] = useState("");

  // First Access & Forgot Password states
  const [loginMode, setLoginMode] = useState<"standard" | "first-access" | "forgot-password">("standard");
  const [firstAccessEmail, setFirstAccessEmail] = useState("");
  const [firstAccessCpf, setFirstAccessCpf] = useState("");
  const [firstAccessPass, setFirstAccessPass] = useState("");
  const [firstAccessPassConfirm, setFirstAccessPassConfirm] = useState("");
  const [firstAccessSuccess, setFirstAccessSuccess] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCpf, setForgotCpf] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotNewPassConfirm, setForgotNewPassConfirm] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Active dashboard view selection
  const [activeTab, setActiveTab ] = useState<"notices" | "structure" | "registration" | "profile" | "filiacao" | "leitura" | "congressos" | "voluntariado">(initialTab || "notices");

  // Sync tab choice
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sync profile fields with authenticated user data
  useEffect(() => {
    if (loggedInUser) {
      setProfileName(loggedInUser.name || "");
      setProfileBirthDate(loggedInUser.rawBirthDate || "");
      setProfileForce((loggedInUser.rawForce as any) || "PM");
      setProfileRank(loggedInUser.rank || "");
      setProfileRgMilitar(loggedInUser.registrationID || "");
      setProfileChurch(loggedInUser.rawChurch || "");
      setProfilePhone(loggedInUser.rawPhone || "");
      setProfileEmail(loggedInUser.rawEmail || "");
      setProfileCity(loggedInUser.city || "");
      setProfilePassword(loggedInUser.password || "");
      setProfilePhotoUrl(loggedInUser.photoUrl || "");
    }
  }, [loggedInUser]);

  // Load Submitted Ficha and Pre-fill form fields
  useEffect(() => {
    if (loggedInUser) {
      // 1. Load from Supabase service
      fichasFiliacaoService.getFichas().then((list) => {
        const found = list.find((f) => f.memberCpf === loggedInUser.rawCpf);
        setSubmittedFicha(found || null);
      }).catch((e) => {
        console.error("Error loading submitted ficha from service:", e);
      });

      // 2. Pre-fill form
      const forcePrefill = loggedInUser.rawForce === "PM" ? "PMSC 2801" : loggedInUser.rawForce === "BM" ? "BMSC 2802" : "OUTRO";
      setFichaForm({
        organ: forcePrefill as any,
        organOther: loggedInUser.rawForce && loggedInUser.rawForce !== "PM" && loggedInUser.rawForce !== "BM" ? loggedInUser.rawForce : "",
        lotacaoMunicipio: loggedInUser.city || "",
        categoria: "ATIVA",
        matricula: loggedInUser.registrationID || "",
        vinculo: "1",
        birthDate: loggedInUser.rawBirthDate || "",
        genero: "M",
        addressRua: "",
        addressBairro: "",
        addressCep: "",
        addressCidade: loggedInUser.city || "",
        contactCidade: loggedInUser.city || "",
        contactFones: loggedInUser.rawPhone || "",
        contactEmail: loggedInUser.rawEmail || "",
        opcaoAutorizacao: 1,
        percentualDesconto: 1.2,
        percentualAnterior: 1.2,
        percentualNovo: 1.8,
        dataInscricao: `${loggedInUser.city || "Florianopolis"}, ${new Date().toLocaleDateString("pt-BR")}`,
        assinaturaNome: loggedInUser.name || "",
        assinaturaType: "type",
      });
      setFichaConsent(false);
    }
  }, [loggedInUser]);

  // Terms of Use & Privacy Policy states
  const [showTermsOverlay, setShowTermsOverlay] = useState(false);
  const [showTermsModalOnly, setShowTermsModalOnly] = useState(false);
  const [currentTerms, setCurrentTerms] = useState({ content: "", lastUpdated: "" });

  // Load and verify Terms of Use on successful login/session restore
  useEffect(() => {
    if (isLoggedIn && loggedInUser && loggedInUser.securityHash) {
      const checkTermsOfUse = async () => {
        try {
          const loaded = await termsService.getTerms();
          setCurrentTerms(loaded);
          
          const acceptedTimestamp = localStorage.getItem(`umesc_accepted_terms_${loggedInUser.securityHash}`);
          
          // If never accepted OR accepted timestamp is older than the last updated terms timestamp, show overlay
          if (!acceptedTimestamp || new Date(acceptedTimestamp) < new Date(loaded.lastUpdated)) {
            setShowTermsOverlay(true);
          } else {
            setShowTermsOverlay(false);
          }
        } catch (err) {
          console.error("Erro ao validar termos de uso:", err);
        }
      };
      
      checkTermsOfUse();
    } else {
      setShowTermsOverlay(false);
    }
  }, [isLoggedIn, loggedInUser]);

  const handleAcceptTerms = () => {
    if (loggedInUser && loggedInUser.securityHash) {
      const now = new Date().toISOString();
      localStorage.setItem(`umesc_accepted_terms_${loggedInUser.securityHash}`, now);
      setShowTermsOverlay(false);
    }
  };

  // State elements from resource center & member registrations
  const [activeEventFilter, setActiveEventFilter] = useState<string>("TODOS");
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<"calendar" | "list">("calendar");
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("umesc_announcements");
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });
  const [documents, setDocuments] = useState<DocumentFile[]>(() => {
    const saved = localStorage.getItem("umesc_documents");
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });
  const [downloadedDocId, setDownloadedDocId] = useState<string | null>(null);
  const [board, setBoard] = useState<any[]>(() => {
    const saved = localStorage.getItem("umesc_diretoria");
    return saved ? JSON.parse(saved) : CORE_GOVERNANCE.board;
  });

  const [coordenadores, setCoordenadores] = useState<any[]>(() => {
    const saved = localStorage.getItem("umesc_coordenadores");
    return saved ? JSON.parse(saved) : COORDINATORS_DATA;
  });

  useEffect(() => {
    const loadBoard = () => {
      const saved = localStorage.getItem("umesc_diretoria");
      if (saved) {
        setBoard(JSON.parse(saved));
      } else {
        setBoard(CORE_GOVERNANCE.board);
      }
    };
    const loadCoordenadores = () => {
      coordinatorsService.getCoordinators().then((data) => {
        setCoordenadores(data);
      }).catch((err) => {
        console.error("Error loading coordinators:", err);
        const saved = localStorage.getItem("umesc_coordenadores");
        if (saved) {
          setCoordenadores(JSON.parse(saved));
        } else {
          setCoordenadores(COORDINATORS_DATA);
        }
      });
    };
    const loadAnnouncements = () => {
      const saved = localStorage.getItem("umesc_announcements");
      if (saved) {
        setAnnouncements(JSON.parse(saved));
      } else {
        setAnnouncements(INITIAL_ANNOUNCEMENTS);
      }
    };
    const loadDocuments = () => {
      const saved = localStorage.getItem("umesc_documents");
      if (saved) {
        setDocuments(JSON.parse(saved));
      } else {
        setDocuments(INITIAL_DOCUMENTS);
      }
    };
    loadBoard();
    loadCoordenadores();
    loadAnnouncements();
    loadDocuments();
    window.addEventListener("storage_content_change", loadBoard);
    window.addEventListener("storage_content_change", loadCoordenadores);
    window.addEventListener("storage_content_change", loadAnnouncements);
    window.addEventListener("storage_content_change", loadDocuments);
    window.addEventListener("umesc_content_updated", loadBoard);
    window.addEventListener("umesc_content_updated", loadCoordenadores);
    window.addEventListener("umesc_content_updated", loadAnnouncements);
    window.addEventListener("umesc_content_updated", loadDocuments);
    window.addEventListener("storage", loadBoard);
    window.addEventListener("storage", loadCoordenadores);
    window.addEventListener("storage", loadAnnouncements);
    window.addEventListener("storage", loadDocuments);
    return () => {
      window.removeEventListener("storage_content_change", loadBoard);
      window.removeEventListener("storage_content_change", loadCoordenadores);
      window.removeEventListener("storage_content_change", loadAnnouncements);
      window.removeEventListener("storage_content_change", loadDocuments);
      window.removeEventListener("umesc_content_updated", loadBoard);
      window.removeEventListener("umesc_content_updated", loadCoordenadores);
      window.removeEventListener("umesc_content_updated", loadAnnouncements);
      window.removeEventListener("umesc_content_updated", loadDocuments);
      window.removeEventListener("storage", loadBoard);
      window.removeEventListener("storage", loadCoordenadores);
      window.removeEventListener("storage", loadAnnouncements);
      window.removeEventListener("storage", loadDocuments);
    };
  }, []);

  // Region filtering
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("TODOS");

  // Members list from simulated localStorage
  const [membersList, setMembersList] = useState<MemberRegistration[]>([]);
  const [successMessage, setSuccessMessage] = useState(false);

  // Form Fields
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [militaryForce, setMilitaryForce] = useState<"PM" | "BM" | "FFAA" | "Civil" | "Apoiador">("PM");
  const [rank, setRank] = useState("");
  const [rgMilitar, setRgMilitar] = useState("");
  const [church, setChurch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [regPassword, setRegPassword] = useState("");

  // Dynamic regions for event scheduling
  const eventFilters = ["TODOS", "Estadual", "Regional", "Oração", "Reunião"];

  // Regions for coordinators
  const regionsList = [
    "TODOS",
    "Grande Florianópolis / Litoral",
    "Blumenau & Vale Oriental",
    "Joinville & Planalto Norte",
    "Chapecó & Extremo Oeste",
    "Criciúma / Tubarão",
    "Lages & Planalto Central"
  ];

  // Load Sim DB and state on mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const list = await membersService.getMembers();
        setMembersList(list);

        // Sync loggedInUser state if already logged in
        const session = sessionStorage.getItem("umesc_active_session");
        if (session) {
          try {
            const parsedSession = JSON.parse(session);
            if (parsedSession && parsedSession.securityHash) {
              const freshUser = list.find(m => m.securityHash === parsedSession.securityHash);
              if (freshUser) {
                const validatedApproved = freshUser.approved ?? false;
                const mappedUser = {
                  name: freshUser.name,
                  rank: freshUser.rank,
                  force: freshUser.militaryForce === "PM" ? "Polícia Militar SC" : freshUser.militaryForce === "BM" ? "Bombeiro Militar SC" : freshUser.militaryForce === "FFAA" ? "Forças Armadas" : freshUser.militaryForce === "Civil" ? "Polícia Civil / Servente" : "Apoiador Voluntário",
                  city: freshUser.city,
                  registrationID: freshUser.rgMilitar || "N/A",
                  sessionID: parsedSession.sessionID || `SES-${Math.floor(Math.random() * 9000000 + 1000000)}`,
                  approved: validatedApproved,
                  paused: freshUser.paused ?? false,
                  archived: freshUser.archived ?? false,
                  securityHash: freshUser.securityHash,
                  rawCpf: freshUser.cpf,
                  rawForce: freshUser.militaryForce,
                  rawChurch: freshUser.church,
                  rawPhone: freshUser.phone,
                  rawEmail: freshUser.email,
                  rawBirthDate: freshUser.birthDate,
                  password: freshUser.password,
                  photoUrl: freshUser.photoUrl || ""
                };
                setLoggedInUser(mappedUser);
                setIsLoggedIn(true);
                sessionStorage.setItem("umesc_active_session", JSON.stringify(mappedUser));
              } else {
                setLoggedInUser(parsedSession);
                setIsLoggedIn(true);
              }
            } else {
              setLoggedInUser(parsedSession);
              setIsLoggedIn(true);
            }
          } catch (_) {
            try {
              setLoggedInUser(JSON.parse(session));
              setIsLoggedIn(true);
            } catch (__) {}
          }
        }
      } catch (e) {
        console.error("Erro ao carregar associados do Supabase/Local:", e);
      }
    };

    loadMembers();

    // Event listener for administrative or external data updates (homologation)
    const handleContentUpdated = () => {
      loadMembers();
      const savedAnn = localStorage.getItem("umesc_announcements");
      setAnnouncements(savedAnn ? JSON.parse(savedAnn) : INITIAL_ANNOUNCEMENTS);
    };

    window.addEventListener("umesc_content_updated", handleContentUpdated);
    window.addEventListener("storage", handleContentUpdated);

    return () => {
      window.removeEventListener("umesc_content_updated", handleContentUpdated);
      window.removeEventListener("storage", handleContentUpdated);
    };
  }, []);

  const generateSha256Sim = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `SHA256-${Math.abs(hash).toString(16).substring(0, 8)}${Math.floor(Math.random() * 99999)}`;
  };

  const handleCpfFormatting = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      setCpf(cleaned);
    }
  };

  const formatMaskedCpf = (raw: string) => {
    if (raw.length < 11) return raw;
    return `${raw.substring(0, 3)}.***.***-${raw.substring(9, 11)}`;
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!authEmail) {
      setLoginError("Por favor insira um identificador válido (RG Militar ou E-mail).");
      return;
    }

    try {
      // Reload members from DB/Local for state freshness
      const list = await membersService.getMembers();
      const identifier = authEmail.toLowerCase().trim();
      
      // Find matching member by email or rgMilitar
      const found = list.find((m) => {
        const matchesEmail = m.email.toLowerCase().trim() === identifier;
        const matchesRg = m.rgMilitar && m.rgMilitar.toLowerCase().trim() === identifier;
        return matchesEmail || matchesRg;
      });

      if (!found) {
        setLoginError("Acesso negado: Nenhum associado cadastrado foi localizado com este e-mail ou RG Militar. Se for o seu primeiro acesso, sinta-se à vontade para registrar uma nova conta na aba 'Primeiro Acesso' logo acima!");
        return;
      }

      if (!found.password) {
        setLoginError("Sua conta foi localizada em nossos registros, mas você ainda não configurou uma senha de acesso definitivo. Por favor, utilize a aba de 'Primeiro Acesso' no cabeçalho para definir sua senha.");
        return;
      }

      if (found.password !== authPassword) {
        setLoginError("Senha de acesso inválida para esta credencial militar.");
        return;
      }

      const validatedApproved = found.approved ?? false;

      // Successful login mapped strictly to the registered user data
      const authenticatedUser = {
        name: found.name,
        rank: found.rank,
        force: found.militaryForce === "PM" ? "Polícia Militar SC" : found.militaryForce === "BM" ? "Bombeiro Militar SC" : found.militaryForce === "FFAA" ? "Forças Armadas" : found.militaryForce === "Civil" ? "Polícia Civil / Servente" : "Apoiador Voluntário",
        city: found.city,
        registrationID: found.rgMilitar || "N/A",
        sessionID: `SES-${Math.floor(Math.random() * 9000000 + 1000000)}`,
        approved: validatedApproved,
        paused: found.paused ?? false,
        archived: found.archived ?? false,
        securityHash: found.securityHash,
        rawCpf: found.cpf,
        rawForce: found.militaryForce,
        rawChurch: found.church,
        rawPhone: found.phone,
        rawEmail: found.email,
        rawBirthDate: found.birthDate,
        password: found.password,
        photoUrl: found.photoUrl || ""
      };

      setLoggedInUser(authenticatedUser);
      setIsLoggedIn(true);
      sessionStorage.setItem("umesc_active_session", JSON.stringify(authenticatedUser));

      if (validatedApproved === false || found.paused || found.archived) {
        setActiveTab("profile");
      } else {
        setActiveTab("notices");
      }
    } catch (err) {
      console.error("Erro ao autenticar usuário:", err);
      setLoginError("Houve uma falha ao se comunicar com o banco de dados.");
    }
  };

  // Profile Update handler
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !loggedInUser.securityHash) {
      setProfileErrorMsg("Sessão inválida ou expirada.");
      return;
    }

    // Input validations
    const cleanEmail = sanitizeInput(profileEmail, 100);
    const cleanPhone = sanitizeInput(profilePhone, 15);

    if (!isValidEmail(cleanEmail)) {
      setProfileErrorMsg("Por favor, informe um endereço de e-mail corporativo ou seguro válido.");
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setProfileErrorMsg("Por favor, informe um número de WhatsApp válido com DDD (10 ou 11 dígitos).");
      return;
    }

    const cleanPassword = sanitizeInput(profilePassword, 30);
    if (cleanPassword.length < 6) {
      setProfileErrorMsg("A senha de acesso deve possuir ao menos 6 caracteres.");
      return;
    }

    setProfileErrorMsg("");
    setProfileSuccessMsg(false);

    try {
      // Complete sanitization of remaining fields to avoid script injection or overlength values
      const cleanName = sanitizeInput(profileName, 100);
      const cleanBirthDate = sanitizeInput(profileBirthDate, 20);
      const cleanRank = sanitizeInput(profileRank, 50);
      const cleanRgMilitar = sanitizeInput(profileRgMilitar, 50);
      const cleanChurch = sanitizeInput(profileChurch, 150);
      const cleanCity = sanitizeInput(profileCity, 50);

      const updatedFields: Partial<MemberRegistration> = {
        name: cleanName,
        birthDate: cleanBirthDate,
        militaryForce: profileForce,
        rank: cleanRank,
        rgMilitar: cleanRgMilitar,
        church: cleanChurch,
        phone: cleanPhone,
        email: cleanEmail,
        city: cleanCity,
        password: cleanPassword,
        photoUrl: profilePhotoUrl
      };

      const success = await membersService.updateMember(loggedInUser.securityHash, updatedFields);
      if (success) {
        setProfileSuccessMsg(true);
        // Update local session
        const nextUserSession = {
          ...loggedInUser,
          name: cleanName,
          rank: cleanRank,
          force: profileForce === "PM" ? "Polícia Militar SC" : profileForce === "BM" ? "Bombeiro Militar SC" : profileForce === "FFAA" ? "Forças Armadas" : profileForce === "Civil" ? "Polícia Civil / Servente" : "Apoiador Voluntário",
          city: cleanCity,
          registrationID: cleanRgMilitar || "N/A",
          rawBirthDate: cleanBirthDate,
          rawForce: profileForce,
          rawChurch: cleanChurch,
          rawPhone: cleanPhone,
          rawEmail: cleanEmail,
          password: cleanPassword,
          photoUrl: profilePhotoUrl
        };
        setLoggedInUser(nextUserSession);
        sessionStorage.setItem("umesc_active_session", JSON.stringify(nextUserSession));
        
        // Refresh members list
        try {
          const list = await membersService.getMembers();
          setMembersList(list);
        } catch (_) {}

        // Notify other windows/panels in real-time (e.g. Administrative Portal)
        window.dispatchEvent(new CustomEvent("umesc_content_updated"));

        setTimeout(() => {
          setProfileSuccessMsg(false);
        }, 5010);
      } else {
        setProfileErrorMsg("Não foi possível salvar suas correções cadastrais.");
      }
    } catch (err) {
      console.error("Erro ao atualizar dados cadastrais:", err);
      setProfileErrorMsg("Falha técnica de comunicação ao salvar os dados.");
    }
  };

  // First Access submits
  const handleFirstAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstAccessError("");

    const cleanEmail = sanitizeInput(firstAccessEmail, 100);
    const cleanCpf = sanitizeInput(firstAccessCpf, 11);
    const cleanPass = sanitizeInput(firstAccessPass, 30);
    const cleanPassConfirm = sanitizeInput(firstAccessPassConfirm, 30);

    if (!isValidEmail(cleanEmail)) {
      setFirstAccessError("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    if (!isValidCPF(cleanCpf)) {
      setFirstAccessError("O CPF informado é inválido. Por favor, verifique.");
      return;
    }

    if (cleanPass !== cleanPassConfirm) {
      setFirstAccessError("As senhas inseridas não correspondem. Por favor, verifique.");
      return;
    }
    if (cleanPass.length < 6) {
      setFirstAccessError("A nova senha de acesso deve possuir ao menos 6 caracteres.");
      return;
    }

    try {
      const success = await membersService.updatePassword(cleanEmail, cleanCpf, cleanPass);
      if (!success) {
        setFirstAccessError("Dados cadastrais do associado não foram encontrados! Verifique seu e-mail e CPF cadastrados.");
        return;
      }

      setFirstAccessSuccess(true);
      setTimeout(() => {
        setFirstAccessSuccess(false);
        setLoginMode("standard");
        setAuthEmail(cleanEmail);
        setAuthPassword("");
      }, 3500);
    } catch (err) {
      console.error("Erro no primeiro acesso:", err);
      setFirstAccessError("Houve um problema de conexão ao configurar sua senha.");
    }
  };

  // Forgot password redefinition submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    const cleanEmail = sanitizeInput(forgotEmail, 100);
    const cleanCpf = sanitizeInput(forgotCpf, 11);
    const cleanNewPass = sanitizeInput(forgotNewPass, 30);
    const cleanNewPassConfirm = sanitizeInput(forgotNewPassConfirm, 30);

    if (!isValidEmail(cleanEmail)) {
      setForgotError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    if (!isValidCPF(cleanCpf)) {
      setForgotError("O CPF informado é inválido. Por favor, verifique.");
      return;
    }

    if (cleanNewPass !== cleanNewPassConfirm) {
      setForgotError("As senhas informadas não coincidem. Digite novamente.");
      return;
    }
    if (cleanNewPass.length < 6) {
      setForgotError("A nova senha de acesso deve possuir ao menos 6 caracteres.");
      return;
    }

    try {
      const success = await membersService.updatePassword(cleanEmail, cleanCpf, cleanNewPass);
      if (!success) {
        setForgotError("Redefinição inválida: E-mail e CPF fornecidos não coincidem com nenhum associado homologado.");
        return;
      }

      setForgotSuccess(true);
      setTimeout(() => {
        setForgotSuccess(false);
        setLoginMode("standard");
        setAuthEmail(cleanEmail);
        setAuthPassword("");
      }, 3500);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setForgotError("Não foi possível processar a alteração de senha.");
    }
  };

  // Demonstration rapid bypass (GUEST ACCESS)
  const handleDemoAccess = () => {
    alert("Para fins pedagógicos, preenchemos o login do associado homologado militar de Santa Catarina:\nE-mail: everton.costa@pm.sc.gov.br\nSenha padrão: umesc123\n\nClique em 'Autenticar Assinatura' para fazer logon!");
    setAuthEmail("everton.costa@pm.sc.gov.br");
    setAuthPassword("umesc123");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser(null);
    sessionStorage.removeItem("umesc_active_session");
  };

  const handleSelfErasure = async () => {
    if (!loggedInUser || !loggedInUser.securityHash) return;
    setUserDeletionError("");
    setIsDeletingUser(true);
    
    try {
      const ok = await membersService.deleteMember(loggedInUser.securityHash);
      if (ok) {
        // Dispatch event for other views or tools to synchronize
        try {
          const customEvent = new Event("umesc_content_updated");
          window.dispatchEvent(customEvent);
        } catch (_) {}
        
        // Log out immediately
        handleLogout();
        setIsDeletingUser(false);
        // Clear self deletion confirmation state
        setDeleteSafetyChecked(false);
        setDeleteInputConfirmation("");
        
        alert("Sua conta foi completamente excluída e todos os seus dados foram definitivamente purgados de nossa base institucional sob os termos do Direito ao Esquecimento da LGPD. Que Deus o abençoe!");
      } else {
        setUserDeletionError("Não foi possível excluir sua conta. Verifique sua conexão com o servidor ou tente mais tarde.");
        setIsDeletingUser(false);
      }
    } catch (err) {
      console.error("Erro ao deletar auto cadastro:", err);
      setUserDeletionError("Erro de comunicação ao processar a exclusão permanente de seus dados.");
      setIsDeletingUser(false);
    }
  };

  // Create new register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg("");
    setSuccessMessage(false);
    if (!lgpdConsent) {
      setRegErrorMsg("Por favor, declare consentimento com a política LGPD de proteção de dados para continuar.");
      return;
    }

    if (regPassword.length < 6) {
      setRegErrorMsg("A senha de acesso criada deve possuir ao menos 6 caracteres.");
      return;
    }

    const compiledHash = generateSha256Sim(nome + cpf);
    const maskedCpfValue = formatMaskedCpf(cpf);

    const newMember: MemberRegistration = {
      name: nome,
      cpf: maskedCpfValue,
      birthDate,
      militaryForce,
      rank,
      rgMilitar: rgMilitar || "N/A",
      church,
      phone,
      email,
      city,
      lgpdConsent,
      marketingConsent,
      registrationDate: new Date().toISOString().split('T')[0],
      securityHash: compiledHash,
      password: regPassword
    };

    try {
      await membersService.createMember(newMember);
      const list = await membersService.getMembers();
      setMembersList(list);
      setSuccessMessage(true);

      // Reset Form fields (Only on success!)
      setNome("");
      setCpf("");
      setBirthDate("");
      setRank("");
      setRgMilitar("");
      setChurch("");
      setPhone("");
      setEmail("");
      setCity("");
      setRegPassword("");
      setLgpdConsent(false);
      setMarketingConsent(false);

      setTimeout(() => {
        setSuccessMessage(false);
      }, 5000);
    } catch (error: any) {
      console.error("Erro ao registrar membro:", error);
      const errorMsg = error?.message || "Houve uma falha ao cadastrar o membro no banco de dados.";
      setRegErrorMsg(errorMsg);
    }
  };

  // Erase register (LGPD complies)
  const handleDeleteMyData = async (indexToDelete: number, memberName: string, memberHash: string) => {
    const confirmation = window.confirm(`[Direito de Exclusão LGPD] Você confirma a revogação de consentimento e a deleção irreversível e absoluta de todos os dados salvos de: ${memberName}?`);
    if (confirmation) {
      try {
        await membersService.deleteMember(memberHash);
        const list = await membersService.getMembers();
        setMembersList(list);
        alert(`Todos os registros do associado(a) ${memberName} foram permanentemente apagados de acordo com a LGPD.`);
      } catch (error) {
        console.error("Erro ao deletar registro:", error);
        alert("Não foi possível excluir o associado do banco de dados.");
      }
    }
  };

  // Simulate downloads of fiscal sheets
  const handleSimulateDownload = (docId: string, docTitle: string) => {
    setDocuments((prevDocs) => {
      const updated = prevDocs.map((doc) =>
        doc.id === docId ? { ...doc, downloadCount: doc.downloadCount + 1 } : doc
      );
      localStorage.setItem("umesc_documents", JSON.stringify(updated));
      window.dispatchEvent(new Event("umesc_content_updated"));
      return updated;
    });
    setDownloadedDocId(docId);
    setTimeout(() => setDownloadedDocId(null), 3500);
  };

  const getFilteredEvents = () => {
    if (activeEventFilter === "TODOS") return INITIAL_EVENTS;
    return INITIAL_EVENTS.filter((ev) => ev.type === activeEventFilter);
  };

  const getFilteredCoordinators = () => {
    if (selectedRegionFilter === "TODOS") return coordenadores;
    return coordenadores.filter((co) => (co.region || "").toLowerCase().includes(selectedRegionFilter.split(" ")[0].toLowerCase()) || co.region === selectedRegionFilter);
  };

  return (
    <div className="bg-[#0b1329] min-h-screen text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Intranet Header Style Banner */}
      <div className="bg-gradient-to-r from-red-850 via-[#13233a] to-emerald-900 border-b border-white/10 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center font-black text-slate-900 shadow-sm">
            †
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white font-display">
              UMESC <span className="text-amber-400">Portal do Fardado</span>
            </h2>
            <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest leading-none">
              Sede Administrativa Catarinense • Redes Integradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-400 font-mono font-bold leading-normal">
            INTRANET MILITAR CRIPTOGRAFADA
          </span>
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer uppercase tracking-wider"
          >
            ← Retornar ao Início
          </button>
        </div>
      </div>

      {/* 1. PUBLIC GUEST VOLUNTEERING PAGE OR LOGIN SCREEN CARD (GATE) */}
      {!isLoggedIn ? (
        activeTab === "voluntariado" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_center,#15223c,transparent_75%)] relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            
            <div className="w-full max-w-xl space-y-6 z-10 animate-fadeIn">
              <div className="flex justify-between items-center bg-[#131f2e] border border-white/5 px-5 py-3.5 rounded-xl text-xs">
                <button 
                  onClick={onBackToHome}
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-bold bg-transparent border-none"
                >
                  ← Retornar ao Início
                </button>
                <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider text-amber-500">
                  Inscrição Exclusiva de Voluntários
                </div>
                <button 
                  onClick={() => {
                    setActiveTab("notices");
                    setLoginMode("standard");
                  }}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded font-bold cursor-pointer transition-colors"
                >
                  Login de Associado
                </button>
              </div>

              <CapelaniaVolunteeringForm loggedInUser={null} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 py-16 bg-[radial-gradient(circle_at_center,#15223c,transparent_75%)] relative">
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          {loginMode === "standard" && (
            <div className="w-full max-w-md bg-[#131f2e] border-t-4 border-amber-500 border-x border-b border-white/5 rounded-xl shadow-2xl relative overflow-hidden flex flex-col">
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-emerald-600 to-red-650"></div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMode("standard")}
                  className="flex-1 py-3 text-center font-black uppercase tracking-wider bg-white/[0.02] text-amber-400 border-b-2 border-amber-500"
                >
                  Logon Padrão
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("first-access");
                    setFirstAccessSuccess(false);
                  }}
                  className="flex-1 py-3 text-center font-black uppercase tracking-wider text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/10 transition-colors"
                >
                  Primeiro Acesso 🟢
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded bg-[#1c2c41] border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight font-display uppercase">Validação de Credencial</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                    Insira abaixo seu ID de farda ou e-mail de correspondência homologado pela UMESC.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded bg-red-950/50 border border-red-550/30 text-rose-350 text-xs flex items-start gap-2.5 leading-normal">
                    <AlertCircle className="w-4 h-4 text-red-450 mt-0.5 shrink-0" />
                    <div className="text-left">
                      <strong className="block text-red-400 mb-0.5 uppercase tracking-wide font-bold">Erro de Login:</strong>
                      <span className="text-slate-200">{loginError}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider mb-1">ID Militar ou E-mail:</label>
                    <input 
                      type="text"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Ex: 923412-0 (Reg PMSC) ou silva@gov.br"
                      required
                      className="w-full bg-[#0e1622] text-xs border border-white/10 rounded px-3.5 py-2.5 text-white outline-none focus:border-amber-500 tracking-wide transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider mb-1">Senha de Acesso Intranet:</label>
                    <input 
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[#0e1622] text-xs border border-white/10 rounded px-3.5 py-2.5 text-white outline-none focus:border-amber-500 tracking-wide transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded bg-[#0d1621] border border-white/5 text-[10px] text-slate-400 leading-normal">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Portal adequado à <strong>LGPD de Santa Catarina</strong>. Tentativas de logon inválidas serão logadas.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 pt-1">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#1e3454] hover:bg-[#254068] text-white border border-white/10 font-black uppercase tracking-wider rounded text-xs transition-colors cursor-pointer"
                    >
                      Autenticar Assinatura
                    </button>
                  </div>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("forgot-password");
                      setForgotSuccess(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-mono font-bold"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Esqueci minha senha ou preciso redefinir
                  </button>
                </div>

                {onEnterAdminMode && (
                  <div className="text-center pt-4 border-t border-white/5 space-y-2">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Acesso de Diretoria</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Diretores e Administradores com credencial homologada da UMESC:
                    </p>
                    <button
                      type="button"
                      onClick={onEnterAdminMode}
                      className="w-full py-2.5 bg-amber-550/10 hover:bg-amber-500 hover:text-[#070c18] text-amber-400 border border-amber-500/30 font-black uppercase tracking-widest rounded text-[10px] transition-all cursor-pointer"
                    >
                      Ir para Portal Administrativo 🔒
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {loginMode === "first-access" && (
            <div className="w-full max-w-md bg-[#091a18] border-t-4 border-emerald-500 border-x border-b border-emerald-500/20 rounded-xl shadow-2xl relative overflow-hidden flex flex-col">
              {/* Green/Emerald Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"></div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setLoginMode("standard")}
                  className="flex-1 py-3 text-center font-black uppercase tracking-wider text-slate-400 hover:text-amber-300 hover:bg-white/[0.02] transition-colors"
                >
                  Logon Padrão
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode("first-access")}
                  className="flex-1 py-3 text-center font-black uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border-b-2 border-emerald-500"
                >
                  Primeiro Acesso 🟢
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded bg-[#0d2a25] border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                    <UserPlus className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight font-display uppercase">Ativar Primeiro Acesso</h3>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                    Se você já se cadastrou ou é um militar homologado, crie suas credenciais de acesso definitivo ao portal.
                  </p>
                </div>

                {firstAccessSuccess && (
                  <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1.5">
                    <p className="font-bold">✓ Credencial ativada com sucesso!</p>
                    <p className="text-slate-300 leading-relaxed">
                      Seu primeiro acesso foi registrado em nosso banco de dados. Você será redirecionado para a tela de Logon Padrão.
                    </p>
                  </div>
                )}

                {!firstAccessSuccess && (
                  <form onSubmit={handleFirstAccessSubmit} className="space-y-4">
                    {firstAccessError && (
                      <div className="p-3.5 bg-red-950/50 border border-red-555/35 rounded text-xs text-rose-100 text-left">
                        <strong className="block text-red-400 mb-0.5 uppercase tracking-wide font-bold">Aviso de Erro Cadastral:</strong>
                        <p className="leading-normal">{firstAccessError}</p>
                      </div>
                    )}

                    <div className="p-3 bg-[#0c2420] border border-emerald-500/25 rounded text-[11px] text-slate-300 leading-relaxed text-left">
                      <strong className="text-emerald-400 font-extrabold block mb-0.5 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <span className="animate-pulse">●</span> NOTA DE INTEGRALIZAÇÃO AUTOMÁTICA
                      </strong>
                      Não se preocupe em já possuir cadastro prévio na UMESC! Forneça seu e-mail e CPF preferidos acima comercialmente. Se não existirem na farda homologada antiga, o portal criará seu novo registro básico imediatamente para que você possa corrigir os termos da ficha na área restrita.
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1">E-mail Cadastrado:</label>
                      <input 
                        type="email"
                        value={firstAccessEmail}
                        onChange={(e) => setFirstAccessEmail(e.target.value)}
                        placeholder="Ex: seu-nome@corporativo.com"
                        required
                        maxLength={100}
                        className="w-full bg-[#071311] text-xs border border-emerald-500/20 rounded px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 tracking-wide transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1">CPF (apenas números):</label>
                      <input 
                        type="text"
                        value={firstAccessCpf}
                        onChange={(e) => setFirstAccessCpf(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ex: 01234567890"
                        required
                        maxLength={11}
                        className="w-full bg-[#071311] text-xs border border-emerald-500/20 rounded px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 tracking-wide transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1">Nova Senha:</label>
                        <input 
                          type="password"
                          value={firstAccessPass}
                          onChange={(e) => setFirstAccessPass(e.target.value)}
                          placeholder="Mínimo 6 dígitos"
                          required
                          maxLength={30}
                          className="w-full bg-[#071311] text-xs border border-emerald-500/20 rounded px-2.5 py-2.5 text-white outline-none focus:border-emerald-500 tracking-wide transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1">Confirmar Senha:</label>
                        <input 
                          type="password"
                          value={firstAccessPassConfirm}
                          onChange={(e) => setFirstAccessPassConfirm(e.target.value)}
                          placeholder="Re-digite a senha"
                          required
                          maxLength={30}
                          className="w-full bg-[#071311] text-xs border border-emerald-500/20 rounded px-2.5 py-2.5 text-white outline-none focus:border-emerald-500 tracking-wide transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/10 text-[10px] text-emerald-300 leading-normal">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Seus dados serão vinculados ao registro único homologado para segurança de identidade estatutária.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded text-xs transition-colors cursor-pointer border border-emerald-500/30"
                    >
                      Registrar Nova Credencial
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setLoginMode("standard")}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    ← Cancelar e Voltar para Login Padrão
                  </button>
                </div>
              </div>
            </div>
          )}

          {loginMode === "forgot-password" && (
            <div className="w-full max-w-md bg-[#171120] border-t-4 border-indigo-501 border-x border-b border-indigo-500/20 rounded-xl shadow-2xl relative overflow-hidden flex flex-col">
              {/* Amethyst / Purple Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500"></div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded bg-[#241a30] border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight font-display uppercase">Recuperação de Acesso</h3>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                    Insira os dados do associado para designação e assinatura de nova senha de acesso administrativo.
                  </p>
                </div>

                {forgotSuccess && (
                  <div className="p-4 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs space-y-1.5">
                    <p className="font-bold">✓ Redefinição autorizada com sucesso!</p>
                    <p className="text-slate-300 leading-relaxed">
                      Sua nova senha foi atualizada e processada em nosso banco de dados. Você será redirecionado para a tela de Logon Padrão em instantes.
                    </p>
                  </div>
                )}

                {!forgotSuccess && (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    {forgotError && (
                      <div className="p-3.5 bg-red-950/50 border border-red-555/35 rounded text-xs text-rose-100 text-left">
                        <strong className="block text-red-400 mb-0.5 uppercase tracking-wide font-bold">Erro de Recuperação:</strong>
                        <p className="leading-normal">{forgotError}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">E-mail Cadastrado:</label>
                      <input 
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Ex: silva@corporativo.com"
                        required
                        className="w-full bg-[#0d0913] text-xs border border-indigo-500/20 rounded px-3.5 py-2.5 text-white outline-none focus:border-indigo-400 tracking-wide transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">CPF (apenas números):</label>
                      <input 
                        type="text"
                        value={forgotCpf}
                        onChange={(e) => setForgotCpf(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ex: 01234567890"
                        required
                        className="w-full bg-[#0d0913] text-xs border border-indigo-500/20 rounded px-3.5 py-2.5 text-white outline-none focus:border-indigo-400 tracking-wide transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">Nova Senha:</label>
                        <input 
                          type="password"
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          placeholder="Mínimo 6 dígitos"
                          required
                          className="w-full bg-[#0d0913] text-xs border border-indigo-500/20 rounded px-2.5 py-2.5 text-white outline-none focus:border-indigo-400 tracking-wide transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">Re-digite a Senha:</label>
                        <input 
                          type="password"
                          value={forgotNewPassConfirm}
                          onChange={(e) => setForgotNewPassConfirm(e.target.value)}
                          placeholder="Confirmar nova senha"
                          required
                          className="w-full bg-[#0d0913] text-xs border border-indigo-500/20 rounded px-2.5 py-2.5 text-white outline-none focus:border-indigo-400 tracking-wide transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded bg-indigo-950/20 border border-indigo-500/10 text-[10px] text-indigo-300 leading-normal">
                      <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>
                        A alteração da assinatura criptográfica requer autentificação dos dados cadastrais com o banco e concordância LGPD.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded text-xs transition-colors cursor-pointer border border-indigo-500/30"
                    >
                      Processar Redefinição de Senha
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setLoginMode("standard")}
                    className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    ← Cancelar e Voltar para Logon
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>
        )
      ) : (
        /* 2. LOGGED IN DASHBOARD WORKSPACE */
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Dashboard Meta Row */}
          <div className="bg-[#131f2e] rounded-xl border border-white/5 p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded bg-[#1e2f44] border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shrink-0 uppercase tracking-widest text-lg font-display">
                {loggedInUser?.name.substring(0, 2)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-white text-base leading-tight font-display">{loggedInUser?.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-605/15 border border-emerald-500/35 text-[9px] text-emerald-400 uppercase font-mono font-bold leading-none">
                    SESSÃO ATIVA
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  <strong>Vínculo:</strong> {loggedInUser?.rank} • {loggedInUser?.force} • Sede {loggedInUser?.city}
                </p>
              </div>
            </div>

            {/* Quick Session Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto">
              <div>
                <span className="block text-[9px] text-slate-500 uppercase tracking-wide">ID de Sessão</span>
                <span className="text-emerald-500 font-bold">{loggedInUser?.sessionID}</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="block text-[9px] text-slate-500 uppercase tracking-wide">Amparo Criptográfico</span>
                <span className="text-amber-500 font-bold">AES-256 / SHA</span>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/35 text-red-400 border border-red-500/25 rounded transition-colors font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair do Painel
              </button>
            </div>
          </div>

          {loggedInUser && loggedInUser.approved !== false && !isSuspended && (
            <div className="mb-8 p-4 rounded-xl bg-[#0c2621] border border-emerald-500/25 text-slate-200 text-xs flex items-center gap-3.5 animate-fadeIn">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">
                ✓
              </span>
              <div>
                <strong className="block uppercase tracking-wider font-extrabold text-emerald-400 text-[10px] mb-0.5">✓ CADASTRO HOMOLOGADO PELA DIRETORIA GERAL</strong>
                Sua ficha cadastral de associado da UMESC foi revisada e homologada com sucesso! Todos os cadeados e restrições foram suspensos em definitivo. Você possui livre acesso a todas as dependências internas do portal de membros.
              </div>
            </div>
          )}

          {loggedInUser && isSuspended && (
            <div className="mb-8 p-4 rounded-xl bg-orange-950/85 border border-orange-500/40 text-slate-200 text-xs flex items-center gap-3.5 animate-fadeIn shadow-lg">
              <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-black shrink-0 animate-pulse text-sm">
                ⚠️
              </span>
              <div>
                <strong className="block uppercase tracking-wider font-extrabold text-orange-400 text-[10px] mb-0.5">⚠️ CADASTRO SUSPENSO/PAUSADO PELA DIRETORIA GERAL</strong>
                Atenção: A atividade do seu cadastro foi temporariamente **suspensa/pausada** para verificação administrativa. Sua licença de acesso a informativos, cultos e dependências virtuais internas está inativa. É obrigatório que você entre em contato com a diretoria da UMESC para proceder com a verificação de dados e liberar novamente o seu acesso.
              </div>
            </div>
          )}

          {/* Main Workspace Split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Interactive Menu Navigation Bar (5 spans) */}
            <div className="lg:col-span-3 space-y-2 lg:sticky lg:top-24">
              <button
                onClick={() => {
                  if (isRestrictedAccess) {
                    if (isSuspended) {
                      alert("Acesso Suspenso: Seu cadastro está pausado pela administração da UMESC. Por favor, entre em contato com a diretoria para verificação de dados e liberação de acesso.");
                    } else {
                      alert("Acesso Limitado: Seu cadastro ainda não foi homologado pela Diretoria Geral da UMESC. Por favor, retifique seus dados cadastrais na seção 'Meu Cadastro'.");
                    }
                    return;
                  }
                  setActiveTab("notices");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  isRestrictedAccess ? "opacity-50 cursor-not-allowed bg-[#0d141e]/50 border-white/5" : ""
                } ${
                  activeTab === "notices"
                    ? "bg-amber-500 text-[#0b1329] font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
                disabled={isRestrictedAccess}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="block text-sm flex items-center gap-1">
                      Quadro de Avisos {isRestrictedAccess && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Informativos & Downloads</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>



              <button
                onClick={() => {
                  if (isRestrictedAccess) {
                    if (isSuspended) {
                      alert("Acesso Suspenso: Seu cadastro está pausado pela administração da UMESC. Por favor, entre em contato com a diretoria para verificação de dados e liberação de acesso.");
                    } else {
                      alert("Acesso Limitado: Seu cadastro ainda não foi homologado pela Diretoria Geral da UMESC. Por favor, retifique seus dados cadastrais na seção 'Meu Cadastro'.");
                    }
                    return;
                  }
                  setActiveTab("leitura");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  isRestrictedAccess ? "opacity-50 cursor-not-allowed bg-[#0d141e]/50 border-white/5" : ""
                } ${
                  activeTab === "leitura"
                    ? "bg-amber-500 text-[#0b1329] font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
                disabled={isRestrictedAccess}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="block text-sm flex items-center gap-1">
                      Leitura Bíblica {isRestrictedAccess && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Plano Anual & Metas Diárias</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isRestrictedAccess) {
                    if (isSuspended) {
                      alert("Acesso Suspenso: Seu cadastro está pausado pela administração da UMESC. Por favor, entre em contato com a diretoria para verificação de dados e liberação de acesso.");
                    } else {
                      alert("Acesso Limitado: Seu cadastro ainda não foi homologado pela Diretoria Geral da UMESC. Por favor, retifique seus dados cadastrais na seção 'Meu Cadastro'.");
                    }
                    return;
                  }
                  setActiveTab("congressos");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  isRestrictedAccess ? "opacity-50 cursor-not-allowed bg-[#0d141e]/50 border-white/5" : ""
                } ${
                  activeTab === "congressos"
                    ? "bg-amber-500 text-[#0b1329] font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
                disabled={isRestrictedAccess}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="block text-sm flex items-center gap-1">
                      Congressos & Inscrições {isRestrictedAccess && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Inscrições, Oficinas e QR Ticket</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isRestrictedAccess) {
                    if (isSuspended) {
                      alert("Acesso Suspenso: Seu cadastro está pausado pela administração da UMESC. Por favor, entre em contato com a diretoria para verificação de dados e liberação de acesso.");
                    } else {
                      alert("Acesso Limitado: Seu cadastro ainda não foi homologado pela Diretoria Geral da UMESC. Por favor, retifique seus dados cadastrais na seção 'Meu Cadastro'.");
                    }
                    return;
                  }
                  setActiveTab("structure");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  isRestrictedAccess ? "opacity-50 cursor-not-allowed bg-[#0d141e]/50 border-white/5" : ""
                } ${
                  activeTab === "structure"
                    ? "bg-amber-500 text-[#0b1329] font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
                disabled={isRestrictedAccess}
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="block text-sm flex items-center gap-1">
                      Estrutura & Legislação {isRestrictedAccess && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Governança & Coordenadores</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("voluntariado");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  activeTab === "voluntariado"
                    ? "bg-amber-500 text-[#0b1329] font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 shrink-0 text-amber-500 animate-pulse" />
                  <div>
                    <span className="block text-sm flex items-center gap-1">
                      Voluntariado Capelania
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85 text-slate-350">Inscrição de Voluntários</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("registration");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  activeTab === "registration"
                    ? "bg-rose-600 text-white font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 shrink-0 text-rose-455" />
                  <div>
                    <span className="block text-sm">
                      Exclusão de Cadastro
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85 text-rose-300 font-bold leading-tight">Direito ao Esquecimento (LGPD)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  activeTab === "profile"
                    ? "bg-[#10b981] bg-emerald-600 text-white font-black border-transparent shadow"
                    : "bg-[#131f2e] text-slate-100 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div>
                    <span className="block text-sm flex items-center gap-1.5">
                      Meu Cadastro {loggedInUser?.approved === false && <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase">Pendente</span>}
                      {isSuspended && <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase">Pausado</span>}
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Retificar & Atualizar Ficha</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("filiacao");
                }}
                className={`w-full flex items-center justify-between p-4 rounded text-left border transition-all ${
                  activeTab === "filiacao"
                    ? "bg-amber-500 text-slate-950 font-black border-transparent shadow shadow-amber-500/10"
                    : "bg-[#131f2e] text-slate-105 hover:text-white border-white/5 hover:bg-[#1a2a40]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 shrink-0 text-amber-500" />
                  <div>
                    <span className="block text-sm">
                      Ficha de Filiação
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85 text-amber-400">Assinatura Digital de Desconto</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Discrete link to access Terms of Use & Privacy Policy */}
              <button
                type="button"
                onClick={() => setShowTermsModalOnly(true)}
                className="w-full flex items-center justify-between p-3.5 rounded text-left border border-white/5 hover:border-teal-500/30 bg-[#131f2e] hover:bg-[#15273b] text-slate-300 hover:text-white transition-all cursor-pointer mt-2"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 shrink-0 text-teal-400" />
                  <div>
                    <span className="block text-sm">
                      Termos de Uso & LGPD
                    </span>
                    <span className="block text-[9px] font-normal uppercase tracking-wider opacity-85">Consultar Diretos & Deveres</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Informative Security Banner */}
              <div className="p-4 rounded-lg bg-[#111c2a] border border-emerald-500/20 text-emerald-400 space-y-1 mt-4">
                <span className="font-extrabold text-[10px] tracking-wider block uppercase">Status da Conexão</span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                  Toda a troca de dados cadastrais ocorre sob criptografia ponta a ponta com certificados digitais. Suas sessões expiram em 30 minutos por imperativos de segurança organizacional.
                </p>
              </div>
            </div>

            {/* Right: Dashboard Active Tab Panel Container (9 spans) */}
            <div className="lg:col-span-9 bg-[#111c2a] rounded-xl border border-white/5 p-6 sm:p-8 space-y-6">
              
              {/* TAB 1: NOTICES & DOWNLOADS */}
              {activeTab === "notices" && (
                <div id="tab-dashboard-notices" className="space-y-8">
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display uppercase">
                      <Bell className="w-5 h-5 text-amber-500" />
                      Mural Oficial de Transparência & Avisos
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Circulares internas, frentes administrativas de farda, e decretos oficiais</p>
                  </div>

                  {/* Notices list flow */}
                  <div className="space-y-4">
                    {announcements.map((ann) => (
                      <div 
                        key={ann.id}
                        className={`p-4 rounded border transition-all ${
                          ann.isImportant
                            ? "bg-red-950/20 border-red-500/40"
                            : "bg-[#132031] border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            ann.isImportant ? "bg-red-700 text-white animate-pulse" : "bg-[#1d2f46] text-amber-400 border border-white/10"
                          }`}>
                            {ann.isImportant ? "Urgente" : ann.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {new Date(ann.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 font-display">{ann.title}</h4>
                        <p className="text-xs text-slate-350 leading-relaxed mt-1 font-semibold">{ann.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Central de Downloads inside the restricted dashboard as requested */}
                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2 font-display uppercase">
                        <FileCheck className="w-5 h-5 text-emerald-500" />
                        Repositório de Ficheiros e Auditoria Fiscal
                      </h4>
                      <p className="text-[11px] text-slate-400">Certificados estatutários de utilidade pública legal, relatórios contábeis de de doação e apostilas.</p>
                    </div>

                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-4 rounded bg-[#132031] border border-white/5 hover:border-amber-500/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                        >
                          <div>
                            <span className="inline-block text-[8px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 border border-white/10 rounded uppercase font-mono tracking-widest mb-1 shadow-sm">
                              {doc.category}
                            </span>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-200 font-display">{doc.title}</h5>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>Tamanho: {doc.fileSize}</span>
                              <span>•</span>
                              <span>Baixado: <strong>{doc.downloadCount} vezes</strong></span>
                            </div>
                          </div>

                          {(() => {
                            const isDrive = doc.url && (doc.url.includes("drive.google.com") || doc.url.includes("docs.google.com"));
                            const isLink = doc.url && (doc.url.startsWith("http://") || doc.url.startsWith("https://") || isDrive);
                            const downloadHref = isLink
                              ? doc.url
                              : `data:text/plain;charset=utf-8,${encodeURIComponent(`DOCUMENTO OFICIAL DA AGENCIA MISSIONARIA UMESC (SC)\n=========================================\n\nTitulo do Documento: ${doc.title}\nCategoria: ${doc.category}\nData de Publicacao: ${doc.publishedDate}\n\n[SIMULACAO] Este arquivo representa o download oficial direto do seletor da UMESC de Santa Catarina. Todo o processamento e download e auditado sob a LGPD brasileira.`)}`;

                            return (
                              <a
                                href={downloadHref}
                                download={isLink ? undefined : `${doc.url}`}
                                target={isLink ? "_blank" : undefined}
                                rel={isLink ? "noopener noreferrer" : undefined}
                                onClick={() => handleSimulateDownload(doc.id, doc.title)}
                                className={`px-3.5 py-2.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-95 transition-all text-center cursor-pointer ${
                                  downloadedDocId === doc.id
                                    ? "bg-emerald-600 text-white"
                                    : "bg-amber-500 text-slate-900 hover:bg-amber-400"
                                }`}
                              >
                                {downloadedDocId === doc.id ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Pronto</span>
                                  </>
                                ) : (
                                  <>
                                    {isDrive ? (
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isDrive ? "Visualizar no Drive" : isLink ? "Visualizar Arquivo" : "Baixar Ficheiro"}</span>
                                  </>
                                )}
                              </a>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: STRUCTURE & LEGISLATION */}
              {activeTab === "structure" && (
                <div id="tab-dashboard-structure" className="space-y-8">
                  
                  {/* Executive Directorate */}
                  <div>
                    <div className="border-b border-white/10 pb-4 mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display uppercase">
                        <Users className="w-5 h-5 text-amber-500" />
                        Diretoria Executiva e Gestão Estatutária
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">BIÊNIO 2025/2026</p>
                    </div>

                    <div className="space-y-3">
                      {board.map((director, index) => (
                        <div 
                          key={director.id || index}
                          className="p-4 rounded bg-[#132031] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                        >
                          <div>
                            <span className="block text-amber-400 text-[10px] font-bold tracking-wider uppercase">{director.role}</span>
                            <span className="block font-bold text-slate-100 text-sm mt-0.5 font-display">{director.name}</span>
                          </div>
                          {director.church && (
                            <span className="text-[10px] text-slate-300 bg-[#0e1723] border border-white/10 px-3 py-1 rounded font-bold uppercase tracking-wider">
                              {director.church}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legislation Panel */}
                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5 uppercase font-display">
                        <Scale className="w-4 h-4 text-emerald-500" />
                        Código Normativo e Amparo Legal
                      </h4>
                      <p className="text-[11px] text-slate-400">Leis nacionais que sustentam e chancelam a capelania espiritual nas forças militares de SC</p>
                    </div>

                    <div className="space-y-3 text-xs text-slate-300">
                      {CORE_GOVERNANCE.legislation.map((leg, idx) => (
                        <div key={idx} className="p-4 rounded bg-[#132031] border border-white/5 space-y-1.5">
                          <h5 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5 font-display">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            {leg.title}
                          </h5>
                          <p className="text-xs text-slate-350 leading-relaxed font-semibold pl-3">{leg.description}</p>
                          <span className="block text-[9px] font-mono font-bold text-amber-400 pl-3 uppercase">
                            Base: {leg.lawReference}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coordinators filter and list */}
                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5 uppercase font-display">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          Coordenadorias Regionais de SC
                        </h4>
                        <p className="text-[11px] text-slate-400">Pontos de comunicação e socorro espiritual militar espalhados em SC</p>
                      </div>

                      {/* Region switcher select drop-down */}
                      <select
                        value={selectedRegionFilter}
                        onChange={(e) => setSelectedRegionFilter(e.target.value)}
                        className="bg-[#142337] text-slate-200 text-xs border border-white/10 rounded px-2.5 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {regionsList.map((reg) => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Coordinators Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getFilteredCoordinators().map((co, index) => (
                        <div 
                          key={index}
                          className="p-4 rounded bg-[#132031] border border-white/5 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            {co.avatar ? (
                              <img 
                                src={getCleanImageUrl(co.avatar)} 
                                alt={co.name}
                                className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-bold uppercase text-sm shrink-0">
                                {co.name ? co.name.charAt(0) : "C"}
                              </div>
                            )}
                            <div>
                              <span className="block text-[9px] font-bold text-amber-400 uppercase tracking-widest leading-none mb-1">{co.rank}</span>
                              <h5 className="font-bold text-slate-105 text-sm leading-tight text-white font-display">{co.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-1">{co.role}</p>
                              <span className="inline-block mt-1 text-[10px] font-mono font-bold text-slate-350 bg-[#0b1320] px-1.5 py-0.5 rounded leading-normal border border-white/5">
                                📞 {co.contact}
                              </span>
                            </div>
                          </div>

                          <a
                            href={getWhatsAppLink(co.contact)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: MEMBER SELF-DELETION (LGPD COMPLIANCE) */}
              {activeTab === "registration" && (
                <div id="tab-dashboard-registration" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fadeIn">
                  
                  {/* Left Column: Logged-in User's own File info ONLY - No other users' files! */}
                  <div className="xl:col-span-6 bg-[#132031] rounded-xl border border-white/5 p-4 sm:p-6 space-y-5 text-left">
                    <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-amber-400 font-display uppercase tracking-wider flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          Ficha de Registro Cadastral Ativa
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Dados armazenados sob proteção jurídica da LGPD</p>
                      </div>
                      <span className="text-[8px] font-mono border px-1.5 py-0.5 rounded font-bold bg-emerald-950/40 border-emerald-500/30 text-emerald-400 uppercase">
                        ● Cópia Única
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="p-3.5 bg-[#0b1320] border border-white/5 rounded">
                        <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Associado Titular</span>
                        <span className="text-white font-extrabold text-sm block font-display leading-tight">{loggedInUser?.name}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Identificador (CPF)</span>
                          <span className="text-slate-200 font-mono text-xs font-semibold">{loggedInUser?.rawCpf || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Contato WhatsApp</span>
                          <span className="text-slate-200 text-xs font-semibold">{loggedInUser?.rawPhone || "N/A"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider font-semibold">Força de Vinculação</span>
                          <span className="text-slate-200 text-xs font-semibold block">{loggedInUser?.force || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider font-semibold">Patente / Graduação</span>
                          <span className="text-slate-200 text-xs font-semibold block">{loggedInUser?.rank || "N/A"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider font-semibold">Cidade Sede (SC)</span>
                          <span className="text-slate-200 text-xs font-semibold block">{loggedInUser?.city || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                          <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider font-semibold">RG / Registro Militar</span>
                          <span className="text-slate-200 font-bold text-xs block">{loggedInUser?.registrationID || "N/A"}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                        <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider font-semibold">Igreja de Comunhão</span>
                        <span className="text-slate-200 text-xs font-semibold block">{loggedInUser?.rawChurch || "N/A"}</span>
                      </div>

                      <div className="p-3 bg-[#0b1320] border border-white/5 rounded">
                        <span className="block text-[9px] uppercase font-bold text-slate-455 tracking-wider font-semibold">E-mail Cadastrado</span>
                        <span className="text-slate-200 text-xs font-semibold block">{loggedInUser?.rawEmail || "N/A"}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-[10px] font-mono text-slate-450 border-t border-white/5">
                        <span>Assinatura Digital de Integridade: <span className="text-emerald-500">{loggedInUser?.securityHash.substring(0, 16)}...</span></span>
                        
                        <a 
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`FICHA CADASTRAL OFICIAL DE ASSOCIADO - DIREITO DE PORTABILIDADE LGPD\n=================================================================\nNome Completo: ${loggedInUser?.name}\nCPF: ${loggedInUser?.rawCpf}\nForça Militar/Vínculo: ${loggedInUser?.force}\nPosto/Graduação: ${loggedInUser?.rank}\nSede Operacional: ${loggedInUser?.city}\nIgreja Filiada: ${loggedInUser?.rawChurch}\nContato Principal: ${loggedInUser?.rawPhone}\nAssinatura Eletrônica de Integridade: ${loggedInUser?.securityHash}`)}`}
                          download={`portabilidade_lgpd_${loggedInUser?.name.replace(/ /g, "_").toLowerCase()}.txt`}
                          className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-sans font-black text-[9px] uppercase transition-colors shrink-0"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Portabilidade de Dados
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Safe Deletion request (Solicitação de Exclusão e Expurgamento Cadastral) */}
                  <div className="xl:col-span-6 space-y-4 text-left">
                    
                    <div className="p-5 bg-gradient-to-br from-[#121622] to-[#161c2c] border border-rose-500/15 rounded-xl space-y-4">
                      
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                          <Trash2 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white uppercase tracking-wider font-display">
                            Direito ao Esquecimento LGPD
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Cumprimento estrito do Art. 18, inciso VI da Lei 13.709/18</p>
                        </div>
                      </div>

                      <div className="text-slate-300 text-xs leading-relaxed space-y-2.5">
                        <p>
                          Como associativo da UMESC, você possui a prerrogativa constitucional de revogar seu termo voluntário e requerer a exclusão irreversível de sua identidade deste sistema simulado.
                        </p>
                        <p className="p-3 bg-red-950/20 border border-red-500/10 rounded text-[11px] text-rose-200 font-semibold flex gap-2.5">
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <span>
                            <strong>Atenção Absoluta:</strong> Ao confirmar o expurgo, suas permissões de acesso, sua senha de login, sua ficha histórica, e todo o vínculo associativo associado ao seu RG serão excluídos de forma perpétua.
                          </span>
                        </p>
                      </div>

                      {userDeletionError && (
                        <div className="p-3 rounded bg-red-950/40 border border-red-500/25 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{userDeletionError}</span>
                        </div>
                      )}

                      {/* SAFE CONFIRMATION MECHANICS */}
                      <div className="space-y-4 pt-3 border-t border-white/5">
                        
                        {/* 1. Safety Checkbox to understand consequences */}
                        <div className="p-3 bg-[#0a101b]/50 border border-white/5 rounded hover:border-rose-500/10 transition-colors">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={deleteSafetyChecked}
                              onChange={(e) => setDeleteSafetyChecked(e.target.checked)}
                              className="mt-0.5 accent-rose-600 cursor-pointer w-4 h-4 rounded shrink-0"
                            />
                            <span className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                              Confirmo sob fé de meu ofício que compreendo o teor desta ação irreversível e solicito voluntariamente a eliminação completa dos meus registros estatutários.
                            </span>
                          </label>
                        </div>

                        {/* 2. Text Confirmation to avoid accidental clicks */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                            Para desbloquear o botão de exclusão, digite exatamente <span className="text-rose-400 font-extrabold uppercase select-all">EXCLUIR</span> abaixo:
                          </label>
                          <input 
                            type="text"
                            value={deleteInputConfirmation}
                            onChange={(e) => setDeleteInputConfirmation(e.target.value)}
                            placeholder="Digite 'EXCLUIR' em maiúsculas"
                            className="w-full bg-[#0a101b] border border-white/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded px-3 py-2 text-xs font-mono text-rose-300 outline-none placeholder:text-slate-550"
                          />
                        </div>

                        {/* Deletion Button accompanied by double-confirmation rules */}
                        <button
                          onClick={handleSelfErasure}
                          disabled={!deleteSafetyChecked || deleteInputConfirmation !== "EXCLUIR" || isDeletingUser}
                          className={`w-full py-3.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            deleteSafetyChecked && deleteInputConfirmation === "EXCLUIR"
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/40"
                              : "bg-[#181114] text-rose-500/40 border border-rose-950/40 cursor-not-allowed"
                          }`}
                        >
                          {isDeletingUser ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                              Efetuando Expurgo...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Excluir meu Cadastro em Definitivo
                            </>
                          )}
                        </button>

                      </div>

                    </div>

                    <div className="p-4 rounded-xl bg-[#111c2a] border border-white/5 space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Garantia Constitucional de Portabilidade</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                        A UMESC preza pela transparência jurídica plena. Antes de exercer seu Direito ao Esquecimento, você pode usar o botão "Portabilidade de Dados" na ficha ao lado para gerar e baixar localmente um documento assinado digitalmente com todas as suas informações associativas.
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB FICHA DE FILIACAO (AUTORIZACAO DE DESCONTO EM FOLHA) */}
              {activeTab === "filiacao" && loggedInUser && (
                <div id="tab-dashboard-filiacao" className="animate-fadeIn bg-[#131f2f] rounded-xl border border-white/5 p-4 sm:p-6 space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display uppercase">
                      <FileCheck className="w-5 h-5 text-amber-500" />
                      Ficha de Filiação & Autorização de Desconto
                    </h3>
                    <p className="text-xs text-slate-450 mt-1">
                      Preencha os dados cadastrais residenciais e assine eletronicamente seu formulário de filiação para repasse voluntário à UMESC.
                    </p>
                  </div>

                  <FichaFiliacaoForm
                    loggedInUser={loggedInUser}
                    submittedFicha={submittedFicha}
                    onFichaSubmitted={(ficha) => setSubmittedFicha(ficha)}
                    onFichaDeleted={() => setSubmittedFicha(null)}
                  />
                </div>
              )}

              {/* TAB 5: EDIT PROFILE / RETIFICATE FICHA */}
              {activeTab === "profile" && (
                <div id="tab-dashboard-profile" className="space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display uppercase">
                      <User className="w-5 h-5 text-emerald-400" />
                      Meu Cadastro de Associado: Retificação de Ficha
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {loggedInUser?.approved === false ? (
                        <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded inline-block mt-1">
                          ⚠️ STATUS COMPILADO: PENDENTE DE HOMOLOGAÇÃO COLETIVA DA DIRETORIA. Seus dados estão em análise, mas você pode retificar sua ficha cadastral abaixo.
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          ✓ Seu cadastro está HOMOLOGADO e ATIVO. Você pode atualizar seus dados cadastrais abaixo a qualquer momento.
                        </span>
                      )}
                    </p>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-4 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong>Cadastro Atualizado com Sucesso!</strong> Suas retificações cadastrais foram processadas e salvas na indexadora militar.
                      </div>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-4 rounded bg-red-950/40 border border-red-550/30 text-red-400 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <strong>Falha ao atualizar dados:</strong> {profileErrorMsg}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdateSubmit} className="bg-[#132031] rounded-xl border border-white/5 p-6 space-y-4 max-w-2xl">
                    
                    {/* Foto de Perfil 3x4 do Associado */}
                    <div className="p-4 bg-[#0a111a] rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[#d6a528] font-mono uppercase">
                        <UploadCloud className="w-3.5 h-3.5" /> FOTO OFICIAL DE PERFIL CADASTRAL (3x4)
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Esta foto de identificação será utilizada para preenchimento inteligente automático de credenciais de Congressos e confecção do seu Voucher/Crachá Oficial.
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border border-white/10 bg-slate-950 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {profilePhotoUrl ? (
                            <img src={profilePhotoUrl} alt="Foto Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-8 h-8 text-slate-700 animate-pulse" />
                          )}
                          {isUploadingProfilePhoto && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="w-3.5 h-3.5 border-2 border-[#d6a528] border-t-transparent rounded-full animate-spin"></span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <label className="inline-block px-3 py-1.5 bg-[#121c2d] hover:bg-[#18263c] border border-white/10 rounded text-[10px] font-black text-slate-200 cursor-pointer transition-colors text-center uppercase tracking-wider font-mono">
                            Alterar Foto de Identificação
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setIsUploadingProfilePhoto(true);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProfilePhotoUrl(reader.result as string);
                                    setIsUploadingProfilePhoto(false);
                                  };
                                  reader.onerror = () => {
                                    setIsUploadingProfilePhoto(false);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setProfilePhotoUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300")}
                              className="text-[9px] text-[#d6a528] hover:underline hover:text-amber-400 font-bold"
                            >
                              Presets: Masculino
                            </button>
                            <span className="text-slate-600 text-[9px]">•</span>
                            <button
                              type="button"
                              onClick={() => setProfilePhotoUrl("https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300")}
                              className="text-[9px] text-[#d6a528] hover:underline hover:text-amber-400 font-bold"
                            >
                              Femenino
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Nome Completo (Matrícula):</label>
                        <input 
                          type="text"
                          required
                          maxLength={100}
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Data de Nascimento:</label>
                        <input 
                          type="date"
                          required
                          value={profileBirthDate || ""}
                          onChange={(e) => setProfileBirthDate(e.target.value)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Vínculo Institucional:</label>
                        <select
                          value={profileForce}
                          onChange={(e) => setProfileForce(e.target.value as any)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="PM">Polícia Militar de SC (PMSC)</option>
                          <option value="BM">Bombeiro Militar de SC (CBMSC)</option>
                          <option value="FFAA">Forças Armadas (Marinha/Exército/Aeronáutica)</option>
                          <option value="Civil">Agente Civil de Segurança (Polícia/IGP)</option>
                          <option value="Apoiador">Apoiador Social Voluntário</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Posto / Profissão:</label>
                        <input 
                          type="text"
                          required
                          maxLength={50}
                          value={profileRank}
                          onChange={(e) => setProfileRank(e.target.value)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Matrícula SC ou RG Militar:</label>
                        <input 
                          type="text"
                          maxLength={50}
                          value={profileRgMilitar}
                          onChange={(e) => setProfileRgMilitar(e.target.value)}
                          placeholder="Ex: PMSC 912.420-9"
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Cidade Sede (SC):</label>
                        <input 
                          type="text"
                          required
                          maxLength={50}
                          value={profileCity}
                          onChange={(e) => setProfileCity(e.target.value)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Igreja de Comunhão Ativa:</label>
                      <input 
                        type="text"
                        required
                        maxLength={150}
                        value={profileChurch}
                        onChange={(e) => setProfileChurch(e.target.value)}
                        className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">E-mail Corporativo/Seguro:</label>
                        <input 
                          type="email"
                          required
                          maxLength={100}
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Telefone WhatsApp:</label>
                        <input 
                          type="text"
                          required
                          maxLength={15}
                          placeholder="(48) 99999-9999"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(formatPhone(e.target.value))}
                          className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Senha de Acesso ao Portal (Mínimo 6 caracteres):</label>
                      <input 
                        type="password"
                        required
                        maxLength={30}
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full bg-[#0a101b] border border-white/10 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold uppercase text-xs tracking-wider px-6 py-3.5 rounded cursor-pointer transition-colors shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Salvar Alterações de Ficha
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* TAB 8: PLANO DE LEITURA ANUAL DA BÍBLIA */}
              {activeTab === "leitura" && loggedInUser && (
                <div id="tab-dashboard-leitura" className="animate-fadeIn bg-[#131f2f] rounded-xl border border-white/5 p-4 sm:p-6 space-y-6">
                  <PlanoLeituraBiblica loggedInUser={loggedInUser} />
                </div>
              )}

              {/* TAB 9: CONGRESSOS E INSCRIÇÕES DA UMESC */}
              {activeTab === "congressos" && loggedInUser && (
                <div id="tab-dashboard-congressos" className="animate-fadeIn bg-[#131f2f] rounded-xl border border-white/5 p-4 sm:p-6 space-y-6">
                  <CongressoInscricaoMembro loggedInUser={loggedInUser} />
                </div>
              )}

              {/* TAB 10: INSCRIÇÃO DE VOLUNTARIADO DE CAPELANIA */}
              {activeTab === "voluntariado" && (
                <div id="tab-dashboard-voluntariado" className="animate-fadeIn bg-[#131f2f] rounded-xl border border-white/5 p-4 sm:p-6 space-y-6 text-left">
                  <div className="border-b border-white/10 pb-3">
                    <div className="text-[10px] font-mono tracking-widest text-[#f59e0b] font-black uppercase mb-1.5 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      PMSC & CBMSC Integrados
                    </div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display uppercase">
                      <Compass className="w-5 h-5 text-amber-500 animate-pulse" />
                      Inscrição de Voluntário da Capelania Voluntária
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Participe do braço forte de apoio espiritual, ético-social e humanitário da UMESC em hospitais, quartéis, rodovias e comunidades catarinenses.
                    </p>
                  </div>
                  <CapelaniaVolunteeringForm loggedInUser={loggedInUser} />
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Corporate footer info */}
      <footer className="bg-[#070c1a] border-t border-white/5 py-6 px-6 text-center text-[11px] text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} UMESC Corpo de Segurança e Portal Privado. Todos os direitos reservados.</p>
          <p className="font-mono text-[10px] text-slate-400">Utilidade Pública Estadual Consolidade sob a Lei SC 12.045</p>
        </div>
      </footer>

      {/* 1. OBRIGATÓRIO: Terms acceptance overlay (Mandatory awareness overlay blocking the UI on first login or when terms are edited) */}
      {showTermsOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070c1ae0] backdrop-blur-md">
          <div className="bg-[#131f2e] border border-amber-500/40 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden antialiased animate-fadeIn">
            <div className="p-5 border-b border-white/5 bg-[#17273a] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-450 leading-tight">
                  Termos de Uso e Política de Privacidade de Dados
                </h3>
                <p className="text-[10px] text-slate-300 mt-1 uppercase font-mono font-bold">
                  ciência e consentimento obrigatório • UMESC SC
                </p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-[11px] leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#0c121e] border-b border-white/5">
              {currentTerms.content}
            </div>

            <div className="p-5 bg-[#17273a] flex flex-col gap-3">
              <p className="text-[10px] text-slate-400 leading-normal">
                Ao clicar no botão abaixo, você declara formalmente ter lido, compreendido e aceito integralmente os Termos de Uso e a Política de Privacidade (LGPD) da UMESC para os tratamentos de dados eclesiásticos, cadastrais e de capelania militar.
              </p>
              <button
                type="button"
                onClick={handleAcceptTerms}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-[#0b1329] font-black uppercase text-xs tracking-wider rounded transition-all cursor-pointer shadow-lg text-center"
              >
                Li e concordo com os Termos de Uso e Privacidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. INFORMATIVO: Discrete Terms-of-use reader modal (Opened through the discrete button click anywhere) */}
      {showTermsModalOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070c1ab0] backdrop-blur-sm">
          <div className="bg-[#131f2e] border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-white/5 bg-[#17273a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 leading-tight">
                    Consulta aos Termos de Uso & LGPD
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Última atualização: {new Date(currentTerms.lastUpdated || "2026-06-04").toLocaleDateString("pt-BR", { hour: "numeric", minute: "numeric", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowTermsModalOnly(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg p-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-[11px] leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#0c121e] border-b border-white/5">
              {currentTerms.content}
            </div>

            <div className="p-4 bg-[#17273a] flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModalOnly(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
