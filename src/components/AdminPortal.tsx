import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, Users, Briefcase, BookOpen, Layers, Calendar, 
  Trash2, Edit, Plus, Check, X, LogIn, LogOut, ArrowLeft, RefreshCw, BarChart2, PieChart, Info,
  Pause, Play, Archive, MessageCircle, Scale, Download, MapPin, FileCheck, FileText, Printer, QrCode
} from "lucide-react";
import { membersService, adminService, isSupabaseConfigured } from "../lib/supabase.ts";
import { termsService } from "../lib/termsService.ts";
import { MemberRegistration, Project, FichaFiliacao } from "../types";
import { generateFichaPdf } from "../lib/fichaPdfHelper.ts";
import { RevistaEdition } from "./RevistasSection.tsx";
import { DEFAULT_DIRETORIA, COORDINATORS_DATA, INITIAL_PROJECTS } from "../data.ts";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";
import CongressoManager from "./CongressoManager.tsx";

import convite1 from "../assets/images/umesc_convite_1_1779818301691.png";
import convite2 from "../assets/images/umesc_convite_2_1779818318346.png";
import evento1 from "../assets/images/umesc_evento_1_1779818334743.png";
import evento2 from "../assets/images/umesc_evento_2_1779818351705.png";

// Fallbacks matching INITIAL_REVISTAS
const DEFAULT_REVISTAS = [
  {
    id: "rev_1",
    title: "Revista Oficial Capelania e Fé",
    volume: "Edição Especial Nº 15",
    publishedDate: "2026-04-01",
    description: "Artigos científicos sobre prevenção ao esgotamento psicológico nas tropas, saúde mental no fardamento e guia prático de oração nos postos.",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
    downloads: 342
  },
  {
    id: "rev_2",
    title: "Informativo UMESC - Conexão e Assistência",
    volume: "Volume II Trimestral",
    publishedDate: "2026-02-15",
    description: "Balanço ilustrado das ações de resgate com sopas nos invernos de Santa Catarina, reformas de capelas e relatórios de novos fardados associados.",
    coverImage: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400",
    downloads: 189
  }
];

// Fallbacks matching carousels slides
const DEFAULT_CONVITES = [
  {
    id: 1,
    image: convite1,
    tag: "CONGRESSO",
    title: "35° Congresso Estadual UMESC",
    description: "Grande comemoração e palestras teológicas militares em Florianópolis, reunindo forças de segurança de SC.",
    date: "Acontece em Novembro"
  },
  {
    id: 2,
    image: convite2,
    tag: "ESPIRITUALIDADE",
    title: "II Recruta Espiritual Catarinense",
    description: "Um dia intensivo de mentoria e renovação espiritual sob a palavra sagrada para policiais fardados.",
    date: "Inscreva-se Já"
  }
];

const DEFAULT_EVENTOS = [
  {
    id: 1,
    image: evento1,
    tag: "DEVOCIONAL",
    title: "Círculos de Oração em Postos",
    description: "Militares orando juntos pelo bem-estar e integridade emocional de toda a tropa estadual de SC.",
    place: "Batalhões Locais de SC"
  },
  {
    id: 2,
    image: evento2,
    tag: "AÇÃO SOCIAL",
    title: "Resgate e Auxílio na Serra",
    description: "Ação beneficente voluntária levando sopas quentes e agasalhos para as regiões mais frias de SC.",
    place: "Serra Catarinense"
  }
];

interface AdminPortalProps {
  onBackToHome: () => void;
}

export default function AdminPortal({ onBackToHome }: AdminPortalProps) {
  // Login State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem("umesc_admin_auth") === "true";
  });
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [activeTab, setActiveTab] = useState<"dashboard" | "membros" | "projetos" | "revistas" | "convites" | "eventos" | "termos" | "diretoria" | "coordenadores" | "congressos" | "fichas">("dashboard");

  // Supabase Connection State Diagnostics
  const [dbStatus, setDbStatus] = useState<{
    tested: boolean;
    active: boolean;
    details: string;
    tablesExist: boolean;
    checking: boolean;
  }>({
    tested: false,
    active: false,
    details: "",
    tablesExist: false,
    checking: false,
  });

  // Terms and Privacy Editorial States
  const [termsContent, setTermsContent] = useState("");
  const [termsLastUpdated, setTermsLastUpdated] = useState("");
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [saveTermsSuccess, setSaveTermsSuccess] = useState(false);
  const [saveTermsError, setSaveTermsError] = useState("");

  // Load terms of use on load for the editors
  useEffect(() => {
    const loadTermsData = async () => {
      try {
        const data = await termsService.getTerms();
        setTermsContent(data.content);
        setTermsLastUpdated(data.lastUpdated);
      } catch (err) {
        console.error("Erro ao carregar termos de uso para edição:", err);
      }
    };
    loadTermsData();
  }, []);

  const handleSaveTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTerms(true);
    setSaveTermsSuccess(false);
    setSaveTermsError("");

    try {
      const ok = await termsService.saveTerms(termsContent);
      if (ok) {
        setSaveTermsSuccess(true);
        const data = await termsService.getTerms();
        setTermsLastUpdated(data.lastUpdated);
        // Diminui feedbacks temporarios
        setTimeout(() => setSaveTermsSuccess(false), 4000);
      } else {
        setSaveTermsError("Ocorreu uma falha desconhecida ao gravar as políticas.");
      }
    } catch (err: any) {
      setSaveTermsError(`Falha técnica de rede/gravação: ${err?.message || err}`);
    } finally {
      setIsSavingTerms(false);
    }
  };

  const checkSupabaseStatus = async () => {
    setDbStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await adminService.testConnection();
      setDbStatus({
        tested: true,
        active: res.active,
        details: res.details,
        tablesExist: res.tablesExist,
        checking: false,
      });
    } catch (err: any) {
      setDbStatus({
        tested: true,
        active: false,
        details: `Erro durante a rotina de testes: ${err?.message || err}`,
        tablesExist: false,
        checking: false,
      });
    }
  };

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  // Databases Loaded States
  const [members, setMembers] = useState<MemberRegistration[]>([]);
  const [fichas, setFichas] = useState<FichaFiliacao[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [revistas, setRevistas] = useState<RevistaEdition[]>([]);
  const [convites, setConvites] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);

  // Search members state
  const [searchMember, setSearchMember] = useState("");
  const [membersFilter, setMembersFilter] = useState<"all" | "pending" | "approved" | "paused" | "archived">("all");

  // Modals for Create/Edit inputs
  const [editingMember, setEditingMember] = useState<MemberRegistration | null>(null);
  const [deletingMemberHash, setDeletingMemberHash] = useState<{ hash: string, name: string } | null>(null);

  const [projectForm, setProjectForm] = useState<Partial<Project> | null>(null);
  const [selectedFichaForView, setSelectedFichaForView] = useState<FichaFiliacao | null>(null);
  const [searchFicha, setSearchFicha] = useState("");
  const [revistaForm, setRevistaForm] = useState<Partial<RevistaEdition> | null>(null);
  const [conviteForm, setConviteForm] = useState<any | null>(null);
  const [eventoForm, setEventoForm] = useState<any | null>(null);

  const [diretoria, setDiretoria] = useState<any[]>([]);
  const [diretoriaForm, setDiretoriaForm] = useState<{ id?: string, name: string, role: string, church?: string } | null>(null);

  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [coordenadoresForm, setCoordenadoresForm] = useState<{ id?: string, name: string, rank: string, role: string, region: string, contact: string, avatar: string } | null>(null);

  const [deletingRevista, setDeletingRevista] = useState<RevistaEdition | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deletingConvite, setDeletingConvite] = useState<any | null>(null);
  const [deletingEvento, setDeletingEvento] = useState<any | null>(null);
  const [deletingDiretoria, setDeletingDiretoria] = useState<any | null>(null);
  const [deletingCoordenador, setDeletingCoordenador] = useState<any | null>(null);

  // Load Admin databases
  const refreshAllData = async () => {
    try {
      // 1. Members
      const memberList = await membersService.getMembers();
      setMembers(memberList);

      // 2. Projects
      const savedProjs = localStorage.getItem("umesc_projects");
      setProjects(savedProjs ? JSON.parse(savedProjs) : INITIAL_PROJECTS);

      // 3. Revistas
      const savedRev = localStorage.getItem("umesc_revistas");
      setRevistas(savedRev ? JSON.parse(savedRev) : DEFAULT_REVISTAS);

      // 4. Carousel Convites
      const savedConv = localStorage.getItem("umesc_carousel_convites");
      setConvites(savedConv ? JSON.parse(savedConv) : DEFAULT_CONVITES);

      // 5. Carousel Eventos
      const savedEve = localStorage.getItem("umesc_carousel_eventos");
      setEventos(savedEve ? JSON.parse(savedEve) : DEFAULT_EVENTOS);

      // 6. Diretoria Board
      const savedDir = localStorage.getItem("umesc_diretoria");
      setDiretoria(savedDir ? JSON.parse(savedDir) : DEFAULT_DIRETORIA);

      // 7. Coordinators
      const savedCoords = localStorage.getItem("umesc_coordenadores");
      setCoordenadores(savedCoords ? JSON.parse(savedCoords) : COORDINATORS_DATA);

      // 8. Fichas de Filiação
      const savedFichas = localStorage.getItem("umesc_fichas_filiacao");
      setFichas(savedFichas ? JSON.parse(savedFichas) : []);
    } catch (e) {
      console.error("Error refreshing administrative databases:", e);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      refreshAllData();
    }
  }, [isAdminLoggedIn]);

  // Handle Admin Authorization Logon
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = adminEmail.toLowerCase().trim();
    
    try {
      const isOk = await adminService.authenticate(cleanMail, adminPassword);
      if (isOk) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem("umesc_admin_auth", "true");
      } else {
        alert("Credencial administrativa inválida! Por favor, utilize os dados corretos correspondentes.");
      }
    } catch {
      // Direct Backup Fallback in case of code or network failure
      if (cleanMail === "admin@umesc.org.br" && adminPassword === "adminUMESC2026") {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem("umesc_admin_auth", "true");
      } else {
        alert("Credencial administrativa inválida! Por favor, utilize os dados corretos.");
      }
    }
  };

  // Log out Admin
  const handleLogout = () => {
    sessionStorage.removeItem("umesc_admin_auth");
    setIsAdminLoggedIn(false);
  };

  // Broadcast events helper
  const notifyContentChange = () => {
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));
  };

  // Members Management actions
  const toggleMemberApproval = async (hash: string, currentStatus?: boolean) => {
    try {
      const field = { approved: !currentStatus };
      const ok = await membersService.updateMember(hash, field);
      if (ok) {
        await refreshAllData();
        notifyContentChange();
      }
    } catch (err) {
      alert("Erro ao alterar o status do associado.");
    }
  };

  const toggleMemberPause = async (hash: string, currentStatus?: boolean) => {
    try {
      const field: any = { paused: !currentStatus };
      if (!field.paused) {
        field.archived = false; // unarchiving as well if we unpause
      }
      const ok = await membersService.updateMember(hash, field);
      if (ok) {
        await refreshAllData();
        notifyContentChange();
        alert(!currentStatus ? "Cadastro do associado foi pausado! O membro terá acesso suspenso." : "Atividade do cadastro foi retomada!");
      }
    } catch {
      alert("Erro ao alterar o status de pausa do cadastro.");
    }
  };

  const toggleMemberArchive = async (hash: string, currentStatus?: boolean, isCurrentlyPaused?: boolean) => {
    if (!isCurrentlyPaused && !currentStatus) {
      alert("Operação bloqueada: Arquive somente cadastros pausados.");
      return;
    }
    try {
      const field = { archived: !currentStatus };
      const ok = await membersService.updateMember(hash, field);
      if (ok) {
        await refreshAllData();
        notifyContentChange();
        alert(!currentStatus ? "Cadastro arquivado com sucesso!" : "Cadastro restaurado do arquivo!");
      }
    } catch {
      alert("Erro ao alterar o status de arquivamento.");
    }
  };

  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (editingMember.archived && !editingMember.paused) {
      alert("Operação Inválida: Só é permitido arquivar cadastros que estejam pausados.");
      return;
    }
    try {
      const ok = await membersService.updateMember(editingMember.securityHash, {
        name: editingMember.name,
        rank: editingMember.rank,
        militaryForce: editingMember.militaryForce,
        church: editingMember.church,
        phone: editingMember.phone,
        email: editingMember.email,
        city: editingMember.city,
        rgMilitar: editingMember.rgMilitar,
        approved: editingMember.approved,
        paused: editingMember.paused,
        archived: editingMember.archived
      });
      if (ok) {
        setEditingMember(null);
        await refreshAllData();
        notifyContentChange();
        alert("Dados do associado editados com total salvaguarda LGPD.");
      }
    } catch {
      alert("Erro ao salvar edição.");
    }
  };

  const deleteMemberLgpd = (hash: string, name: string) => {
    setDeletingMemberHash({ hash, name });
  };

  const confirmDeleteMember = async () => {
    if (!deletingMemberHash) return;
    try {
      await membersService.deleteMember(deletingMemberHash.hash);
      setDeletingMemberHash(null);
      await refreshAllData();
      notifyContentChange();
      alert("Membro e as suas chaves correspondentes foram removidas do sistema com total salvaguarda LGPD.");
    } catch (err) {
      alert("Falha operacional ao excluir.");
    }
  };

  // Projects CRUD Actions
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm) return;

    let updatedList = [...projects];
    const cleanedImage = getCleanImageUrl(projectForm.image);
    if (projectForm.id) {
      // Edit mode
      updatedList = projects.map((p) => p.id === projectForm.id ? { ...p, ...projectForm, image: cleanedImage } as Project : p);
    } else {
      // Create mode
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        title: projectForm.title || "Novo Projeto Missionário",
        category: projectForm.category || "social",
        description: projectForm.description || "",
        detailedNeeds: projectForm.detailedNeeds || "",
        location: projectForm.location || "Santa Catarina",
        image: cleanedImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
        raisedPercent: projectForm.raisedPercent || 0,
        targetAmount: Number(projectForm.targetAmount) || 10000,
        currentAmount: ((projectForm.raisedPercent || 0) / 100) * (Number(projectForm.targetAmount) || 10000)
      };
      updatedList = [newProj, ...projects];
    }

    localStorage.setItem("umesc_projects", JSON.stringify(updatedList));
    setProjects(updatedList);
    setProjectForm(null);
    notifyContentChange();
    alert("Projetos salvos com sucesso e atualizados na Home-Page!");
  };

  const handleDeleteProject = (p: Project) => {
    setDeletingProject(p);
  };

  const confirmDeleteProject = () => {
    if (!deletingProject) return;
    const updated = projects.filter((p) => p.id !== deletingProject.id);
    localStorage.setItem("umesc_projects", JSON.stringify(updated));
    setProjects(updated);
    setDeletingProject(null);
    notifyContentChange();
  };

  // Revistas (Magazines) CRUD Actions
  const handleSaveRevista = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revistaForm) return;

    let updatedList = [...revistas];
    const cleanedCover = getCleanImageUrl(revistaForm.coverImage);
    const cleanedDownload = getCleanImageUrl(revistaForm.downloadUrl);
    if (revistaForm.id) {
      updatedList = revistas.map((r) => r.id === revistaForm.id ? { ...r, ...revistaForm, coverImage: cleanedCover, downloadUrl: cleanedDownload } as RevistaEdition : r);
    } else {
      const newRev: RevistaEdition = {
        id: `rev_${Date.now()}`,
        title: revistaForm.title || "Nova Revista UMESC",
        volume: revistaForm.volume || "Edição",
        publishedDate: revistaForm.publishedDate || new Date().toISOString().split("T")[0],
        description: revistaForm.description || "",
        coverImage: cleanedCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
        downloads: revistaForm.downloads || 0,
        downloadUrl: cleanedDownload || ""
      };
      updatedList = [newRev, ...revistas];
    }

    localStorage.setItem("umesc_revistas", JSON.stringify(updatedList));
    setRevistas(updatedList);
    setRevistaForm(null);
    notifyContentChange();
    alert("Revistas e boletins técnicos atualizados na Home!");
  };

  const handleDeleteRevista = (r: RevistaEdition) => {
    setDeletingRevista(r);
  };

  const confirmDeleteRevista = () => {
    if (!deletingRevista) return;
    const updated = revistas.filter((r) => r.id !== deletingRevista.id);
    localStorage.setItem("umesc_revistas", JSON.stringify(updated));
    setRevistas(updated);
    setDeletingRevista(null);
    notifyContentChange();
  };

  // Carousel Convites CRUD Actions
  const handleSaveConvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conviteForm) return;

    let updatedList = [...convites];
    const cleanedImage = getCleanImageUrl(conviteForm.image);
    if (conviteForm.id) {
      updatedList = convites.map((c) => c.id === conviteForm.id ? { ...c, ...conviteForm, image: cleanedImage } : c);
    } else {
      const newSlide = {
        id: Date.now(),
        image: cleanedImage || "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
        tag: conviteForm.tag || "CONVITE",
        title: conviteForm.title || "Novo Convite",
        description: conviteForm.description || "",
        date: conviteForm.date || "Breve"
      };
      updatedList = [...convites, newSlide];
    }

    localStorage.setItem("umesc_carousel_convites", JSON.stringify(updatedList));
    setConvites(updatedList);
    setConviteForm(null);
    notifyContentChange();
    alert("Carrossel de Convites reconstruído com sucesso!");
  };

  const handleDeleteConvite = (id: any) => {
    const updated = convites.filter((c) => c.id !== id);
    localStorage.setItem("umesc_carousel_convites", JSON.stringify(updated));
    setConvites(updated);
    notifyContentChange();
    alert("Item removido do carrossel.");
  };

  // Carousel Eventos CRUD Actions
  const handleSaveEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoForm) return;

    let updatedList = [...eventos];
    const cleanedImage = getCleanImageUrl(eventoForm.image);
    if (eventoForm.id) {
      updatedList = eventos.map((c) => c.id === eventoForm.id ? { ...c, ...eventoForm, image: cleanedImage } : c);
    } else {
      const newSlide = {
        id: Date.now(),
        image: cleanedImage || "https://images.unsplash.com/photo-1461532252243-85f001ca588a?auto=format&fit=crop&q=80&w=600",
        tag: eventoForm.tag || "AÇÃO SOCIAL",
        title: eventoForm.title || "Ação Social",
        description: eventoForm.description || "",
        place: eventoForm.place || "Santa Catarina"
      };
      updatedList = [...eventos, newSlide];
    }

    localStorage.setItem("umesc_carousel_eventos", JSON.stringify(updatedList));
    setEventos(updatedList);
    setEventoForm(null);
    notifyContentChange();
    alert("Carrossel de Eventos e Ações Sociais atualizado com sucesso!");
  };

  const handleDeleteEvento = (id: any) => {
    const updated = eventos.filter((c) => c.id !== id);
    localStorage.setItem("umesc_carousel_eventos", JSON.stringify(updated));
    setEventos(updated);
    notifyContentChange();
    alert("Item removido.");
  };

  // Diretoria Board CRUD Actions
  const handleSaveDiretoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diretoriaForm) return;

    let updatedList = [...diretoria];
    if (diretoriaForm.id) {
      updatedList = diretoria.map((d) => d.id === diretoriaForm.id ? { ...d, ...diretoriaForm } : d);
    } else {
      const newDir = {
        id: `dir_${Date.now()}`,
        name: diretoriaForm.name,
        role: diretoriaForm.role,
        church: diretoriaForm.church || ""
      };
      updatedList = [...diretoria, newDir];
    }

    localStorage.setItem("umesc_diretoria", JSON.stringify(updatedList));
    setDiretoria(updatedList);
    setDiretoriaForm(null);
    notifyContentChange();
    alert("Diretoria da UMESC atualizada com sucesso!");
  };

  const handleDeleteDiretoria = (d: any) => {
    setDeletingDiretoria(d);
  };

  const confirmDeleteDiretoria = () => {
    if (!deletingDiretoria) return;
    const updated = diretoria.filter((d) => d.id !== deletingDiretoria.id);
    localStorage.setItem("umesc_diretoria", JSON.stringify(updated));
    setDiretoria(updated);
    setDeletingDiretoria(null);
    notifyContentChange();
    alert("Membro da Diretoria removido.");
  };

  // Coordinators CRUD Actions
  const handleSaveCoordenador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordenadoresForm) return;

    let updatedList = [...coordenadores];
    const cleanedAvatar = getCleanImageUrl(coordenadoresForm.avatar);
    const avatarFallback = cleanedAvatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200";

    if (coordenadoresForm.id) {
      updatedList = coordenadores.map((c) => c.id === coordenadoresForm.id || c.name === coordenadoresForm.id ? { ...c, ...coordenadoresForm, avatar: avatarFallback } : c);
    } else {
      const newCoord = {
        id: `coord_${Date.now()}`,
        name: coordenadoresForm.name,
        rank: coordenadoresForm.rank,
        role: coordenadoresForm.role,
        region: coordenadoresForm.region,
        contact: coordenadoresForm.contact,
        avatar: avatarFallback
      };
      updatedList = [...coordenadores, newCoord];
    }

    localStorage.setItem("umesc_coordenadores", JSON.stringify(updatedList));
    setCoordenadores(updatedList);
    setCoordenadoresForm(null);
    notifyContentChange();
    alert("Coordenador regional atualizado com sucesso!");
  };

  const handleDeleteCoordenador = (c: any) => {
    setDeletingCoordenador(c);
  };

  const confirmDeleteCoordenador = () => {
    if (!deletingCoordenador) return;
    const updated = coordenadores.filter((c) => c.id !== deletingCoordenador.id && c.name !== deletingCoordenador.name);
    localStorage.setItem("umesc_coordenadores", JSON.stringify(updated));
    setCoordenadores(updated);
    setDeletingCoordenador(null);
    notifyContentChange();
    alert("Coordenador regional removido.");
  };

  // Dashboard Stats Calculations
  const totalMembros = members.length;
  const membrosAprovadosList = members.filter((m) => m.approved && !m.paused && !m.archived);
  const totalAprovados = membrosAprovadosList.length;
  const totalPendentes = members.filter((m) => !m.approved && !m.paused && !m.archived).length;
  const totalPausados = members.filter((m) => m.paused).length;
  const totalArquivados = members.filter((m) => m.archived).length;

  // Split counts for SVG Chart: PM, BM, FFAA, Civil, Apoiador
  const forceCounts = {
    PM: members.filter((m) => m.militaryForce === "PM").length,
    BM: members.filter((m) => m.militaryForce === "BM").length,
    FFAA: members.filter((m) => m.militaryForce === "FFAA").length,
    Civil: members.filter((m) => m.militaryForce === "Civil").length,
    Apoiador: members.filter((m) => m.militaryForce === "Apoiador").length,
  };

  const maxForceCount = Math.max(...Object.values(forceCounts), 1);

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#070c18] text-slate-100 flex items-center justify-center font-sans antialiased p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111b2d/40,transparent_65%)] pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#0b1220] border border-white/5 rounded-2xl p-6 sm:p-8 relative shadow-2xl overflow-hidden text-center space-y-6">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500"></div>

          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight text-white font-display">Acesso de Controle UMESC</h3>
            <p className="text-xs text-slate-400">Portal administrativo dedicado para moderação de associados, relórios fiscais e alimentação de mídias.</p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">E-mail Administrativo:</label>
              <input 
                type="email" 
                required 
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Exemplo: corporativa@umesc.org.br" 
                className="w-full bg-[#121c2d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Senha de Comando:</label>
              <input 
                type="password" 
                required 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••••" 
                className="w-full bg-[#121c2d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500 tracking-wider"
              />
            </div>

            {/* Supabase Diagnostic Connection Panel */}
            <div className="p-3.5 bg-[#0e1627] rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  ⚡ Conexão Supabase
                </span>
                <button
                  type="button"
                  disabled={dbStatus.checking}
                  onClick={checkSupabaseStatus}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Testar Conexão Novamente"
                >
                  <RefreshCw className={`w-3 h-3 ${dbStatus.checking ? "animate-spin" : ""}`} />
                </button>
              </div>

              {dbStatus.checking ? (
                <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  Checando comunicação com o Supabase...
                </div>
              ) : dbStatus.active ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    SUPABASE CONECTADO
                  </div>
                  <p className="text-[9px] text-slate-300 font-mono leading-tight bg-slate-900/40 p-1.5 rounded border border-emerald-500/10">
                    {dbStatus.details}
                  </p>
                  {dbStatus.tablesExist ? (
                    <span className="inline-block text-[8px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                      Tabelas Ativas (members, admins)
                    </span>
                  ) : (
                    <div className="space-y-1 bg-amber-500/5 p-1.5 rounded border border-amber-500/10">
                      <span className="inline-block text-[8px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">
                        Ação Necessária
                      </span>
                      <p className="text-[8px] text-slate-400 font-mono leading-normal">
                        Copie e execute o arquivo <code className="text-amber-400 underline font-black">/schema.sql</code> no "SQL Editor" do painel do seu Supabase para inicializar as tabelas perfeitamente.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    MODO LOCAL ATIVO (CONTINGÊNCIA)
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono leading-tight bg-slate-900/40 p-1.5 rounded border border-white/5">
                    Supabase desconectado. Modificações salvam em memória local (localStorage). {dbStatus.details}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1.5 text-[10px] text-slate-400 leading-normal font-mono text-center">
              <div className="text-amber-500 font-bold uppercase">🔐 Credencial de Demonstração</div>
              <div>E-mail: <span className="text-amber-400 font-bold">admin@umesc.org.br</span></div>
              <div>Senha: <span className="text-amber-400 font-bold">adminUMESC2026</span></div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Entrar no Painel Seguro
            </button>
          </form>

          <button
            onClick={onBackToHome}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 uppercase font-bold tracking-wider pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal Público
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans antialiased text-xs">
      
      {/* Admin Top bar */}
      <header className="bg-[#0b1220] border-b border-white/5 py-4 px-6 sticky top-0 z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold uppercase tracking-tight text-white flex flex-wrap items-center gap-2 font-display">
              <span className="truncate">Painel Geral de Governança UMESC</span>
              <span className="text-[8px] bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">ADMIN</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Status: Conectado com Integridade de Dados</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 w-full md:w-auto">
          <button
            onClick={refreshAllData}
            title="Atualizar Banco de Dados"
            className="p-2 bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 border border-rose-500/20 rounded-xl hover:bg-rose-500/15 text-rose-450 text-rose-400 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" /> Log-off
            </button>

            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#070c18] text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer shadow-md whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Portal
            </button>
          </div>
        </div>
      </header>

      {/* Admin main split workspace */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-60 bg-[#0b1220]/60 lg:border-r border-b lg:border-b-0 border-white/5 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 scrollbar-none">
          <span className="hidden lg:block text-[10px] font-mono font-bold uppercase tracking-widest text-[#1a2a40] text-slate-550 mb-3 px-3">Opções de Comando</span>
          
          {[
            { id: "dashboard", label: "Dashboard Analítico", icon: BarChart2 },
            { id: "congressos", label: "Gestão de Congressos", icon: QrCode },
            { id: "membros", label: `Membros (${members.length})`, icon: Users },
            { id: "fichas", label: `Fichas de Filiação (${fichas.length})`, icon: FileCheck },
            { id: "projetos", label: "Projetos Missionários", icon: Briefcase },
            { id: "revistas", label: "Revista e Boletins", icon: BookOpen },
            { id: "convites", label: "Carrossel de Convites", icon: Layers },
            { id: "eventos", label: "Carrossel de Eventos", icon: Calendar },
            { id: "termos", label: "Termos & Políticas LGPD", icon: Scale },
            { id: "diretoria", label: "Gestão da Diretoria", icon: Users },
            { id: "coordenadores", label: "Coordenadores Regionais", icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setProjectForm(null);
                  setRevistaForm(null);
                  setConviteForm(null);
                  setEventoForm(null);
                  setDiretoriaForm(null);
                  setCoordenadoresForm(null);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl uppercase tracking-wider text-[10px] font-bold text-left transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10" 
                    : "text-slate-300 hover:bg-[#121c2d] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}

          <div className="hidden lg:block mt-8 p-3 rounded-xl bg-[#0b1220] border border-white/5 space-y-2 text-[10px] text-slate-400">
            <span className="font-bold flex items-center gap-1 text-teal-400 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" /> Segurança Legal
            </span>
            <p className="leading-relaxed">Qualquer exclusão de associado remove o registro e limpa instantaneamente todas as ocorrências de segurança conforme regulamento da lei LGPD.</p>
          </div>
        </aside>

        {/* Workspace views and lists dynamic render */}
        <main className="flex-1 p-6 relative">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              <div className="text-left">
                <h2 className="text-lg font-bold text-white uppercase tracking-tight font-display">Resumo Operacional Estatutário</h2>
                <p className="text-slate-400 text-xs">Visão geral do caixa missionário, controle de homologação de novas fardas e mídias.</p>
              </div>

              {/* KPI Scorecard */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Membros Ativos</span>
                  <div className="text-2xl font-extrabold text-white font-display">{(totalMembros - totalPausados - totalArquivados)}</div>
                  <span className="text-[10px] text-teal-400 block font-bold font-mono">Em atividade</span>
                </div>

                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Moderações Pendentes</span>
                  <div className="text-2xl font-extrabold text-amber-400 font-display">{totalPendentes}</div>
                  <span className="text-[10px] text-amber-500 block font-bold">{totalPendentes > 0 ? "⚠️ Liberação Exigida" : "✓ Fila liberada"}</span>
                </div>

                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Cadastros Pausados</span>
                  <div className="text-2xl font-extrabold text-[#f97316] font-display">{totalPausados}</div>
                  <span className="text-[10px] text-orange-400 block font-bold">Acesso Suspenso</span>
                </div>

                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Arquivados</span>
                  <div className="text-2xl font-extrabold text-rose-450 text-rose-400 font-display">{totalArquivados}</div>
                  <span className="text-[10px] text-rose-450 block font-bold">Pasta Desativada</span>
                </div>

                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold font-mono">Projetos Ativos</span>
                  <div className="text-2xl font-extrabold text-sky-400 font-display">{projects.length}</div>
                  <span className="text-[10px] text-slate-400 block font-bold">Frentes de apoio</span>
                </div>

                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono font-bold">Fichas de Revista</span>
                  <div className="text-2xl font-extrabold text-purple-400 font-display">{revistas.length}</div>
                  <span className="text-[10px] text-slate-450 block font-medium">Acervo digital</span>
                </div>

              </div>

              {/* Row split: SVG Distribution Chart and Pendency Homologation queue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Visual Chart Block */}
                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-5 text-left space-y-4">
                  <h3 className="font-extrabold text-xs uppercase text-white tracking-widest font-display">Membros por Organização Catarinense</h3>
                  
                  {/* Styled clean custom SVG chart block */}
                  <div className="space-y-3.5">
                    {[
                      { name: "Polícia Militar SC (PM)", count: forceCounts.PM, color: "bg-amber-500" },
                      { name: "Corpo de Bombeiros (BM)", count: forceCounts.BM, color: "bg-teal-400" },
                      { name: "Forças Armadas (FFAA)", count: forceCounts.FFAA, color: "bg-indigo-400" },
                      { name: "Polícia Civil e Científica", count: forceCounts.Civil, color: "bg-emerald-400" },
                      { name: "Apoiadores Civis e Doadores", count: forceCounts.Apoiador, color: "bg-rose-450 bg-rose-500" },
                    ].map((item, idx) => {
                      const perc = totalMembros > 0 ? (item.count / totalMembros) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1 text-slate-300">
                          <div className="flex justify-between font-bold text-[10px] uppercase font-mono">
                            <span>{item.name}</span>
                            <span>{item.count} associados ({perc.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                            <div 
                              className={`h-full rounded ${item.color} transition-all duration-1000`}
                              style={{ width: `${perc}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Homologation Quick Queue list */}
                <div className="bg-[#0b1220] rounded-xl border border-white/5 p-5 text-left space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="font-extrabold text-xs uppercase text-white tracking-widest font-display flex items-center gap-1.5">
                      Fila de Homologação Urgente ({totalPendentes})
                    </h3>
                    <span className="text-[9px] font-mono font-bold text-amber-500 block uppercase">Novos Registros</span>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {members.filter(m => !m.approved).map((m, idx) => (
                      <div key={idx} className="p-3 bg-[#121c2d] rounded-xl border border-white/5 flex items-center justify-between text-slate-300">
                        <div>
                          <span className="block font-bold text-white text-xs">{m.name}</span>
                          <div className="flex gap-2 text-[9px] font-mono text-slate-400 mt-0.5 uppercase">
                            <span className="text-amber-400 font-bold">{m.militaryForce}</span>
                            <span>•</span>
                            <span>Rg: {m.rgMilitar || "CIVIL"}</span>
                            <span>•</span>
                            <span>{m.city}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleMemberApproval(m.securityHash, false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Homologar
                        </button>
                      </div>
                    ))}

                    {totalPendentes === 0 && (
                      <div className="py-8 text-center text-slate-550 flex flex-col items-center justify-center space-y-1.5 border border-dashed border-white/10 rounded-xl">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        <p className="text-[10px] uppercase font-mono tracking-wider font-bold">Todos os cadastros homologados!</p>
                        <p className="text-[9px] text-slate-400">Nenhum militar pendente na fila de auditoria legal.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === "congressos" && (
            <div className="bg-[#131f2f] rounded-xl border border-white/5 p-4 sm:p-6 space-y-6">
              <CongressoManager />
            </div>
          )}

          {/* TAB 2: MEMBERS MANAGEMENT */}
          {activeTab === "membros" && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Cadastro Legal de Associados</h2>
                  <p className="text-slate-400 text-xs">Examine fichas, aprove cadastros pendentes no Supabase ou execute direito de esquecimento LGPD.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar associado por nome..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Segmented Filter Control */}
              <div className="flex flex-wrap items-center gap-2 bg-[#0e1624]/60 p-1.5 rounded-xl border border-white/5 w-fit">
                <button
                  type="button"
                  onClick={() => setMembersFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    membersFilter === "all"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-300 hover:bg-[#121c2d] hover:text-white"
                  }`}
                >
                  Todos ({members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    membersFilter === "pending"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black shadow-md shadow-rose-500/5"
                      : "text-rose-455 hover:text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Pendentes ({members.filter(m => !m.approved && !m.paused && !m.archived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    membersFilter === "approved"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black shadow-md shadow-emerald-500/5"
                      : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Aprovados ({members.filter(m => m.approved && !m.paused && !m.archived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersFilter("paused")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    membersFilter === "paused"
                      ? "bg-[#f97316]/20 text-orange-300 border border-[#f97316]/30 font-black shadow-md shadow-orange-500/5"
                      : "text-orange-400 hover:text-orange-300 hover:bg-orange-555 hover:bg-orange-500/10"
                  }`}
                >
                  <Pause className="w-3.5 h-3.5 text-orange-400" />
                  Pausados ({members.filter(m => m.paused).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersFilter("archived")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    membersFilter === "archived"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black shadow-md shadow-purple-500/5"
                      : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-purple-300" />
                  Arquivados ({members.filter(m => m.archived).length})
                </button>
              </div>

              {/* Members dynamic list table layout */}
              <div className="bg-[#0b1220] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-[#0e1624] text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden md:grid grid-cols-12 gap-3">
                  <div className="col-span-3">Nome / Corporação</div>
                  <div className="col-span-1">CPF</div>
                  <div className="col-span-2">Vínculo Militar / Cidade</div>
                  <div className="col-span-2">Igreja</div>
                  <div className="col-span-2 text-center">Status / Controle</div>
                  <div className="col-span-2 text-right">Ação</div>
                </div>

                <div className="divide-y divide-white/5">
                  {members
                    .filter((m) => {
                      const matchesSearch = m.name.toLowerCase().includes(searchMember.toLowerCase());
                      if (!matchesSearch) return false;
                      if (membersFilter === "pending") return !m.approved && !m.paused && !m.archived;
                      if (membersFilter === "approved") return m.approved && !m.paused && !m.archived;
                      if (membersFilter === "paused") return !!m.paused;
                      if (membersFilter === "archived") return !!m.archived;
                      return true;
                    })
                    .map((m, idx) => (
                      <React.Fragment key={idx}>
                        {/* Desktop grid layout */}
                        <div className="p-4 hidden md:grid grid-cols-12 gap-3 items-center text-slate-300">
                          
                          <div className="col-span-3">
                            <span className="block font-bold text-white text-[11px] font-sans leading-tight">{m.name}</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mt-0.5 uppercase">
                              <span className="text-amber-500 font-extrabold">{m.militaryForce}</span>
                              <span>•</span>
                              <span>{m.rank}</span>
                            </div>
                          </div>

                          <div className="col-span-1 font-mono text-[9px] tracking-wider text-slate-200 truncate">
                            {m.cpf}
                          </div>

                          <div className="col-span-2">
                            <span className="block font-mono text-[10px] text-white grow-0 uppercase font-bold">{m.rgMilitar || "CIVIL"}</span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">{m.city}</span>
                          </div>

                          <div className="col-span-2 truncate font-semibold uppercase text-slate-400 max-w-[130px]" title={m.church}>
                            {m.church}
                          </div>

                          <div className="col-span-2 text-center flex flex-col items-center justify-center">
                            {m.archived ? (
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                🗄️ Arquivado
                              </span>
                            ) : m.paused ? (
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-[#f97316]/10 border border-[#f97316]/30 text-orange-400">
                                ⏸️ Pausado
                              </span>
                            ) : m.approved ? (
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                ✓ Homologado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500">
                                🔒 Pendente
                              </span>
                            )}

                            {/* Approval toggles for non-archived, non-paused members */}
                            {!m.archived && !m.paused && (
                              <button
                                type="button"
                                onClick={() => toggleMemberApproval(m.securityHash, m.approved)}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-colors border cursor-pointer mt-1 ${
                                  m.approved 
                                    ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-400/80" 
                                    : "bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/20 text-amber-500/80"
                                }`}
                              >
                                {m.approved ? "Desativar" : "Homologar"}
                              </button>
                            )}
                          </div>

                          <div className="col-span-2 flex justify-end gap-1.5 shrink-0 items-center">
                            {/* WhatsApp shortcut */}
                            {(() => {
                              const cleanPhone = m.phone ? m.phone.replace(/\D/g, "") : "";
                              const linkPhone = cleanPhone ? (cleanPhone.length === 10 || cleanPhone.length === 11 ? "55" + cleanPhone : cleanPhone) : "";
                              return linkPhone ? (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${linkPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Abrir WhatsApp de ${m.name}`}
                                  className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-center border border-emerald-500/20"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              ) : null;
                            })()}

                            {/* Archive Action button (Only allowed for paused, as requested) */}
                            <button
                              type="button"
                              onClick={() => toggleMemberArchive(m.securityHash, m.archived, m.paused)}
                              title={m.archived ? "Desarquivar Cadastro" : "Arquivar Cadastro"}
                              className={`p-1.5 rounded transition-all cursor-pointer ${
                                m.archived
                                  ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                                  : m.paused
                                    ? "hover:bg-purple-500/10 text-slate-400 hover:text-purple-400"
                                    : "text-slate-600 opacity-30 cursor-not-allowed"
                              }`}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Action button (always allowed) */}
                            <button
                              type="button"
                              onClick={() => setEditingMember(m)}
                              title="Editar Cadastro"
                              className="p-1.5 rounded hover:bg-[#121c2d] text-teal-400 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Action button (always allowed) */}
                            <button
                              type="button"
                              onClick={() => deleteMemberLgpd(m.securityHash, m.name)}
                              title="Apagar Membro (LGPD)"
                              className="p-1.5 rounded hover:bg-[#121c2d] text-rose-500 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile card layout */}
                        <div className="p-4 flex flex-col md:hidden text-slate-300 space-y-3 bg-[#0c1322] border-b border-white/5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="block font-bold text-white text-xs font-sans leading-tight">{m.name}</span>
                              <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-slate-400 mt-1 uppercase">
                                <span className="text-amber-500 font-extrabold">{m.militaryForce}</span>
                                <span>•</span>
                                <span>{m.rank}</span>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="shrink-0 text-right">
                              {m.archived ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/30 text-purple-400 inline-block">
                                  🗄️ Arquivado
                                </span>
                              ) : m.paused ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-[#f97316]/10 border border-[#f97316]/30 text-orange-400 inline-block">
                                  ⏸️ Pausado
                                </span>
                              ) : m.approved ? (
                                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                                  ✓ Homologado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500 inline-block">
                                  🔒 Pendente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Details Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-[#070c18] p-2.5 rounded-lg border border-white/5 text-[9px] font-sans">
                            <div>
                              <span className="text-[7.5px] font-bold text-slate-500 block uppercase font-mono mb-0.5">CPF</span>
                              <span className="font-mono text-slate-300 select-all block leading-tight">{m.cpf}</span>
                            </div>
                            <div>
                              <span className="text-[7.5px] font-bold text-slate-500 block uppercase font-mono mb-0.5">RG MILITAR</span>
                              <span className="font-mono text-slate-300 block font-bold leading-tight truncate">{m.rgMilitar || "CIVIL"}</span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase block leading-tight truncate">{m.city}</span>
                            </div>
                            <div>
                              <span className="text-[7.5px] font-bold text-slate-500 block uppercase font-mono mb-0.5">IGREJA</span>
                              <span className="text-slate-300 block font-semibold uppercase leading-tight truncate" title={m.church}>{m.church}</span>
                            </div>
                          </div>

                          {/* Actions row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            {/* Left: Approval toggle */}
                            <div>
                              {!m.archived && !m.paused && (
                                <button
                                  type="button"
                                  onClick={() => toggleMemberApproval(m.securityHash, m.approved)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                                    m.approved 
                                      ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-400/80" 
                                      : "bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/20 text-amber-500/80"
                                  }`}
                                >
                                  {m.approved ? "Desativar Cadastro" : "Homologar Cadastro"}
                                </button>
                              )}
                            </div>

                            {/* Right: Icon actions */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              {/* WhatsApp shortcut */}
                              {(() => {
                                const cleanPhone = m.phone ? m.phone.replace(/\D/g, "") : "";
                                const linkPhone = cleanPhone ? (cleanPhone.length === 10 || cleanPhone.length === 11 ? "55" + cleanPhone : cleanPhone) : "";
                                return linkPhone ? (
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${linkPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Abrir WhatsApp de ${m.name}`}
                                    className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-center border border-emerald-500/20"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                ) : null;
                              })()}

                              {/* Archive Action button */}
                              <button
                                type="button"
                                onClick={() => toggleMemberArchive(m.securityHash, m.archived, m.paused)}
                                title={m.archived ? "Desarquivar Cadastro" : "Arquivar Cadastro"}
                                className={`p-1.5 rounded transition-all cursor-pointer ${
                                  m.archived
                                    ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                                    : m.paused
                                      ? "hover:bg-purple-500/10 text-slate-400 hover:text-purple-400"
                                      : "text-slate-600 opacity-30 cursor-not-allowed"
                                }`}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Action button */}
                              <button
                                type="button"
                                onClick={() => setEditingMember(m)}
                                title="Editar Cadastro"
                                className="p-1.5 rounded hover:bg-[#121c2d] text-teal-400 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Action button */}
                              <button
                                type="button"
                                onClick={() => deleteMemberLgpd(m.securityHash, m.name)}
                                title="Apagar Membro (LGPD)"
                                className="p-1.5 rounded hover:bg-[#121c2d] text-rose-500 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </React.Fragment>
                    ))}

                  {members.filter((m) => {
                    const matchesSearch = m.name.toLowerCase().includes(searchMember.toLowerCase());
                    if (!matchesSearch) return false;
                    if (membersFilter === "pending") return !m.approved && !m.paused && !m.archived;
                    if (membersFilter === "approved") return m.approved && !m.paused && !m.archived;
                    if (membersFilter === "paused") return !!m.paused;
                    if (membersFilter === "archived") return !!m.archived;
                    return true;
                  }).length === 0 && (
                    <div className="p-8 text-center text-slate-500 uppercase font-mono">Nenhum associado localizado para este filtro.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: FICHAS DE FILIAÇÃO (AUTORIZAÇÕES DE DESCONTO EM FOLHA) */}
          {activeTab === "fichas" && (
            <div className="space-y-6 text-left animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Fichas de Filiação Cadastradas</h2>
                  <p className="text-slate-400 text-xs">Examine as autorizações de desconto em folha assinadas digitalmente pelos associados da UMESC.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem("umesc_fichas_filiacao");
                      setFichas(saved ? JSON.parse(saved) : []);
                    }}
                    className="p-2 bg-[#121c2d] hover:bg-[#1a2b44] text-amber-500 rounded-lg hover:text-amber-400 transition-colors border border-white/5 cursor-pointer flex items-center gap-2 text-xs font-bold uppercase"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                  </button>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111c2a] rounded-xl border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total de Fichas</span>
                  <span className="text-2xl font-black text-amber-400 font-display block mt-1">{fichas.length}</span>
                </div>
                <div className="p-4 bg-[#111c2a] rounded-xl border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Polícia Militar (PMSC 2801)</span>
                  <span className="text-2xl font-black text-blue-400 font-display block mt-1">
                    {fichas.filter(f => f.organ === "PMSC 2801").length}
                  </span>
                </div>
                <div className="p-4 bg-[#111c2a] rounded-xl border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bombeiros (BMSC 2802)</span>
                  <span className="text-2xl font-black text-red-400 font-display block mt-1">
                    {fichas.filter(f => f.organ === "BMSC 2802").length}
                  </span>
                </div>
                <div className="p-4 bg-[#111c2a] rounded-xl border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Outros Vínculos</span>
                  <span className="text-2xl font-black text-teal-400 font-display block mt-1">
                    {fichas.filter(f => f.organ === "OUTRO").length}
                  </span>
                </div>
              </div>

              {/* Action bar and Search */}
              <div className="p-4 bg-[#111c2a] rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={searchFicha}
                    onChange={(e) => setSearchFicha(e.target.value)}
                    placeholder="Pesquisar por nome ou CPF..."
                    className="w-full pl-3 pr-10 py-2 bg-[#09101b] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-500"
                  />
                </div>
                
                <span className="text-[10px] text-slate-450 font-mono">
                  Lista atualizada sob os provimentos jurídicos de consentimento da LGPD.
                </span>
              </div>

              {/* Table list */}
              <div className="bg-[#111c2a] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0b1320] border-b border-white/5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="p-4">ID / Protocolo</th>
                        <th className="p-4">Filiado (Associado)</th>
                        <th className="p-4">Corporação / Categoria</th>
                        <th className="p-4">Operação Solicitada</th>
                        <th className="p-4">Local / Hora da Assinatura</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {fichas.filter(f => {
                        return f.memberName.toLowerCase().includes(searchFicha.toLowerCase()) || 
                               f.memberCpf.includes(searchFicha);
                      }).map((ficha) => {
                        let opBadge = "";
                        let opStyle = "";
                        if (ficha.opcaoAutorizacao === 1) {
                          opBadge = `Desconto ${ficha.percentualDesconto}%`;
                          opStyle = "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
                        } else if (ficha.opcaoAutorizacao === 2) {
                          opBadge = `Altera ${ficha.percentualAnterior}% -> ${ficha.percentualNovo}%`;
                          opStyle = "bg-amber-950/40 text-amber-400 border border-amber-500/20";
                        } else {
                          opBadge = "Cancelamento";
                          opStyle = "bg-rose-950/40 text-rose-400 border border-rose-500/20";
                        }

                        return (
                          <tr key={ficha.id} className="hover:bg-[#152438]/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-amber-500 text-[10px] leading-tight">
                              {ficha.id}
                            </td>
                            <td className="p-4">
                              <span className="block font-bold text-white text-sm">{ficha.memberName}</span>
                              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">CPF: {ficha.memberCpf}</span>
                            </td>
                            <td className="p-4">
                              <span className="block font-bold text-slate-200">{ficha.organ === "OUTRO" ? (ficha.organOther || "OUTRO") : ficha.organ}</span>
                              <span className="block text-[10px] text-slate-400 capitalize mt-0.5">{ficha.categoria.toLowerCase().replace("_", " ")}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block leading-tight ${opStyle}`}>
                                {opBadge}
                              </span>
                            </td>
                            <td className="p-4 text-[10px] font-mono leading-tight">
                              <span className="block text-slate-200">{ficha.dataInscricao.split(",")[1]?.trim() || ficha.dataInscricao}</span>
                              <span className="block text-slate-500 mt-0.5 font-bold">IP: {ficha.ipAddress}</span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedFichaForView(ficha)}
                                  className="px-2.5 py-1.5 bg-sky-600/10 hover:bg-sky-500/25 text-sky-400 hover:text-sky-305 font-bold text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer"
                                  title="Ver Folha Oficial"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Ver Folha
                                </button>
                                <button
                                  onClick={() => {
                                    const blob = generateFichaPdf(ficha);
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `ficha_filiacao_${ficha.memberName.replace(/ /g, "_").toLowerCase()}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600/15 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-305 font-bold text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer"
                                  title="Baixar PDF Certificado"
                                >
                                  <Download className="w-3.5 h-3.5" /> PDF
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Deseja realmente remover permanentemente a Ficha de Filiação de ${ficha.memberName}? Esta ação removerá a assinatura eletrônica dos sistemas.`)) {
                                      const saved = localStorage.getItem("umesc_fichas_filiacao");
                                      if (saved) {
                                        try {
                                          const list = JSON.parse(saved) as FichaFiliacao[];
                                          const filtered = list.filter(item => item.id !== ficha.id);
                                          localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(filtered));
                                          setFichas(filtered);
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }
                                    }
                                  }}
                                  className="px-2 py-1.5 bg-rose-600/10 hover:bg-rose-500/25 text-rose-455 hover:text-rose-300 rounded transition-all cursor-pointer"
                                  title="Remover Ficha"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {fichas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 uppercase font-mono">
                            Nenhum formulário de filiação assinado foi enviado pelos membros até o momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immersive paper modal overlay when an admin views a single ficha */}
              {selectedFichaForView && (
                <div className="fixed inset-0 bg-[#060b13]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-[#121c2c] rounded-2xl max-w-4xl w-full border border-white/10 overflow-hidden shadow-2xl animate-scaleUp self-start my-8">
                    
                    {/* Modal head */}
                    <div className="bg-[#0b1320] px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block font-mono">Protocolo de Segurança: {selectedFichaForView.id}</span>
                        <h4 className="font-extrabold text-white text-sm uppercase font-display select-none">Preview do Documento de Filiação</h4>
                      </div>
                      <button
                        onClick={() => setSelectedFichaForView(null)}
                        className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Paper Area scroll container */}
                    <div className="p-6 overflow-x-auto bg-[#0a101b]">
                      <div className="bg-white text-slate-950 p-6 sm:p-8 w-[210mm] max-w-full mx-auto shadow-2xl space-y-4 text-[10px] font-sans border border-slate-300 text-left select-none">
                        
                        {/* SC header */}
                        <div className="border-b-2 border-slate-800 pb-3 flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded border border-slate-300 flex items-center justify-center text-[10px] font-serif font-black text-emerald-800">
                            SC
                          </div>
                          <div>
                            <span className="block text-[8px] font-serif uppercase tracking-widest font-bold text-slate-700">Estado de Santa Catarina</span>
                            <span className="block text-[11px] font-black uppercase text-slate-950 leading-tight">Autorização de Desconto/Cancelamento em Folha de Pagamento</span>
                          </div>
                        </div>

                        {/* Traditional table cells */}
                        <div className="grid grid-cols-12 gap-px bg-slate-200 border border-slate-200 text-[10px]">
                          
                          <div className="col-span-4 bg-slate-50 p-2 border-slate-200">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Órgão</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.organ === "OUTRO" ? (selectedFichaForView.organOther || "OUTRO") : selectedFichaForView.organ}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Lotação Município</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.lotacaoMunicipio}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Categoria</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.categoria.replace("_", " ")}</span>
                          </div>

                          <div className="col-span-8 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Entidade Consignada</span>
                            <span className="font-semibold text-slate-900">UMESC - União de Militares Evangélicos de Santa Catarina</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Código de Desconto</span>
                            <span className="font-mono font-bold text-slate-800">05-0554-01</span>
                          </div>

                          <div className="col-span-12 bg-slate-200 px-2 py-0.5 text-left font-bold uppercase text-slate-700 text-[8px]">
                            Identificação do Servidor Consignado
                          </div>

                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Matrícula</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.matricula}</span>
                          </div>
                          <div className="col-span-2 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Vínculo</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.vinculo}</span>
                          </div>
                          <div className="col-span-6 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Nome Completo</span>
                            <span className="font-bold text-slate-900 uppercase">{selectedFichaForView.memberName}</span>
                          </div>

                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">CPF</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.memberCpf}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Data de Nascimento</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.birthDate}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Gênero</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.genero === "M" ? "Masculino" : "Feminino"}</span>
                          </div>

                          {/* Rua endereço */}
                          <div className="col-span-12 bg-slate-200 px-2 py-0.5 text-left font-bold uppercase text-slate-700 text-[8px]">
                            Endereço Residencial do Servidor
                          </div>

                          <div className="col-span-8 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Rua / Av. / Nº</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.addressRua}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Bairro</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.addressBairro}</span>
                          </div>

                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">CEP</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.addressCep}</span>
                          </div>
                          <div className="col-span-8 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450">Cidade</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.addressCidade}</span>
                          </div>

                          {/* Contatos */}
                          <div className="col-span-12 bg-slate-200 px-2 py-0.5 text-left font-bold uppercase text-slate-700 text-[8px]">
                            Contatos e Comunicação
                          </div>

                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450 font-sans">Cidade</span>
                            <span className="font-bold text-slate-900">{selectedFichaForView.contactCidade}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450 font-sans">Fones</span>
                            <span className="font-mono font-bold text-slate-900">{selectedFichaForView.contactFones}</span>
                          </div>
                          <div className="col-span-4 bg-slate-50 p-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-450 font-sans">E-mail</span>
                            <span className="font-semibold text-slate-900">{selectedFichaForView.contactEmail}</span>
                          </div>

                          {/* Opcao */}
                          <div className="col-span-12 bg-slate-200 px-2 py-0.5 text-left font-bold uppercase text-slate-700 text-[8px]">
                            Cláusula de Autorização de Desconto em Folha (01)
                          </div>

                          <div className="col-span-12 bg-slate-50 p-3 leading-relaxed">
                            {selectedFichaForView.opcaoAutorizacao === 1 && (
                              <span>
                                <strong>[ X ] AUTORIZO</strong> o setorial/seccional de gestão de pessoas do órgão a descontar contribuição mensal de <strong>{selectedFichaForView.percentualDesconto}%</strong> em favor da UMESC.
                              </span>
                            )}
                            {selectedFichaForView.opcaoAutorizacao === 2 && (
                              <span>
                                <strong>[ X ] ALTERAR</strong> a contribuição de <strong>{selectedFichaForView.percentualAnterior}%</strong> para <strong>{selectedFichaForView.percentualNovo}%</strong> em favor da UMESC.
                              </span>
                            )}
                            {selectedFichaForView.opcaoAutorizacao === 3 && (
                              <span>
                                <strong>[ X ] CANCELAR</strong> desconto voluntário consignado em folha da UMESC.
                              </span>
                            )}
                          </div>

                          {/* Sign Area */}
                          <div className="col-span-6 bg-slate-50 p-4 border-r border-slate-200 flex flex-col justify-between">
                            <div>
                              <span className="block text-[8px] font-bold uppercase text-slate-450">Local e Data</span>
                              <span className="font-bold text-slate-900 leading-tight block mt-1.5">{selectedFichaForView.dataInscricao}</span>
                            </div>
                            <span className="text-[8px] text-slate-400 font-mono mt-4">Protocolado pelo membro autenticado</span>
                          </div>

                          <div className="col-span-6 bg-slate-50 p-4 flex flex-col items-center justify-center text-center">
                            <span className="block text-[8px] font-bold uppercase text-slate-405 mb-1.5">Assinatura do Associado (Eletrônica)</span>
                            
                            {selectedFichaForView.assinaturaDesenho ? (
                              <img 
                                src={selectedFichaForView.assinaturaDesenho} 
                                alt="Assinatura Eletrônica" 
                                className="max-h-12 border-b border-dashed border-slate-355 pb-0.5"
                              />
                            ) : (
                              <span className="font-serif italic font-extrabold text-blue-900 border-b border-dashed border-slate-300 px-6 py-1 select-none" style={{ fontFamily: 'Georgia, serif' }}>
                                {selectedFichaForView.assinaturaNome}
                              </span>
                            )}
                            
                            <span className="text-[7.5px] text-slate-450 block mt-1.5 font-bold uppercase">Autenticada em {selectedFichaForView.signatureDate}</span>
                            <span className="text-[6.5px] text-slate-400 block font-mono">IP: {selectedFichaForView.ipAddress}</span>
                          </div>

                        </div>

                        {/* Integrity seal */}
                        <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-sans text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Assinado sob conformidade jurídica ICP-Brasil</span>
                            <span className="block font-mono text-[7px] text-slate-500 break-all leading-none mt-0.5">{selectedFichaForView.securitySeal}</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Modal actions */}
                    <div className="bg-[#0b1320] px-5 py-3 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            // Perfect visual stylesheet simulation for print preview
                            const sheetHTML = `
                              <html>
                                <head>
                                  <title>Ficha de Filiacao - ${selectedFichaForView.memberName}</title>
                                  <style>
                                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; background: #fff; padding: 20px; }
                                    .sheet { width: 210mm; margin: 0 auto; border: 1px solid #ccc; padding: 30px; box-sizing: border-box; }
                                    .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; }
                                    .badge { width: 45px; height: 45px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
                                    .title-group { flex: 1; }
                                    .sc { text-transform: uppercase; font-size: 11px; letter-spacing: 2px; font-weight: bold; }
                                    .doc { text-transform: uppercase; font-size: 14px; font-weight: 900; margin-top: 3px; }
                                    .table-grid { border: 1px solid #000; width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
                                    .table-grid td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                                    .label { font-size: 8px; text-transform: uppercase; font-weight: bold; color: #555; display: block; margin-bottom: 4px; }
                                    .value { font-weight: bold; font-size: 12px; }
                                    .title-bar { background-color: #ddd; font-weight: bold; font-size: 10px; text-transform: uppercase; padding: 4px 8px !important; }
                                    .sign-box { text-align: center; }
                                    .sign-name { font-family: Georgia, serif; font-style: italic; font-size: 16px; border-b: 1px dashed #000; padding: 10px 30px; display: inline-block; }
                                    .seal-box { border: 1px solid #ccc; background-color: #f9f9f9; padding: 12px; border-radius: 6px; display: flex; align-items: center; font-size: 10px; }
                                    @media print {
                                      body { padding: 0; background: none; }
                                      .sheet { border: none; padding: 0; }
                                      button { display: none; }
                                    }
                                  </style>
                                </head>
                                <body onload="window.print();">
                                  <div class="sheet">
                                    <div class="header">
                                      <div class="badge">SC</div>
                                      <div class="title-group">
                                        <div class="sc">Estado de Santa Catarina</div>
                                        <div class="doc">Autorizacao de Desconto em Folha de Pagamento</div>
                                      </div>
                                    </div>
                                    <table class="table-grid">
                                      <tr>
                                        <td colspan="4"><span class="label">Orgao</span><span class="value">${selectedFichaForView.organ === "OUTRO" ? (selectedFichaForView.organOther || "OUTRO") : selectedFichaForView.organ}</span></td>
                                        <td colspan="4"><span class="label">Lotacao Municipio</span><span class="value">${selectedFichaForView.lotacaoMunicipio}</span></td>
                                        <td colspan="4"><span class="label">Categoria</span><span class="value">${selectedFichaForView.categoria.replace("_", " ")}</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="8"><span class="label">Entidade Consignada</span><span class="value">UMESC - Uniao de Militares Evangelicos de Santa Catarina</span></td>
                                        <td colspan="4"><span class="label">Codigo de Desconto</span><span class="value">05-0554-01</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="12" class="title-bar">Dados do Servidor Consignado</td>
                                      </tr>
                                      <tr>
                                        <td colspan="4"><span class="label">Matricula</span><span class="value">${selectedFichaForView.matricula}</span></td>
                                        <td colspan="2"><span class="label">Vinculo</span><span class="value">${selectedFichaForView.vinculo}</span></td>
                                        <td colspan="6"><span class="label">Nome Completo</span><span class="value">${selectedFichaForView.memberName}</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="4"><span class="label">CPF</span><span class="value">${selectedFichaForView.memberCpf}</span></td>
                                        <td colspan="4"><span class="label">Data de Nascimento</span><span class="value">${selectedFichaForView.birthDate}</span></td>
                                        <td colspan="4"><span class="label">Genero</span><span class="value">${selectedFichaForView.genero === "M" ? "Masculino" : "Feminino"}</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="12" class="title-bar">Endereco Residencial do Servidor</td>
                                      </tr>
                                      <tr>
                                        <td colspan="8"><span class="label">Rua / Av. / No</span><span class="value">${selectedFichaForView.addressRua}</span></td>
                                        <td colspan="4"><span class="label">Bairro</span><span class="value">${selectedFichaForView.addressBairro}</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="4"><span class="label">CEP</span><span class="value">${selectedFichaForView.addressCep}</span></td>
                                        <td colspan="8"><span class="label">Cidade</span><span class="value">${selectedFichaForView.addressCidade}</span></td>
                                      </tr>
                                      <tr>
                                        <td colspan="12" class="title-bar">Clausula de Autorizacao de Desconto em Folha (01)</td>
                                      </tr>
                                      <tr>
                                        <td colspan="12" style="padding: 15px; font-size: 11px;">
                                          ${selectedFichaForView.opcaoAutorizacao === 1 ? `<strong>[ X ] AUTORIZO</strong> o setorial/seccional de gestao de pessoas a descontar o percentual mensal de <strong>${selectedFichaForView.percentualDesconto}%</strong> em favor da UMESC.` : ""}
                                          ${selectedFichaForView.opcaoAutorizacao === 2 ? `<strong>[ X ] ALTERAR</strong> a contribuicao de <strong>${selectedFichaForView.percentualAnterior}%</strong> para <strong>${selectedFichaForView.percentualNovo}%</strong> em favor da UMESC.` : ""}
                                          ${selectedFichaForView.opcaoAutorizacao === 3 ? `<strong>[ X ] CANCELAR</strong> desconto voluntario consignado em folha da UMESC.` : ""}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td colspan="6" style="padding: 15px;"><span class="label">Local e Data</span><span class="value">${selectedFichaForView.dataInscricao}</span></td>
                                        <td colspan="6" class="sign-box" style="padding: 15px;">
                                          <span class="label">Assinatura Eletronica do Associado</span>
                                          ${selectedFichaForView.assinaturaDesenho ? `<img src="${selectedFichaForView.assinaturaDesenho}" style="max-height: 45px;" />` : `<span class="sign-name">${selectedFichaForView.assinaturaNome}</span>`}
                                          <div style="font-size: 8px; color: #444; margin-top: 5px;">Autenticado em ${selectedFichaForView.signatureDate} - IP: ${selectedFichaForView.ipAddress}</div>
                                        </td>
                                      </tr>
                                    </table>
                                    <div class="seal-box">
                                      <div style="font-weight: bold; text-transform: uppercase;">Selo de Garantia Digital:</div>
                                      <div style="font-family: monospace; font-size: 9px; margin-left: 10px; flex-grow: 1;">${selectedFichaForView.securitySeal}</div>
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `;
                            printWindow.document.write(sheetHTML);
                            printWindow.document.close();
                          }
                        }}
                        className="p-2 bg-[#121c2d] hover:bg-[#1a2b44] text-amber-500 rounded-lg hover:text-amber-400 transition-colors border border-white/5 cursor-pointer flex items-center gap-2 text-xs font-bold uppercase"
                      >
                        <Printer className="w-4 h-4" /> Imprimir Ficha
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const blob = generateFichaPdf(selectedFichaForView);
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = `ficha_filiacao_${selectedFichaForView.memberName.replace(/ /g, "_").toLowerCase()}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Salvar PDF Certificado
                        </button>
                        <button
                          onClick={() => setSelectedFichaForView(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PROJECTS MANAGEMENT */}
          {activeTab === "projetos" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Frentes de Projetos Missionários</h2>
                  <p className="text-slate-400 text-xs text-left">Curadoria de metas financeiras, necessidades prioritárias de farda ou fotos representativas.</p>
                </div>

                <button
                  onClick={() => setProjectForm({ id: "", title: "", category: "social", targetAmount: 10000, raisedPercent: 10, location: "", image: "", description: "", detailedNeeds: "" })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-150 text-slate-950 font-black tracking-wider text-[10px] uppercase transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Criar Projeto
                </button>
              </div>

              {/* Projects Grid for fast CRUD editing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[#0b1220] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all text-left space-y-4">
                    <div className="flex gap-4">
                      <img 
                        src={p.image || "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600"} 
                        alt={p.title} 
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/10" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600";
                        }}
                      />
                      <div className="space-y-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-105 bg-slate-900 text-amber-400 font-mono font-bold uppercase tracking-wider">{p.category}</span>
                        <h4 className="font-extrabold text-[#ffffff] text-xs sm:text-sm tracking-tight leading-tight line-clamp-1">{p.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold border-t border-white/5 pt-3">
                      <div>Meta: <span className="text-amber-500">R$ {p.targetAmount.toLocaleString("pt-BR")}</span> ({p.raisedPercent}%)</div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setProjectForm(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold rounded cursor-pointer"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: REVISTAS */}
          {activeTab === "revistas" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Acervo de Revistas e Boletins</h2>
                  <p className="text-slate-400 text-xs">Adicione novos volumes, consulte downloads acumulados do conselho geral ou atualize preâmbulos.</p>
                </div>

                <button
                  onClick={() => setRevistaForm({ id: "", title: "", volume: "Edição Especial", publishedDate: new Date().toISOString().split("T")[0], coverImage: "", description: "", downloads: 0 })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wider text-[10px] uppercase transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Publicação
                </button>
              </div>

              {/* Magazines List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {revistas.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-[#0b1220] border border-white/5 flex gap-4 items-start text-left hover:border-white/10 transition-all">
                    <img src={r.coverImage} alt={r.title} className="w-16 h-24 rounded object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                    
                    <div className="flex-1 flex flex-col justify-between h-24">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-mono font-bold text-amber-500 block uppercase">{r.volume} </span>
                          {r.downloadUrl ? (
                            <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0">ANEXO ATIVO</span>
                          ) : (
                            <span className="text-[7px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0">SIMULAÇÃO</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-white text-xs tracking-tight line-clamp-1 mt-0.5">{r.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{r.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2 text-[9px] font-mono text-slate-400">
                        <span>📥 {r.downloads} downloads</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRevistaForm(r)}
                            className="text-teal-400 hover:underline font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRevista(r)}
                            className="text-rose-400 hover:underline font-bold cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: CARROSSEL CONVITES */}
          {activeTab === "convites" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Carrossel de Slides: Convites Estaduais</h2>
                  <p className="text-slate-400 text-xs">Alimente os banners de anúncios dinâmicos na homepage do portal.</p>
                </div>

                <button
                  onClick={() => setConviteForm({ image: "", tag: "", title: "", description: "", date: "" })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-150 text-slate-950 font-black tracking-wider text-[10px] uppercase transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar Banner
                </button>
              </div>

              {/* Slide items list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {convites.map((c, i) => (
                  <div key={c.id || i} className="p-4 rounded-xl bg-[#0b1220] border border-white/5 flex gap-4 items-start text-left">
                    <img src={c.image} alt={c.title} className="w-16 h-16 rounded object-cover shrink-0 border border-white/10" referrerPolicy="no-referrer" />
                    <div className="flex-1 space-y-1">
                      <span className="text-[8px] font-mono font-bold bg-[#121c2d] border border-white/10 text-amber-400 px-1.5 py-0.5 rounded uppercase">{c.tag}</span>
                      <h4 className="font-extrabold text-white text-xs leading-tight">{c.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{c.description}</p>
                      
                      <div className="flex items-center justify-between text-[9px] font-semibold font-mono text-slate-400 pt-2 border-t border-white/5 uppercase mt-2">
                        <span>📅 {c.date}</span>
                        <div className="flex gap-2.5">
                          <button onClick={() => setConviteForm(c)} className="text-teal-400 hover:underline cursor-pointer">Editar</button>
                          <button onClick={() => handleDeleteConvite(c.id)} className="text-rose-400 hover:underline cursor-pointer">Excluir</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 6: CARROSSEL EVENTOS */}
          {activeTab === "eventos" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Carrossel de Slides: Eventos e Campanhas Estaduais</h2>
                  <p className="text-slate-400 text-xs">Gerencie os registros do carrossel de atividades sociais e distribuição de literaturas na home.</p>
                </div>

                <button
                  onClick={() => setEventoForm({ image: "", tag: "", title: "", description: "", place: "" })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wider text-[10px] uppercase transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar Evento
                </button>
              </div>

              {/* Event items list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventos.map((e, i) => (
                  <div key={e.id || i} className="p-4 rounded-xl bg-[#0b1220] border border-white/5 flex gap-4 items-start text-left">
                    <img src={e.image} alt={e.title} className="w-16 h-16 rounded object-cover shrink-0 border border-white/10" referrerPolicy="no-referrer" />
                    <div className="flex-1 space-y-1">
                      <span className="text-[8px] font-mono font-bold bg-[#121c2d] border border-white/10 text-teal-400 px-1.5 py-0.5 rounded uppercase">{e.tag}</span>
                      <h4 className="font-extrabold text-white text-xs leading-tight">{e.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{e.description}</p>
                      
                      <div className="flex items-center justify-between text-[9px] font-semibold font-mono text-slate-400 pt-2 border-t border-white/5 uppercase mt-2">
                        <span>📍 {e.place}</span>
                        <div className="flex gap-2.5">
                          <button onClick={() => setEventoForm(e)} className="text-teal-400 hover:underline cursor-pointer">Editar</button>
                          <button onClick={() => handleDeleteEvento(e.id)} className="text-rose-400 hover:underline cursor-pointer">Excluir</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 7: EDITAR TERMOS DE USO & PRIVACIDADE LGPD */}
          {activeTab === "termos" && (
            <div className="space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2 font-display">
                    <Scale className="w-5 h-5 text-amber-500" />
                    Gerência dos Termos de Uso & LGPD (Políticas Oficiais)
                  </h2>
                  <p className="text-slate-400 text-xs">Configure o texto regulatório, termos de serviço e cookies de privacidade obrigatórios da UMESC.</p>
                </div>
                
                <div className="text-[10px] font-mono select-none px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400">
                  ÚLTIMA ATUALIZAÇÃO: {termsLastUpdated ? new Date(termsLastUpdated).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Carregando..."}
                </div>
              </div>

              {/* Alert explaining active notification logic */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-xs flex gap-3.5 leading-relaxed">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block uppercase text-[10px] tracking-wide text-indigo-450 mb-0.5">Sincronização de Ciência Automática:</strong>
                  Ao editar e salvar os Termos de Uso, a data de atualização é salva e o hash legal será renovado. No próximo login de cada militar ou associado cadastrado no portal, o sistema detectará a diferença temporal e **bloqueará o acesso dele**, exibindo o novo termo de forma segura em overlay para leitura e aceitação obrigatória. Eles não precisam aceitar novamente nas seções normais depois de concordado com a última versão.
                </div>
              </div>

              <form onSubmit={handleSaveTermsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Edit block (8 spans) */}
                  <div className="md:col-span-8 space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">Editor de Regulamentos (Formato Texto Simples):</label>
                    <textarea
                      rows={18}
                      required
                      value={termsContent}
                      onChange={(e) => setTermsContent(e.target.value)}
                      placeholder="Cole aqui o texto completo dos Termos de Uso e Política de Privacidade da UMESC..."
                      className="w-full bg-[#0b1220] border border-white/10 rounded-xl p-4 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono leading-relaxed"
                    />
                  </div>

                  {/* Right Column: Active preview and help indicators (4 spans) */}
                  <div className="md:col-span-4 space-y-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0b1220]/40 space-y-3">
                      <span className="block text-[10px] font-black uppercase text-teal-400 tracking-wider">Auxílio Legal de Formatação</span>
                      <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                        Escreva de forma clara e use quebras de linha para focar e dividir cada seção. Evite símbolos HTML complexos. O sistema exibe o regulamento exatamente como digitado aqui.
                      </p>
                      <div className="border-t border-white/5 pt-2 text-[9px] text-[#64748b] leading-tight space-y-1 font-mono">
                        <div>• Seção 1. Diretrizes da UMESC</div>
                        <div>• Seção 2. Coleta de Informações</div>
                        <div>• Seção 3. Direito ao Esquecimento</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-[#0b1220]/40 space-y-2">
                      <span className="block text-[10px] font-black uppercase text-amber-400 tracking-wider">Mapeamento de Conformidade</span>
                      <p className="text-[10px] text-slate-300 leading-normal">
                        O texto cobre obrigatoriamente preceitos da Lei Geral de Proteção de Dados (Lei 13.709/18) bem como o estatuto canônico de corporações evangélicas militares.
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Fórmula LGPD-UMESC Ativada</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Submissions & feedbacks */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0b1220] border border-white/5 rounded-xl p-4 gap-4">
                  <div className="flex items-center gap-3">
                    {saveTermsSuccess && (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        Termos salvos com sucesso! Todos os usuários serão notificados para ciência na sua próxima autenticação.
                      </div>
                    )}
                    {saveTermsError && (
                      <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                        <ShieldAlert className="w-5 h-5 text-rose-455 shrink-0" />
                        {saveTermsError}
                      </div>
                    )}
                    {!saveTermsSuccess && !saveTermsError && (
                      <span className="text-[10px] font-mono text-[#64748b]">Aperte o botão ao lado para implantar as alterações.</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingTerms}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-[#070c18] font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-sans"
                  >
                    {isSavingTerms ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Gravando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar Regulamento & Notificar Usuários
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 8: GESTÃO DA DIRETORIA */}
          {activeTab === "diretoria" && (
            <div className="space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2 font-display">
                    <Users className="w-5 h-5 text-amber-500" />
                    Gestão da Diretoria (Biênio 2025/2026)
                  </h2>
                  <p className="text-slate-400 text-xs">Administre os oficiais e membros da Diretoria Executiva Estadual para exibição pública e no painel dos membros.</p>
                </div>
                
                <button
                  onClick={() => setDiretoriaForm({ name: "", role: "", church: "" })}
                  className="px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" /> Novo Membro da Diretoria
                </button>
              </div>

              {/* Form editing/creating */}
              {diretoriaForm && (
                <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-xl text-white">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider">
                      {diretoriaForm.id ? "Editar Membro da Diretoria" : "Adicionar Membro da Diretoria"}
                    </h3>
                    <button 
                      onClick={() => setDiretoriaForm(null)}
                      className="p-1 rounded-lg text-slate-450 hover:bg-white/5 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDiretoria} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Cargo / Função *</label>
                        <input
                          type="text"
                          required
                          value={diretoriaForm.role}
                          onChange={(e) => setDiretoriaForm({ ...diretoriaForm, role: e.target.value })}
                          placeholder="Ex: Presidente, Vice-Presidente, Suplente"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={diretoriaForm.name}
                          onChange={(e) => setDiretoriaForm({ ...diretoriaForm, name: e.target.value })}
                          placeholder="Ex: Coronel PMSC RR, Pastor EMILSON"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Igreja / Congregação (Opcional)</label>
                        <input
                          type="text"
                          value={diretoriaForm.church || ""}
                          onChange={(e) => setDiretoriaForm({ ...diretoriaForm, church: e.target.value })}
                          placeholder="Ex: Assembleia de Deus"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setDiretoriaForm(null)}
                        className="px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                      >
                        {diretoriaForm.id ? "Atualizar" : "Salvar"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid or Table listing of Directors */}
              <div className="bg-[#0b1220]/40 rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 bg-[#0b1220]/60 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Oficiais Cadastrados ({diretoria.length})</span>
                  <p className="text-[10px] text-slate-500">Cadastre e organize para mudar a visualização ou use os controles de edição.</p>
                </div>

                <div className="divide-y divide-white/5">
                  {diretoria.map((dir, index) => (
                    <div 
                      key={dir.id || index} 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1723]/30 hover:bg-[#0d1723]/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20">
                            {dir.role}
                          </span>
                          {dir.church && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 border border-white/10">
                              {dir.church}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 font-sans">{dir.name}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setDiretoriaForm({ ...dir })}
                          className="p-2 rounded-xl bg-[#132031]/55 border border-white/5 hover:border-amber-450 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all cursor-pointer"
                          title="Editar cadastro"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiretoria(dir)}
                          className="p-2 rounded-xl bg-[#132031]/55 border border-white/5 hover:bg-rose-500/15 hover:text-rose-450 text-rose-400 transition-all cursor-pointer"
                          title="Excluir da Diretoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {diretoria.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum membro da diretoria cadastrado. Clique em "Novo Membro da Diretoria" para começar.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: GESTÃO DOS COORDENADORES REGIONAIS */}
          {activeTab === "coordenadores" && (
            <div className="space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2 font-display">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    Gestão de Coordenadores Regionais
                  </h2>
                  <p className="text-slate-400 text-xs">Administre as lideranças regionais e os pontos de contato locais para exibição no portal geral e no painel de membros.</p>
                </div>
                
                <button
                  onClick={() => setCoordenadoresForm({ name: "", rank: "", role: "", region: "", contact: "", avatar: "" })}
                  className="px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" /> Novo Coordenador
                </button>
              </div>

              {/* Form editing/creating */}
              {coordenadoresForm && (
                <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-xl text-white">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider">
                      {coordenadoresForm.id ? "Editar Coordenador Regional" : "Adicionar Coordenador Regional"}
                    </h3>
                    <button 
                      onClick={() => setCoordenadoresForm(null)}
                      className="p-1 rounded-lg text-slate-450 hover:bg-white/5 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCoordenador} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Cargo / Patente / Graduação *</label>
                        <input
                          type="text"
                          required
                          value={coordenadoresForm.rank}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, rank: e.target.value })}
                          placeholder="Ex: Subtenente PM, Sargento PM, Capitão BM"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={coordenadoresForm.name}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, name: e.target.value })}
                          placeholder="Ex: Joel Ferreira"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Função Regional *</label>
                        <input
                          type="text"
                          required
                          value={coordenadoresForm.role}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, role: e.target.value })}
                          placeholder="Ex: Coordenador Regional Vale do Itajaí"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Região Estatutária *</label>
                        <input
                          type="text"
                          required
                          value={coordenadoresForm.region}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, region: e.target.value })}
                          placeholder="Ex: Grande Florianópolis / Litoral, Lages & Planalto Central"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Contato / Telefone *</label>
                        <input
                          type="text"
                          required
                          value={coordenadoresForm.contact}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, contact: e.target.value })}
                          placeholder="Ex: (47) 99115-3344"
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">URL da Foto de Perfil (Opcional)</label>
                        <input
                          type="url"
                          value={coordenadoresForm.avatar || ""}
                          onChange={(e) => setCoordenadoresForm({ ...coordenadoresForm, avatar: e.target.value })}
                          placeholder="Link da imagem: https://images.unsplash.com/..."
                          className="w-full bg-[#132031] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCoordenadoresForm(null)}
                        className="px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs uppercase font-bold tracking-wider rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                      >
                        {coordenadoresForm.id ? "Atualizar" : "Salvar"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid or Table listing of Coordenadores */}
              <div className="bg-[#0b1220]/40 rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 bg-[#0b1220]/60 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Líderes Locais Cadastrados ({coordenadores.length})</span>
                  <p className="text-[10px] text-slate-500">Cadastre e organize para mudar o suporte público e no painel privado.</p>
                </div>

                <div className="divide-y divide-white/5">
                  {coordenadores.map((coord, index) => (
                    <div 
                      key={coord.id || index} 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1723]/30 hover:bg-[#0d1723]/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={coord.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200"}
                          alt={coord.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/15"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20">
                              {coord.rank}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 uppercase tracking-wider bg-white/5 border border-white/10">
                              {coord.region}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 font-sans">{coord.name}</h4>
                          <p className="text-[10px] text-slate-400">{coord.role} • <span className="font-mono text-emerald-400 text-[10px]">{coord.contact}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => setCoordenadoresForm({ ...coord, id: coord.id || coord.name })}
                          className="p-2 rounded-xl bg-[#132031]/55 border border-white/5 hover:border-amber-450 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all cursor-pointer"
                          title="Editar cadastro"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoordenador(coord)}
                          className="p-2 rounded-xl bg-[#132031]/55 border border-white/5 hover:bg-rose-500/15 hover:text-rose-450 text-rose-400 transition-all cursor-pointer"
                          title="Excluir Coordenador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {coordenadores.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum coordenador regional cadastrado. Clique em "Novo Coordenador" para começar.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* RENDER DYNAMIC MODALS POPUPS FOR CREATE / EDIT */}

      {/* A. EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white my-8">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-amber-500 font-display flex items-center gap-1.5">
                Editar Cadastro do Associado ({editingMember.name.substring(0, 18)}...)
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-white text-xs font-mono">FECHAR X</button>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nome Completo:</label>
                  <input type="text" required value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Patente / Posto em Farda:</label>
                  <input type="text" required value={editingMember.rank} onChange={(e) => setEditingMember({ ...editingMember, rank: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Corporação (Força Catarinense):</label>
                  <select value={editingMember.militaryForce} onChange={(e) => setEditingMember({ ...editingMember, militaryForce: e.target.value as any })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white">
                    <option value="PM">Polícia Militar SC (PM)</option>
                    <option value="BM">Bombbeiro Militar (BM)</option>
                    <option value="FFAA">Forças Armadas (FFAA)</option>
                    <option value="Civil">Polícia Civil / Científica</option>
                    <option value="Apoiador">Apoiador Voluntário</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Registro / RG Militar:</label>
                  <input type="text" value={editingMember.rgMilitar} onChange={(e) => setEditingMember({ ...editingMember, rgMilitar: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">E-mail Seguro:</label>
                  <input type="email" required value={editingMember.email} onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cidade Base SC:</label>
                  <input type="text" required value={editingMember.city} onChange={(e) => setEditingMember({ ...editingMember, city: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Vínculo Religioso / Paróquia:</label>
                  <input type="text" required value={editingMember.church} onChange={(e) => setEditingMember({ ...editingMember, church: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="bg-[#121c2d] p-3 rounded border border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-[#334155] text-slate-300 font-bold uppercase">Status de Homologação:</span>
                <button
                  type="button"
                  onClick={() => setEditingMember({ ...editingMember, approved: !editingMember.approved })}
                  className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider border ${
                    editingMember.approved 
                      ? "bg-emerald-500/10 border-emerald-555 text-emerald-400" 
                      : "bg-amber-500/10 border-amber-555 text-amber-500"
                  }`}
                >
                  {editingMember.approved ? "✓ APROVADO / HOMOLOGADO" : "🔒 PENDENTE / BLOQUEADO"}
                </button>
              </div>

              <div className="bg-[#121c2d] p-3 rounded border border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-300 font-bold uppercase">Pausar Atividade do Cadastro:</span>
                <button
                  type="button"
                  onClick={() => {
                    const newPaused = !editingMember.paused;
                    setEditingMember({ 
                      ...editingMember, 
                      paused: newPaused,
                      archived: newPaused ? !!editingMember.archived : false 
                    });
                  }}
                  className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider border ${
                    editingMember.paused 
                      ? "bg-orange-500/10 border-orange-522 text-orange-400" 
                      : "bg-[#0b1220] border-white/5 text-slate-400"
                  }`}
                >
                  {editingMember.paused ? "⏸ PAUSADO / SUSPENSO" : "ATIVO"}
                </button>
              </div>

              <div className="bg-[#121c2d] p-3 rounded border border-white/5 flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-300 font-bold uppercase">Arquivar Cadastro Legal:</span>
                  {!editingMember.paused && (
                    <span className="text-[8px] text-rose-400 font-semibold font-mono mt-0.5">* Apenas para cadastros pausados</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!editingMember.paused}
                  onClick={() => setEditingMember({ ...editingMember, archived: !editingMember.archived })}
                  className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider border transition-all ${
                    !editingMember.paused 
                      ? "bg-slate-950/40 border-white/5 text-slate-650 cursor-not-allowed opacity-50"
                      : editingMember.archived 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                        : "bg-[#0b1220] border-white/5 text-slate-400"
                  }`}
                >
                  {editingMember.archived ? "🗄️ ARQUIVADO" : "NÃO ARQUIVADO"}
                </button>
              </div>

              <div className="flex gap-3 pt-4 justify-between items-center">
                <div>
                  {editingMember.paused && (
                    <button
                      type="button"
                      onClick={() => {
                        const hash = editingMember.securityHash;
                        const name = editingMember.name;
                        setEditingMember(null);
                        setDeletingMemberHash({ hash, name });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded bg-rose-500/10 hover:bg-rose-550 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-455 text-rose-400 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Cadastro
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer">Salvar Alterações</button>
                  <button type="button" onClick={() => setEditingMember(null)} className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-455 text-slate-400 text-xs font-bold uppercase cursor-pointer">Cancelar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. PROJECT FORM MODAL */}
      {projectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white my-8">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-amber-500 font-display">
                {projectForm.id ? "Editar Meta de Projeto" : "Criar Nova Frente de Projeto"}
              </h3>
              <button onClick={() => setProjectForm(null)} className="text-slate-400 hover:text-white text-xs font-mono">X FECHAR</button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-left">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Título do Projeto:</label>
                  <input type="text" required value={projectForm.title || ""} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Ex: Sopão de Inverno da Tropa" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Categoria:</label>
                    <select value={projectForm.category || "social"} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value as any })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white">
                      <option value="social">Ação Comunitária</option>
                      <option value="mission">Capelania e Fé</option>
                      <option value="educative">Formação e Educação</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Meta Financeira (R$):</label>
                    <input type="number" required value={projectForm.targetAmount || ""} onChange={(e) => setProjectForm({ ...projectForm, targetAmount: Number(e.target.value) })} placeholder="15000" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Localização Base SC:</label>
                    <input type="text" required value={projectForm.location || ""} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} placeholder="Florianópolis e Serra" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Semente Progresso (%):</label>
                    <input type="number" min="0" max="100" required value={projectForm.raisedPercent || 0} onChange={(e) => setProjectForm({ ...projectForm, raisedPercent: Number(e.target.value) })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Foto Representativa (Imagem):</label>
                  
                  <div className="flex gap-3 items-start bg-[#121c2d]/30 p-2.5 rounded border border-white/5">
                    {/* Live Thumbnail Preview */}
                    <div className="w-16 h-16 rounded border border-white/10 bg-[#0c1322] flex flex-col items-center justify-center overflow-hidden shrink-0">
                      {projectForm.image ? (
                        <img 
                          src={getCleanImageUrl(projectForm.image)} 
                          alt="Project Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600";
                          }}
                        />
                      ) : (
                        <span className="text-[8px] text-slate-500 text-center px-1 font-mono">Sem Foto</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="pt-1">
                        <span className="block text-[9px] font-bold text-[#f59e0b] uppercase font-mono">Endereço de Imagem da internet (Suporta link do Google Drive):</span>
                        <input 
                          type="text" 
                          value={projectForm.image || ""} 
                          onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })} 
                          placeholder="URL de imagem ou link de compartilhamento do Google Drive" 
                          className="w-full bg-[#121c2d] border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white mt-1 outline-none font-mono focus:border-amber-500/50" 
                        />
                        <p className="text-[8px] text-slate-500 mt-1 font-sans leading-tight">O sistema processa automaticamente links públicos ou de compartilhamento do Google Drive para renderização imediata.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Descrição Básica:</label>
                  <textarea rows={2} required value={projectForm.description || ""} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded p-3 text-xs text-white" />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1 text-slate-400">Necessidades Detalhadas prioritárias:</label>
                  <textarea rows={2} required value={projectForm.detailedNeeds || ""} onChange={(e) => setProjectForm({ ...projectForm, detailedNeeds: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded p-3 text-xs text-white" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="submit" className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer">Salvar Projeto</button>
                <button type="button" onClick={() => setProjectForm(null)} className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 text-xs font-bold uppercase cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. REVISTA FORM MODAL */}
      {revistaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl overflow-y-auto">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white my-8">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-amber-500 font-display">
                {revistaForm.id ? "Editar Publicação" : "Nova Publicação Editorial"}
              </h3>
              <button onClick={() => setRevistaForm(null)} className="text-slate-400 hover:text-white text-xs font-mono">X FECHAR</button>
            </div>

            <form onSubmit={handleSaveRevista} className="space-y-4 text-left">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Título do Editorial:</label>
                  <input type="text" required value={revistaForm.title || ""} onChange={(e) => setRevistaForm({ ...revistaForm, title: e.target.value })} placeholder="Revista Oficial de Capelania" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Volume / Volume Nº:</label>
                    <input type="text" required value={revistaForm.volume || ""} onChange={(e) => setRevistaForm({ ...revistaForm, volume: e.target.value })} placeholder="Vol. 3 Triestral" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Data Lançamento:</label>
                    <input type="date" required value={revistaForm.publishedDate || ""} onChange={(e) => setRevistaForm({ ...revistaForm, publishedDate: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Capa da Publicação (Foto):</label>
                  
                  <div className="flex gap-3 items-start bg-[#121c2d]/30 p-2.5 rounded border border-white/5">
                    {/* Live Thumbnail Preview */}
                    <div className="w-16 h-24 rounded border border-white/10 bg-[#0c1322] flex flex-col items-center justify-center overflow-hidden shrink-0">
                      {revistaForm.coverImage ? (
                        <img 
                          src={getCleanImageUrl(revistaForm.coverImage)} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // If the image fails to load, show a fallback
                            e.currentTarget.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                      ) : (
                        <span className="text-[8px] text-slate-500 text-center px-1 font-mono">Sem Capa</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="pt-1">
                        <span className="block text-[9px] font-bold text-[#f59e0b] uppercase font-mono">Endereço da Capa da internet (Suporta link do Google Drive):</span>
                        <input 
                          type="text" 
                          value={revistaForm.coverImage || ""} 
                          onChange={(e) => setRevistaForm({ ...revistaForm, coverImage: e.target.value })} 
                          placeholder="URL de imagem ou link de compartilhamento do Google Drive" 
                          className="w-full bg-[#121c2d] border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white mt-1 outline-none font-mono focus:border-amber-500/50" 
                        />
                        <p className="text-[8px] text-slate-500 mt-1 font-sans leading-tight">O sistema processa automaticamente links públicos ou de compartilhamento do Google Drive para renderização imediata.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link for Public Download (PDF, Text, etc.) */}
                <div className="p-3 border border-white/10 rounded bg-[#121c2d]/40 space-y-2">
                  <label className="block text-[9px] font-bold text-amber-500 uppercase">Link do Arquivo da Edição para Download:</label>
                  <p className="text-[9px] text-[#94a3b8] leading-tight">Cole o endereço exclusivo do arquivo de leitura (Suporta links compartilhados do Google Drive, Dropbox ou site corporativo):</p>
                  
                  <input
                    type="text"
                    value={revistaForm.downloadUrl || ""}
                    onChange={(e) => setRevistaForm({ ...revistaForm, downloadUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... ou link direto"
                    className="w-full bg-[#121c2d] border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                  <p className="text-[8px] text-slate-500 font-sans leading-tight">Os usuários e generais poderão realizar o download ou ler a edição de forma instantânea e otimizada.</p>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Downloads Iniciais:</label>
                  <input type="number" value={revistaForm.downloads || 0} onChange={(e) => setRevistaForm({ ...revistaForm, downloads: Number(e.target.value) })} className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Descrição Curta:</label>
                  <textarea rows={3} required value={revistaForm.description || ""} onChange={(e) => setRevistaForm({ ...revistaForm, description: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded p-3 text-xs text-white" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="submit" className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer">Salvar Revista</button>
                <button type="button" onClick={() => setRevistaForm(null)} className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 text-xs font-bold uppercase cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. CAROUSEL CONVITE FORM MODAL */}
      {conviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-amber-500 font-display">
                {conviteForm.id ? "Editar Slide de Convite" : "Adicionar Slide de Convite"}
              </h3>
              <button onClick={() => setConviteForm(null)} className="text-slate-400 hover:text-white text-xs font-mono">X FECHAR</button>
            </div>

            <form onSubmit={handleSaveConvite} className="space-y-4 text-left">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Título do Slide:</label>
                  <input type="text" required value={conviteForm.title || ""} onChange={(e) => setConviteForm({ ...conviteForm, title: e.target.value })} placeholder="Recruta Espiritual" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tag Superior (Emblema):</label>
                    <input type="text" required value={conviteForm.tag || ""} onChange={(e) => setConviteForm({ ...conviteForm, tag: e.target.value })} placeholder="TREINAMENTO" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Data / Status de Banner:</label>
                    <input type="text" required value={conviteForm.date || ""} onChange={(e) => setConviteForm({ ...conviteForm, date: e.target.value })} placeholder="Novembro / Sábado" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Fundo Foto URL (Suporta link do Google Drive):</label>
                  <div className="flex gap-2 items-center">
                    {conviteForm.image && (
                      <img 
                        src={getCleanImageUrl(conviteForm.image)} 
                        alt="Preview" 
                        className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600"; }}
                      />
                    )}
                    <input type="text" value={conviteForm.image || ""} onChange={(e) => setConviteForm({ ...conviteForm, image: e.target.value })} placeholder="Cole a URL de imagem ou link de compartilhamento do Google Drive" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-500/50 align-middle" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Descrição Reduzida:</label>
                  <textarea rows={3} required value={conviteForm.description || ""} onChange={(e) => setConviteForm({ ...conviteForm, description: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded p-3 text-xs text-white" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="submit" className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer">Salvar Slide</button>
                <button type="button" onClick={() => setConviteForm(null)} className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 text-xs font-bold uppercase cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. CAROUSEL EVENTO FORM MODAL */}
      {eventoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm shadow-2xl">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-white">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#f59e0b] font-display">
                {eventoForm.id ? "Editar Slide de Ação" : "Adicionar Slide de Ação"}
              </h3>
              <button type="button" onClick={() => setEventoForm(null)} className="text-slate-400 hover:text-white text-xs font-mono">X FECHAR</button>
            </div>

            <form onSubmit={handleSaveEvento} className="space-y-4 text-left">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Título do Evento:</label>
                  <input type="text" required value={eventoForm.title || ""} onChange={(e) => setEventoForm({ ...eventoForm, title: e.target.value })} placeholder="Refeições Coletivas" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tag Emblema:</label>
                    <input type="text" required value={eventoForm.tag || ""} onChange={(e) => setEventoForm({ ...eventoForm, tag: e.target.value })} placeholder="AÇÃO SOCIAL" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Lugar Base:</label>
                    <input type="text" required value={eventoForm.place || ""} onChange={(e) => setEventoForm({ ...eventoForm, place: e.target.value })} placeholder="Serra Catarinense" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">URL Cover / Foto (Suporta link do Google Drive):</label>
                  <div className="flex gap-2 items-center">
                    {eventoForm.image && (
                      <img 
                        src={getCleanImageUrl(eventoForm.image)} 
                        alt="Preview" 
                        className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1461532252243-85f001ca588a?auto=format&fit=crop&q=80&w=600"; }}
                      />
                    )}
                    <input type="text" value={eventoForm.image || ""} onChange={(e) => setEventoForm({ ...eventoForm, image: e.target.value })} placeholder="Cole a URL de imagem ou link de compartilhamento do Google Drive" className="w-full bg-[#121c2d] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-500/50 align-middle" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Descrição Detalhada:</label>
                  <textarea rows={3} required value={eventoForm.description || ""} onChange={(e) => setEventoForm({ ...eventoForm, description: e.target.value })} className="w-full bg-[#121c2d] border border-white/10 rounded p-3 text-xs text-white" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="submit" className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer font-sans leading-none flex items-center justify-center">Salvar Slide</button>
                <button type="button" onClick={() => setEventoForm(null)} className="px-5 py-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 text-xs font-bold uppercase cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F. GENERAL MEMBER DELETION CONFIRMATION DIALOG (LGPD) */}
      {deletingMemberHash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md shadow-2xl animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-rose-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-white text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm uppercase tracking-widest text-rose-400 font-display">
                Direito ao Esquecimento (LGPD)
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Tem absoluta certeza que deseja deletar permanentemente o cadastro do associado <span className="text-white font-bold underline decoration-rose-500/50">"{deletingMemberHash.name}"</span> do banco de dados da UMESC?
              </p>
              <div className="bg-[#070c18] p-3 rounded-lg border border-white/5 text-[9px] text-slate-400 text-left font-mono leading-normal">
                <span className="text-rose-400 font-bold block mb-1">⚠️ AÇÕES IRREVERSÍVEIS REALIZADAS:</span>
                • Exclusão definitiva de todos os registros estatísticos.<br />
                • Inutilização perpétua das credenciais de acesso intranet.<br />
                • Remoção completa de logs pessoais em conformidade jurídica.
              </div>
            </div>
            
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="px-5 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/15"
              >
                Sim, Deletar Cadastro
              </button>
              <button
                type="button"
                onClick={() => setDeletingMemberHash(null)}
                className="px-5 py-2.5 rounded bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 text-slate-300 hover:text-white font-medium text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* G. REVISTA DELETION CONFIRMATION DIALOG */}
      {deletingRevista && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md shadow-2xl animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-rose-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-rose-400 font-display">
                Excluir Edição de Revista
              </h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Deseja realmente excluir a publicação <span className="text-white font-bold font-mono">"{deletingRevista.title}"</span>?
              </p>
              <p className="text-[9px] text-slate-400 leading-normal">
                Esta ação removerá a visibilidade do documento na Home do Portal imediatamente para todos os visitantes e militares.
              </p>
            </div>
            
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={confirmDeleteRevista}
                className="px-4 py-2 hover:bg-rose-500 bg-rose-600 rounded text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Confirmar Exclusão
              </button>
              <button
                type="button"
                onClick={() => setDeletingRevista(null)}
                className="px-4 py-2 bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 rounded text-slate-300 font-bold text-[10px] uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* H. PROJECT DELETION CONFIRMATION DIALOG */}
      {deletingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md shadow-2xl animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-rose-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
              🛡️
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-rose-400 font-display">
                Remover Projeto Social
              </h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Deseja de forma irrevogável remover o projeto <span className="text-white font-bold font-mono">"{deletingProject.title}"</span>?
              </p>
              <p className="text-[9px] text-slate-400 leading-normal">
                O histórico de doações, metas simuladas de PIX e detalhes da iniciativa serão descartados localmente.
              </p>
            </div>
            
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2 hover:bg-rose-500 bg-rose-600 rounded text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Confirmar Remoção
              </button>
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 rounded text-slate-300 font-bold text-[10px] uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I. DIRETORIA MEMBER DELETION CONFIRMATION DIALOG */}
      {deletingDiretoria && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md shadow-2xl animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-rose-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
              👤
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-rose-400 font-display">
                Remover Membro da Diretoria
              </h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Deseja realmente remover <span className="text-white font-bold font-mono">"{deletingDiretoria.name}"</span> da lista da diretoria executiva?
              </p>
              <p className="text-[9px] text-[#94a3b8] leading-normal">
                Essa ação é instantânea e atualizará a listagem pública e o painel de todos os membros associados no portal da UMESC.
              </p>
            </div>
            
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={confirmDeleteDiretoria}
                className="px-4 py-2 hover:bg-rose-500 bg-rose-600 rounded text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Confirmar Remoção
              </button>
              <button
                type="button"
                onClick={() => setDeletingDiretoria(null)}
                className="px-4 py-2 bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 rounded text-slate-300 font-bold text-[10px] uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* J. REGIONAL COORDINATOR DELETION CONFIRMATION DIALOG */}
      {deletingCoordenador && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md shadow-2xl animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-rose-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
              📍
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-rose-400 font-display">
                Remover Coordenador Regional
              </h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Deseja realmente remover o coordenador <span className="text-white font-bold font-mono">"{deletingCoordenador.name}"</span>?
              </p>
              <p className="text-[9px] text-[#94a3b8] leading-normal">
                Essa ação removerá o contato de suporte regional do mapa oficial e do painel de todos os membros.
              </p>
            </div>
            
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={confirmDeleteCoordenador}
                className="px-4 py-2 hover:bg-rose-500 bg-rose-600 rounded text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Confirmar Remoção
              </button>
              <button
                type="button"
                onClick={() => setDeletingCoordenador(null)}
                className="px-4 py-2 bg-[#121c2d] hover:bg-[#1a2a40] border border-white/10 rounded text-slate-300 font-bold text-[10px] uppercase cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
