import React, { useState, useEffect } from "react";
import { 
  Calendar, Users, BookOpen, Layers, Plus, Trash2, Edit, Check, X,
  Search, ShieldAlert, BarChart2, DollarSign, Award, CheckCircle2, AlertTriangle,
  QrCode, UserCheck, Inbox, UploadCloud, Info, RefreshCw, FileText, Star, ShieldCheck, AlertCircle
} from "lucide-react";
import { congressService, Congress, CongressInscription, Workshop, AgendaItem } from "../lib/congressService.ts";

export default function CongressoManager() {
  const [congresses, setCongresses] = useState<Congress[]>([]);
  const [inscriptions, setInscriptions] = useState<CongressInscription[]>([]);
  const [selectedCongressId, setSelectedCongressId] = useState<string>("");
  
  // Tab within Admin Congress area
  const [activeSubTab, setActiveSubTab] = useState<"inscriptions" | "setup" | "checkin">("inscriptions");

  // Inscription filtration
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedIns, setSelectedIns] = useState<CongressInscription | null>(null);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<CongressInscription | null>(null);

  // Duplicate verification modal state
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [dupTab, setDupTab] = useState<"todos" | "cpf" | "nome">("todos");

  // Custom confirmation modal state for accidental clicks
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Form states for creating/editing a congress
  const [isEditingCongress, setIsEditingCongress] = useState(false);
  const [congFormId, setCongFormId] = useState("");
  const [congFormTitle, setCongFormTitle] = useState("");
  const [congFormDesc, setCongFormDesc] = useState("");
  const [congFormDate, setCongFormDate] = useState("");
  const [congFormLoc, setCongFormLoc] = useState("");
  const [congFormPrice, setCongFormPrice] = useState(0);
  const [congFormPixKey, setCongFormPixKey] = useState("");
  const [congFormPixName, setCongFormPixName] = useState("");
  const [congFormStatus, setCongFormStatus] = useState<"open" | "closed">("open");
  const [congFormActive, setCongFormActive] = useState<boolean>(true);

  // Workshop & Agenda setup active creation forms
  const [newWsTitle, setNewWsTitle] = useState("");
  const [newWsSpeaker, setNewWsSpeaker] = useState("");
  const [newWsCapacity, setNewWsCapacity] = useState(50);
  const [newWsTime, setNewWsTime] = useState("Sábado, das 14:00 às 15:30");

  const [newAgDay, setNewAgDay] = useState("Sexta-feira (13/11)");
  const [newAgTime, setNewAgTime] = useState("");
  const [newAgTitle, setNewAgTitle] = useState("");
  const [newAgDesc, setNewAgDesc] = useState("");

  // Check-in desk search/simulation state
  const [checkinTokenInput, setCheckinTokenInput] = useState("");
  const [checkinScanResult, setCheckinScanResult] = useState<{
    success: boolean;
    msg: string;
    ins: CongressInscription | null;
  } | null>(null);

  // Load all initial state on mounting and subscribe to live sync events
  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };
    window.addEventListener("umesc-data-sync", handleSync);
    return () => window.removeEventListener("umesc-data-sync", handleSync);
  }, [selectedCongressId]);

  const loadData = () => {
    const list = congressService.getCongresses();
    setCongresses(list);
    if (list.length > 0 && !selectedCongressId) {
      setSelectedCongressId(list[0].id);
    }
    setInscriptions(congressService.getInscriptions());
  };

  const handleSetFeatured = () => {
    if (!selectedCongressId) return;
    congressService.setFeaturedCongress(selectedCongressId);
    loadData();
  };

  const activeCongress = congresses.find(c => c.id === selectedCongressId);

  // Add/Edit Congress submission
  const handleSaveCongress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!congFormTitle || !congFormDate) return;

    if (isEditingCongress && congFormId) {
      const oldCong = congresses.find(c => c.id === congFormId);
      if (oldCong) {
        const updated: Congress = {
          ...oldCong,
          title: congFormTitle,
          description: congFormDesc,
          date: congFormDate,
          location: congFormLoc,
          price: Number(congFormPrice),
          pixKey: congFormPixKey,
          pixReceiverName: congFormPixName,
          status: congFormStatus,
          isActive: congFormActive
        };
        congressService.updateCongress(updated);
      }
    } else {
      congressService.addCongress({
        title: congFormTitle,
        description: congFormDesc,
        date: congFormDate,
        location: congFormLoc,
        price: Number(congFormPrice),
        pixKey: congFormPixKey,
        pixReceiverName: congFormPixName,
        status: "open",
        isActive: congFormActive
      });
    }

    loadData();
    setIsEditingCongress(false);
    clearCongressForm();
  };

  const clearCongressForm = () => {
    setCongFormId("");
    setCongFormTitle("");
    setCongFormDesc("");
    setCongFormDate("");
    setCongFormLoc("");
    setCongFormPrice(0);
    setCongFormPixKey("");
    setCongFormPixName("");
    setCongFormStatus("open");
    setCongFormActive(true);
  };

  const handleEditCongressStart = (cong: Congress) => {
    setIsEditingCongress(true);
    setCongFormId(cong.id);
    setCongFormTitle(cong.title);
    setCongFormDesc(cong.description);
    setCongFormDate(cong.date);
    setCongFormLoc(cong.location);
    setCongFormPrice(cong.price);
    setCongFormPixKey(cong.pixKey);
    setCongFormPixName(cong.pixReceiverName);
    setCongFormStatus(cong.status);
    setCongFormActive(cong.isActive !== false);
  };

  const handleDeleteCongress = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Congresso?",
      message: "Tem certeza que deseja excluir permanentemente este congresso e todas as suas inscrições? Esta ação não pode ser desfeita e removerá todos os registros associados permanentemente do fardamento catarinense.",
      actionLabel: "Sim, Excluir permanentemente",
      onConfirm: () => {
        congressService.deleteCongress(id);
        if (selectedCongressId === id) {
          setSelectedCongressId("");
        }
        loadData();
        setConfirmModal(null);
      }
    });
  };

  // Workshop management inside active congress
  const handleAddWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCongress || !newWsTitle || !newWsSpeaker) return;

    const newWs: Workshop = {
      id: "ws-" + Math.random().toString(36).substring(2, 7),
      title: newWsTitle,
      speaker: newWsSpeaker,
      capacity: Number(newWsCapacity),
      registeredCount: 0,
      timeSlot: newWsTime
    };

    const updated: Congress = {
      ...activeCongress,
      workshops: [...activeCongress.workshops, newWs]
    };

    congressService.updateCongress(updated);
    loadData();
    setNewWsTitle("");
    setNewWsSpeaker("");
    setNewWsCapacity(50);
  };

  const handleDeleteWorkshop = (wsId: string) => {
    if (!activeCongress) return;
    setConfirmModal({
      isOpen: true,
      title: "Remover Workshop?",
      message: "Tem certeza que deseja remover este workshop selecionável? As vagas já ocupadas serão liberadas e as inscrições com este item serão atualizadas automaticamente.",
      actionLabel: "Sim, Remover Workshop",
      onConfirm: () => {
        const updated: Congress = {
          ...activeCongress,
          workshops: activeCongress.workshops.filter(w => w.id !== wsId)
        };
        // For safety, clear references in inscriptions too
        const updatedInscriptions = inscriptions.map(i => {
          if (i.congressId === activeCongress.id) {
            return {
              ...i,
              selectedWorkshopIds: i.selectedWorkshopIds.filter(id => id !== wsId)
            };
          }
          return i;
        });
        congressService.saveInscriptions(updatedInscriptions);
        congressService.updateCongress(updated);
        loadData();
        setConfirmModal(null);
      }
    });
  };

  // Agenda list management
  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCongress || !newAgTime || !newAgTitle) return;

    const newAg: AgendaItem = {
      id: "ag-" + Math.random().toString(36).substring(2, 7),
      day: newAgDay,
      time: newAgTime,
      title: newAgTitle,
      description: newAgDesc || undefined
    };

    // Sort agenda item linearly by hour
    const updatedAgenda = [...activeCongress.agenda, newAg].sort((a,b) => a.time.localeCompare(b.time));

    const updated: Congress = {
      ...activeCongress,
      agenda: updatedAgenda
    };

    congressService.updateCongress(updated);
    loadData();
    setNewAgTime("");
    setNewAgTitle("");
    setNewAgDesc("");
  };

  const handleDeleteAgenda = (agId: string) => {
    if (!activeCongress) return;
    const updated: Congress = {
      ...activeCongress,
      agenda: activeCongress.agenda.filter(a => a.id !== agId)
    };
    congressService.updateCongress(updated);
    loadData();
  };

  // Inscription processing status flags
  const handleSetInscriptionStatus = (insId: string, status: "pendente" | "em_analise" | "pago" | "recusado") => {
    const updated = congressService.updateInscriptionStatus(insId, status);
    if (updated) {
      setInscriptions(congressService.getInscriptions());
      if (selectedIns && selectedIns.id === insId) {
        setSelectedIns(updated);
      }
      if (selectedReceiptForPreview && selectedReceiptForPreview.id === insId) {
        setSelectedReceiptForPreview(updated);
      }
    }
  };

  const handleToggleCheckin = (insId: string) => {
    const updated = congressService.toggleCheckIn(insId);
    if (updated) {
      setInscriptions(congressService.getInscriptions());
      if (selectedIns && selectedIns.id === insId) {
        setSelectedIns(updated);
      }
      if (checkinScanResult && checkinScanResult.ins?.id === insId) {
        setCheckinScanResult({
          success: true,
          msg: updated.checkedIn ? "Check-in realizado com sucesso!" : "Check-in cancelado.",
          ins: updated
        });
      }
    }
  };

  const handleDeleteInscription = (insId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Inscrição?",
      message: "Tem certeza que deseja excluir permanentemente esta inscrição de evento? Seus workshops liberados retornarão à cota geral de assentos livres.",
      actionLabel: "Sim, Deletar Inscrição",
      onConfirm: () => {
        const filtered = inscriptions.filter(i => i.id !== insId);
        // Re-calculate seats for workshops
        const targetIns = inscriptions.find(i => i.id === insId);
        if (targetIns) {
          const cong = congresses.find(c => c.id === targetIns.congressId);
          if (cong) {
            cong.workshops = cong.workshops.map(ws => {
              if (targetIns.selectedWorkshopIds.includes(ws.id)) {
                return { ...ws, registeredCount: Math.max(0, ws.registeredCount - 1) };
              }
              return ws;
            });
            congressService.updateCongress(cong);
          }
        }
        congressService.saveInscriptions(filtered);
        loadData();
        setSelectedIns(null);
        setConfirmModal(null);
      }
    });
  };

  // Helper to handle deleting a duplicate inscription record
  const handleDeleteDuplicateEntry = (insId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Inscrição Duplicada?",
      message: `Tem certeza que deseja excluir permanentemente esta inscrição duplicada de "${memberName}" (${insId}) deste evento? Os workshops vinculados serão atualizados.`,
      actionLabel: "Sim, Excluir Duplicada",
      onConfirm: () => {
        const filtered = inscriptions.filter(i => i.id !== insId);
        const targetIns = inscriptions.find(i => i.id === insId);
        if (targetIns) {
          const cong = congresses.find(c => c.id === targetIns.congressId);
          if (cong) {
            cong.workshops = cong.workshops.map(ws => {
              if (targetIns.selectedWorkshopIds.includes(ws.id)) {
                return { ...ws, registeredCount: Math.max(0, ws.registeredCount - 1) };
              }
              return ws;
            });
            congressService.updateCongress(cong);
          }
        }
        congressService.saveInscriptions(filtered);
        loadData();
        if (selectedIns?.id === insId) setSelectedIns(null);
        setConfirmModal(null);
      }
    });
  };

  // Analyze duplicates strictly for the active selected congress
  const getCongressDuplicates = (congressId: string) => {
    const congressInscriptions = inscriptions.filter(i => i.congressId === congressId);
    
    // Group by cleaned CPF (digits only)
    const cpfMap: Record<string, CongressInscription[]> = {};
    // Group by normalized Name (lowercase, trimmed)
    const nameMap: Record<string, CongressInscription[]> = {};

    congressInscriptions.forEach(ins => {
      const cleanCpf = ins.memberCpf ? ins.memberCpf.replace(/\D/g, "") : "";
      if (cleanCpf && cleanCpf.length >= 8 && cleanCpf !== "00000000000") {
        if (!cpfMap[cleanCpf]) cpfMap[cleanCpf] = [];
        cpfMap[cleanCpf].push(ins);
      }

      const cleanName = ins.memberName ? ins.memberName.trim().toLowerCase().replace(/\s+/g, " ") : "";
      if (cleanName && cleanName.length >= 3) {
        if (!nameMap[cleanName]) nameMap[cleanName] = [];
        nameMap[cleanName].push(ins);
      }
    });

    const cpfGroups = Object.entries(cpfMap)
      .filter(([_, list]) => list.length > 1)
      .map(([key, list]) => ({
        type: "cpf" as const,
        key,
        displayValue: list[0].memberCpf,
        inscriptions: list
      }));

    const nameGroups = Object.entries(nameMap)
      .filter(([_, list]) => list.length > 1)
      .map(([key, list]) => ({
        type: "nome" as const,
        key,
        displayValue: list[0].memberName,
        inscriptions: list
      }));

    const dupIds = new Set<string>();
    cpfGroups.forEach(g => g.inscriptions.forEach(i => dupIds.add(i.id)));
    nameGroups.forEach(g => g.inscriptions.forEach(i => dupIds.add(i.id)));

    return {
      cpfGroups,
      nameGroups,
      totalDuplicateEntries: dupIds.size,
      dupIds
    };
  };

  // Manual Check-in Simulator by Input Token
  const handleCheckinByToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinTokenInput) return;

    // Search by either ID (ex: INS-AZX87) or token (ex: UMESC-35-AZX87-pago)
    const tokenClean = checkinTokenInput.trim().toUpperCase();
    const found = inscriptions.find(ins => 
      ins.id === tokenClean || 
      (ins.qrCodeToken || "").includes(tokenClean) ||
      (ins.memberCpf || "").replace(/\D/g, "") === tokenClean.replace(/\D/g, "")
    );

    if (!found) {
      setCheckinScanResult({
        success: false,
        msg: `Nenhuma inscrição encontrada correspondente a "${checkinTokenInput}".`,
        ins: null
      });
      return;
    }

    if (found.paymentStatus !== "pago") {
      setCheckinScanResult({
        success: false,
        msg: `⚠️ ATENÇÃO RECEPÇÃO: Pagamento pendente (${found.paymentStatus.toUpperCase()}). Libere apenas após confirmação financeira.`,
        ins: found
      });
      return;
    }

    setCheckinScanResult({
      success: true,
      msg: found.checkedIn ? "Inscrição já validada previamente!" : "Registro válido! Pronto para credenciamento.",
      ins: found
    });
  };

  // Compute calculated metrics for dashboard cards
  const filteredInscriptions = inscriptions.filter(ins => {
    // Congress match
    if (ins.congressId !== selectedCongressId) return false;
    
    // Status filter
    if (statusFilter !== "todos" && ins.paymentStatus !== statusFilter) return false;

    // Search term match
    const sLower = searchTerm.toLowerCase();
    return ins.memberName.toLowerCase().includes(sLower) || 
           ins.id.toLowerCase().includes(sLower) || 
           ins.memberCpf.includes(sLower) ||
           ins.memberEmail.toLowerCase().includes(sLower) ||
           ins.memberRank.toLowerCase().includes(sLower);
  });

  const totalInscriptions = inscriptions.filter(i => i.congressId === selectedCongressId).length;
  const approvedPayments = inscriptions.filter(i => i.congressId === selectedCongressId && i.paymentStatus === "pago");
  const pendingPayments = inscriptions.filter(i => i.congressId === selectedCongressId && i.paymentStatus === "em_analise");
  const unsubmittedPayments = inscriptions.filter(i => i.congressId === selectedCongressId && i.paymentStatus === "pendente");
  
  const estimatedRevenue = approvedPayments.reduce((acc, current) => {
    const cong = congresses.find(c => c.id === current.congressId);
    return acc + (cong?.price || 0);
  }, 0);

  return (
    <div className="space-y-6 text-left">
      
      <div className="bg-[#111d2e] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 w-full md:w-auto">
          <label className="block text-[9px] uppercase font-bold tracking-widest text-amber-500 font-mono">Gerência de Eventos Integrados</label>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            <select
              value={selectedCongressId}
              onChange={(e) => {
                setSelectedCongressId(e.target.value);
                setSelectedIns(null);
                setCheckinScanResult(null);
              }}
              className="py-1.5 px-3 bg-[#0a101a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-bold w-full sm:w-auto min-w-[200px]"
            >
              <option value="">-- Selecione um Congresso --</option>
              {congresses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status === "open" ? "Inscrições Abertas" : "Inscrições Fechadas"}){c.isActive === false ? " - [INATIVO/OCULTO]" : ""}
                </option>
              ))}
            </select>
            
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setIsEditingCongress(false);
                  clearCongressForm();
                }}
                className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 hover:text-black rounded-lg transition-colors font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shrink-0 flex-1 sm:flex-none"
                title="Novo Congresso"
              >
                <Plus className="w-4 h-4" /> Novo
              </button>

              {activeCongress && (
                <button
                  type="button"
                  onClick={handleSetFeatured}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border shrink-0 flex-1 sm:flex-none ${
                    activeCongress.isFeatured
                      ? "bg-amber-500/15 border-amber-500/35 text-amber-400 font-extrabold shadow-sm shadow-amber-500/5 hover:bg-amber-500/20"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                  }`}
                  title={activeCongress.isFeatured ? "Destaque Ativo no Portal Inicial" : "Definir como Destaque Ativo no Portal Inicial"}
                >
                  <Star className={`w-3.5 h-3.5 ${activeCongress.isFeatured ? "text-amber-400 fill-amber-400 animate-pulse" : "text-slate-400"}`} />
                  <span>{activeCongress.isFeatured ? "Destaque" : "Destaque"}</span>
                </button>
              )}

              {activeCongress && (
                <button
                  type="button"
                  onClick={() => handleEditCongressStart(activeCongress)}
                  className="py-2 px-3 rounded-lg text-xs font-bold bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 border border-white/10 text-slate-350 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                  title="Editar parâmetros do Congresso Selecionado"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Toolbar between sectors */}
        {selectedCongressId && (
          <div className="flex bg-[#0a111a] rounded-lg p-0.5 border border-white/5 self-stretch md:self-auto justify-start sm:justify-around overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSubTab("inscriptions")}
              className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === "inscriptions"
                  ? "bg-amber-500 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Inscritos ({totalInscriptions})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("setup")}
              className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === "setup"
                  ? "bg-amber-500 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Agenda e Oficinas
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("checkin")}
              className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeSubTab === "checkin"
                  ? "bg-amber-500 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> Portaria Check-In
            </button>
          </div>
        )}
      </div>

      {/* METRIC CARDS / STATS HIGHLIGHT */}
      {selectedCongressId && activeCongress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-[#111d2e] p-4 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450">Inscrições Totais</span>
              <span className="text-xl font-bold text-white font-mono">{totalInscriptions}</span>
            </div>
          </div>

          <div className="bg-[#111d2e] p-4 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#102a1f] text-teal-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450">Confirmados (Pago)</span>
              <span className="text-xl font-bold text-teal-400 font-mono">{approvedPayments.length}</span>
            </div>
          </div>

          <div className="bg-[#111d2e] p-4 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#2e1d0f] text-amber-550 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450">Em Análise</span>
              <span className="text-xl font-bold text-amber-500 font-mono">{pendingPayments.length}</span>
            </div>
          </div>

          <div className="bg-[#111d2e] p-4 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-rose-500/10 text-rose-455 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450">Arrecadação Confirmada</span>
              <span className="text-xl font-bold text-rose-350 font-mono">
                R$ {estimatedRevenue.toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUB-SECTION 1: INSCRIPTION LIST AND APPROVAL TABLE */}
      {selectedCongressId && activeSubTab === "inscriptions" && activeCongress && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List panel */}
          <div className="lg:col-span-8 bg-[#131f2f] rounded-xl border border-white/5 p-4 space-y-4">
            
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar por Nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#09101a] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {(() => {
                  const dupStats = getCongressDuplicates(selectedCongressId);
                  return (
                    <button
                      type="button"
                      onClick={() => setIsDupModalOpen(true)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                        dupStats.totalDuplicateEntries > 0
                          ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/40 shadow-sm"
                          : "bg-[#09101a] hover:bg-slate-800 text-slate-300 border-white/10"
                      }`}
                      title="Verificar duplicidades de Nome e CPF no evento"
                    >
                      <ShieldAlert className={`w-3.5 h-3.5 ${dupStats.totalDuplicateEntries > 0 ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
                      <span>Verificar Duplicidades</span>
                      {dupStats.totalDuplicateEntries > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                          {dupStats.totalDuplicateEntries}
                        </span>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* Status Filter pill group */}
              <div className="flex bg-[#0a111a] rounded-lg p-0.5 border border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  { id: "todos", label: "Tudo" },
                  { id: "pendente", label: "Pend." },
                  { id: "em_analise", label: "Em Análise" },
                  { id: "pago", label: "Pagas" },
                  { id: "recusado", label: "Recus." }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.id);
                      setSelectedIns(null);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded cursor-pointer shrink-0 ${
                      statusFilter === item.id
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "text-slate-450 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Inscriptos Table / Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-200 border-collapse min-w-[500px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[9px] tracking-wider bg-[#0a111a]">
                    <th className="p-3">Inscrição</th>
                    <th className="p-3">Membro</th>
                    <th className="p-3 hidden md:table-cell">Workshop Escolhido</th>
                    <th className="p-3">Status Pagamento</th>
                    <th className="p-3 text-center hidden sm:table-cell">Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInscriptions.map((ins) => {
                    const isSelected = selectedIns && selectedIns.id === ins.id;
                    return (
                      <tr
                        key={ins.id}
                        onClick={() => {
                          setSelectedIns(ins);
                          // Scroll to details on mobile screens
                          if (window.innerWidth < 1024) {
                            setTimeout(() => {
                              const el = document.getElementById("inscription-details-panel");
                              el?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 100);
                          }
                        }}
                        className={`border-b border-white/5 hover:bg-[#1a2d42] cursor-pointer transition-colors ${
                          isSelected ? "bg-[#182b3d] border-amber-500/20" : ""
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-amber-500">
                          {ins.id}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{ins.memberName}</div>
                          <div className="text-[10px] text-slate-400">{ins.memberRank} • Fone: {ins.memberPhone}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <div className="max-w-[180px] truncate" title={ins.selectedWorkshopIds.join(", ")}>
                            {ins.selectedWorkshopIds.length === 0 ? (
                              <span className="text-red-400 italic">Nenhum selecionado</span>
                            ) : (
                              `Selecionou ${ins.selectedWorkshopIds.length} sala(s)`
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            ins.paymentStatus === "pago"
                              ? "bg-teal-500/10 text-teal-400"
                              : ins.paymentStatus === "em_analise"
                                ? "bg-amber-500/15 text-amber-400"
                                : ins.paymentStatus === "recusado"
                                  ? "bg-rose-500/10 text-rose-455"
                                  : "bg-slate-800 text-slate-400"
                          }`}>
                            {ins.paymentStatus === "em_analise" ? "Em Análise" : ins.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          {ins.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded font-bold uppercase">
                              <UserCheck className="w-3 h-3 text-teal-400" /> Presença
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInscriptions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                        Nenhum registro de inscrição encontrado para os parâmetros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right details / action inspector */}
          <div id="inscription-details-panel" className="lg:col-span-4 space-y-4 scroll-mt-6">
            
            {selectedIns ? (
              <div className="bg-[#111d2e] border border-white/5 rounded-xl p-5 space-y-5">
                
                {/* ID Header card badge */}
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] font-black uppercase text-amber-500 font-mono">Ficha de Inscrição Oficial</span>
                    <h4 className="text-base font-black text-white font-display leading-none mt-1">{selectedIns.id}</h4>
                  </div>
                  
                  <button
                    onClick={() => setSelectedIns(null)}
                    className="p-1 text-slate-500 hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Member detail list */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-3.5 pb-2 border-b border-white/5">
                    {selectedIns.memberPhotoUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 bg-slate-900 shrink-0 shadow-lg">
                        <img src={selectedIns.memberPhotoUrl} alt={selectedIns.memberName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-white/10 bg-slate-900/40 shrink-0 flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-450 font-bold">Militar de Santa Catarina</span>
                      <b className="text-white text-sm block leading-tight">{selectedIns.memberName}</b>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">{selectedIns.memberRank}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">CPF</span>
                      <span className="font-mono text-white tracking-widest">{selectedIns.memberCpf}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Telefone</span>
                      <span className="font-mono text-white">{selectedIns.memberPhone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">E-mail</span>
                    <span className="text-white truncate block">{selectedIns.memberEmail}</span>
                  </div>

                  <div className="p-3 bg-[#0a1019] rounded-lg border border-white/5 space-y-1">
                    <span className="block text-[8px] uppercase tracking-wider text-amber-500 font-bold font-mono">Oficinas / Workshops Alocados:</span>
                    {selectedIns.selectedWorkshopIds.length === 0 ? (
                      <p className="text-[10px] italic text-slate-400">Nenhum workshop selecionado.</p>
                    ) : (
                      <ul className="list-disc pl-3 text-[10px] text-slate-300 space-y-1">
                        {selectedIns.selectedWorkshopIds.map(wsId => {
                          const matchedWs = activeCongress.workshops.find(w => w.id === wsId);
                          return (
                            <li key={wsId}>
                              <strong>{matchedWs?.title || "Workshop Removido"}</strong>
                              <span className="block text-slate-500 text-[8.5px] leading-tight font-mono">{matchedWs?.speaker} ({matchedWs?.timeSlot})</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* PAYMENT PROOF INBOX DECODING CARD (conferencia de comprovantes) */}
                  <div className="p-3 bg-[#0a1019] rounded-lg border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] uppercase tracking-wider text-teal-400 font-bold font-mono">Comprovante de Envio:</span>
                      
                      {selectedIns.paymentProofUrl ? (
                        <span className="text-[8px] px-1 bg-teal-500/20 text-teal-400 font-mono uppercase font-bold rounded">RECEBIDO</span>
                      ) : (
                        <span className="text-[8px] px-1 bg-rose-500/20 text-rose-455 font-mono uppercase font-bold rounded">AUSENTE</span>
                      )}
                    </div>

                    {selectedIns.paymentProofUrl ? (
                      <div className="border border-white/5 p-2 bg-[#0c1421] rounded relative">
                        {/* Interactive layout simulation representing digital PIX receipt */}
                        <div className="space-y-1 font-mono text-[9.5px]">
                          <div className="flex justify-between border-b border-white/5 pb-1 text-slate-500 uppercase font-black text-[7.5px]">
                            <span>Banco Emissor</span>
                            <span>PIX UMESC SC</span>
                          </div>
                          <div className="text-white font-extrabold truncate">{selectedIns.paymentProofName || "comprovante_transacao.pdf"}</div>
                          <div className="text-[8px] text-teal-400 mt-1">✓ Transação aprovada e registrada</div>
                          <div className="text-[8.5px] text-slate-400 mt-1">Valor Unitário: <b className="text-white font-bold">{activeCongress.price === 0 ? "Entrada Franca" : "R$ " + activeCongress.price.toFixed(2)}</b></div>
                          <div className="text-[8.5px] text-slate-400">Autenticação: <span className="text-slate-500 font-bold">MD5-B3F9A{selectedIns.id}C9482</span></div>
                        </div>

                        {/* Simulate checking click preview */}
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForPreview(selectedIns)}
                          className="w-full mt-2 py-1 bg-[#0f1d30] border border-white/10 rounded font-mono text-[8px] hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-teal-400 text-center font-bold"
                        >
                          🔍 Ampliar Imagem do Recibo
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] italic text-slate-500">
                        O membro ainda não encaminhou ou não anexou o comprovante neste formulário.
                      </p>
                    )}
                  </div>

                  {/* Portaria Check-In current status block */}
                  <div className="p-3 bg-slate-900/40 rounded-lg border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Acesso à Portaria</span>
                      <strong className="text-white text-[11px] font-bold">
                        {selectedIns.checkedIn ? "Membro já Credenciado" : "Ausente na Entrada"}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCheckin(selectedIns.id)}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded cursor-pointer transition-all ${
                        selectedIns.checkedIn
                          ? "bg-rose-500/15 text-rose-350 hover:bg-rose-550/30"
                          : "bg-teal-500/15 text-teal-400 hover:bg-teal-500/30"
                      }`}
                    >
                      {selectedIns.checkedIn ? "Zerar" : "Liberar"}
                    </button>
                  </div>

                </div>

                {/* ACTION TRIGGER BUTTONS */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-450 font-bold font-mono">Moderar Status:</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSetInscriptionStatus(selectedIns.id, "pago")}
                      className={`py-2 rounded font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        selectedIns.paymentStatus === "pago"
                          ? "bg-teal-500 text-slate-950 font-black shadow"
                          : "bg-[#0b1b1e] hover:bg-[#132c30] text-teal-400 border border-teal-500/20"
                      }`}
                    >
                      <Check className="w-4 h-4" /> Aprovar Pago
                    </button>
                    <button
                      onClick={() => handleSetInscriptionStatus(selectedIns.id, "recusado")}
                      className={`py-2 rounded font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        selectedIns.paymentStatus === "recusado"
                          ? "bg-rose-600 text-white font-black shadow"
                          : "bg-[#1f0b0e] hover:bg-[#341116] text-rose-350 border border-rose-500/20"
                      }`}
                    >
                      <X className="w-4 h-4" /> Recusar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSetInscriptionStatus(selectedIns.id, "em_analise")}
                      className="py-2 bg-[#1b2a3a] hover:bg-[#25394f] text-slate-200 rounded font-bold text-xs transition-all cursor-pointer"
                    >
                      Análise Comprovante
                    </button>
                    <button
                      onClick={() => handleDeleteInscription(selectedIns.id)}
                      className="py-2 bg-slate-900 hover:bg-rose-955/20 text-rose-350 hover:text-rose-450 border border-white/5 rounded font-bold text-xs transition-all cursor-pointer"
                    >
                      Excluir Inscrição
                    </button>
                  </div>

                </div>

                {/* QR Confirmation ticket decoding preview */}
                <div className="border border-white/5 p-4 bg-[#0a101b] rounded-xl text-center space-y-2">
                  <div className="mx-auto w-24 h-24 bg-white p-1 rounded-lg flex items-center justify-center">
                    {/* Simulated pixelated QR pattern with custom layout */}
                    <div className="w-full h-full border border-slate-900 grid grid-cols-8 gap-[1px] bg-white p-1">
                      {Array.from({ length: 64 }).map((_, idx) => {
                        // Pattern generators to represent robust QR decoding tokens
                        const fillBlack = (idx * 7 + 13) % 5 === 0 || 
                                           (idx < 8 && idx % 3 === 0) || 
                                           (idx > 56 && idx % 2 === 0) ||
                                           (idx % 8 === 0 && idx < 32);
                        return (
                          <span
                            key={idx}
                            className={`w-full h-full block rounded-[1px] ${fillBlack ? "bg-slate-900" : "bg-white"}`}
                          ></span>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Token de Segurança de Portaria</span>
                    <span className="block font-mono text-[9px] text-slate-300 font-extrabold select-all">{selectedIns.qrCodeToken}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#111d2e] border border-white/5 rounded-xl p-8 text-center text-slate-500 italic">
                💡 Selecione um inscrito na listagem do congresso para auditar comprovantes enviado por PIX e homologar inscrições.
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-SECTION 2: CONGRESS CONFIGURATIONS, AGENDA AND WORKSHOPS LIST */}
      {selectedCongressId && activeSubTab === "setup" && activeCongress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Agenda schedules column config */}
          <div className="bg-[#131f2f] rounded-xl border border-white/5 p-4 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-display border-b border-white/5 pb-2 flex items-center justify-between">
              <span>Grade de Atividades (Agenda)</span>
              <span className="text-[10px] text-amber-500 font-mono">{activeCongress.agenda.length} itens</span>
            </h4>

            {/* List agenda items with delete trigger */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {activeCongress.agenda.map((ag) => (
                <div key={ag.id} className="p-3 bg-[#0a111a] border border-white/5 rounded-lg flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex gap-1.5 items-center">
                      <span className="px-1.5 py-0.5 bg-slate-900/60 text-slate-400 rounded text-[8px] font-bold uppercase font-mono">{ag.day}</span>
                      <strong className="text-xs text-amber-400 font-mono">{ag.time}h</strong>
                    </div>
                    <b className="text-white text-xs block leading-tight">{ag.title}</b>
                    {ag.description && <p className="text-[10.5px] text-slate-450 leading-relaxed font-semibold">{ag.description}</p>}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteAgenda(ag.id)}
                    className="p-1 hover:bg-rose-950/20 text-slate-450 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {activeCongress.agenda.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs italic">
                  Nenhum cronograma ou atividade agendada. Insira um novo item abaixo.
                </div>
              )}
            </div>

            {/* Form to submit and append new agenda block */}
            <form onSubmit={handleAddAgenda} className="p-3.5 bg-slate-900/35 border border-white/5 rounded-lg space-y-3">
              <span className="block text-[9.5px] font-black uppercase text-amber-400 font-mono">Inserir Atividade:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Dia / Data</label>
                  <input
                    type="text"
                    value={newAgDay}
                    onChange={(e) => setNewAgDay(e.target.value)}
                    placeholder="Sexta-feira 13/11"
                    className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Horário (HH:MM)</label>
                  <input
                    type="text"
                    value={newAgTime}
                    onChange={(e) => setNewAgTime(e.target.value)}
                    placeholder="19:30"
                    className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Título da Solenidade/Conferência</label>
                <input
                  type="text"
                  value={newAgTitle}
                  onChange={(e) => setNewAgTitle(e.target.value)}
                  placeholder="Selecione um título oficial..."
                  className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Detalhes (Opcional)</label>
                <textarea
                  value={newAgDesc}
                  onChange={(e) => setNewAgDesc(e.target.value)}
                  placeholder="Articulação voluntária de segurança..."
                  className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white h-12 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                Incluir na Agenda do Congresso
              </button>
            </form>

          </div>

          {/* Active selectable workshops listing configuration */}
          <div className="bg-[#131f2f] rounded-xl border border-white/5 p-4 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-display border-b border-white/5 pb-2 flex items-center justify-between">
              <span>Workshops Selecionáveis</span>
              <span className="text-[10px] text-amber-500 font-mono">{activeCongress.workshops.length} salas</span>
            </h4>

            {/* List workshops with delete button */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {activeCongress.workshops.map((ws) => {
                const occupancyPercent = Math.min(100, Math.round((ws.registeredCount / ws.capacity) * 100));
                
                return (
                  <div key={ws.id} className="p-3 bg-[#0a111a] border border-white/5 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <b className="text-white text-xs block leading-tight">{ws.title}</b>
                        <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Ministrante: {ws.speaker}</p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteWorkshop(ws.id)}
                        className="p-1 hover:bg-rose-950/20 text-slate-450 hover:text-rose-400 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                      <span>🕒 {ws.timeSlot}</span>
                      <span>Ocupado: <strong className="text-white">{ws.registeredCount}</strong> de {ws.capacity} vagas</span>
                    </div>

                    {/* Progress occupancy slider bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div 
                        className={`h-full transition-all rounded ${
                          occupancyPercent >= 90 ? "bg-red-500" : occupancyPercent >= 60 ? "bg-amber-500" : "bg-teal-500"
                        }`}
                        style={{ width: `${occupancyPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {activeCongress.workshops.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs italic">
                  Nenhum workshop configurado para inscrições. Adicione salas temáticas no form abaixo.
                </div>
              )}
            </div>

            {/* Form to submit and append new workshop block */}
            <form onSubmit={handleAddWorkshop} className="p-3.5 bg-slate-900/35 border border-white/5 rounded-lg space-y-3">
              <span className="block text-[9.5px] font-black uppercase text-amber-400 font-mono font-black">Criar Workshop Temático:</span>
              
              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Título do Workshop</label>
                <input
                  type="text"
                  value={newWsTitle}
                  onChange={(e) => setNewWsTitle(e.target.value)}
                  placeholder="ex: Saúde Mental Militar e Prevenção de Fobia"
                  className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Palestrante / Moderador</label>
                  <input
                    type="text"
                    value={newWsSpeaker}
                    onChange={(e) => setNewWsSpeaker(e.target.value)}
                    placeholder="Tenente Roberto"
                    className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Capacidade de Público (Vagas)</label>
                  <input
                    type="number"
                    value={newWsCapacity}
                    onChange={(e) => setNewWsCapacity(Number(e.target.value))}
                    placeholder="60"
                    className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white font-mono"
                    min={5}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Horário & Período slot</label>
                <input
                  type="text"
                  value={newWsTime}
                  onChange={(e) => setNewWsTime(e.target.value)}
                  placeholder="Sábado, das 14:00 às 15:30"
                  className="w-full px-2.5 py-1.5 bg-[#09101a] border border-white/10 rounded text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                Criar Workshop e Registrar Alvo
              </button>
            </form>

          </div>

        </div>
      )}

      {/* SUB-SECTION 3: PORTARIA CHECK-IN & RECEPTION SCAN DESK SIMULATOR */}
      {selectedCongressId && activeSubTab === "checkin" && activeCongress && (
        <div className="max-w-2xl mx-auto bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-6">
          
          <div className="text-center space-y-2 select-none">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider font-display text-white">
              Guarda de Credenciamento & Reception Check-in Desk
            </h3>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Consórcio oficial da recepção da UMESC. Digite a identidade do Token de Inscrição gerado no ticket móvel do militar para liberar presença oficial e emitir crachá.
            </p>
          </div>

          {/* Form to paste or write the ticket token ID */}
          <form onSubmit={handleCheckinByToken} className="space-y-3 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={checkinTokenInput}
                onChange={(e) => {
                  setCheckinTokenInput(e.target.value);
                  setCheckinScanResult(null);
                }}
                className="w-full sm:flex-1 px-4 py-2 bg-[#09101a] border border-white/10 rounded-lg text-xs font-mono font-extrabold text-white uppercase tracking-wider focus:outline-none focus:border-amber-500"
                placeholder="Exemplo: INS-AZX87"
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 hover:text-black rounded-lg text-xs uppercase font-black tracking-widest cursor-pointer transition-colors shrink-0"
              >
                Pesquisar Registro
              </button>
            </div>

            {/* Quick pre-seeded references buttons for direct simulation */}
            <div className="text-left">
              <span className="text-[8.5px] uppercase font-bold text-slate-500 font-mono">Simuladores Rápidos de Ticket (Clique para colar):</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {inscriptions.filter(i => i.congressId === selectedCongressId).slice(0, 3).map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => {
                      setCheckinTokenInput(demo.id);
                      setCheckinScanResult(null);
                    }}
                    className="px-2.5 py-1 rounded bg-[#0b1320] text-[#cfb25a] hover:text-white border border-[#2b2713] text-[9.5px] font-mono cursor-pointer transition-colors"
                  >
                    Ticket {demo.id} ({demo.paymentStatus.toUpperCase()})
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Check-in scanning results output panel */}
          {checkinScanResult && (
            <div className={`p-4 rounded-xl border text-left space-y-4 animate-fadeIn transition-colors ${
              checkinScanResult.success 
                ? "bg-[#0b1e1d] border-teal-500/25 text-teal-300" 
                : "bg-[#1f0b0e] border-rose-500/25 text-rose-350"
            }`}>
              
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-full ${checkinScanResult.success ? "bg-teal-500/10" : "bg-rose-500/10"}`}>
                    {checkinScanResult.success ? (
                      <Check className="w-5 h-5 text-teal-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-450" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white font-display uppercase tracking-wide">
                      {checkinScanResult.success ? "Ingresso Válido para Acesso!" : "Retido na Portaria"}
                    </h4>
                    <p className={`text-xs mt-0.5 ${checkinScanResult.success ? "text-slate-350" : "text-rose-300"} font-bold`}>
                      {checkinScanResult.msg}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckinScanResult(null);
                    setCheckinTokenInput("");
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Matched ticket item values */}
              {checkinScanResult.ins && (
                <div className="p-4 bg-[#0a101b] border border-white/5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs text-slate-400">
                    <div>
                      <span>Inscrito:</span>
                      <strong className="text-white block mt-0.5">{checkinScanResult.ins.memberName}</strong>
                      <span className="text-[10px] text-slate-500">{checkinScanResult.ins.memberRank} • CPF {checkinScanResult.ins.memberCpf}</span>
                    </div>
                    <div className="text-right">
                      <span className="block">Status:</span>
                      <strong className={`uppercase font-mono block mt-0.5 ${checkinScanResult.ins.paymentStatus === "pago" ? "text-teal-400" : "text-rose-400"}`}>
                        {checkinScanResult.ins.paymentStatus}
                      </strong>
                    </div>
                  </div>

                  {/* Chosen workshops summaries */}
                  <div className="space-y-1.5 text-xs">
                    <span className="block text-[8.5px] uppercase font-bold text-amber-500 font-mono">Salas e Atividades Reservadas:</span>
                    <ul className="list-disc pl-4 text-slate-300 font-semibold space-y-1 text-[10.5px]">
                      {checkinScanResult.ins.selectedWorkshopIds.map(wsId => {
                        const matchedWs = activeCongress.workshops.find(w => w.id === wsId);
                        return (
                          <li key={wsId}>
                            {matchedWs?.title || "Workshop Temático"} ({matchedWs?.timeSlot})
                          </li>
                        );
                      })}
                      {checkinScanResult.ins.selectedWorkshopIds.length === 0 && (
                        <span className="text-rose-400 italic font-mono uppercase text-[9px]">Aviso: Nenhum workshop pendente na grade de acesso.</span>
                      )}
                    </ul>
                  </div>

                  {/* Double check trigger indicator for physical attendance */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Entrada física realizada em: <b className="text-white font-mono">{checkinScanResult.ins.checkedInAt ? new Date(checkinScanResult.ins.checkedInAt).toLocaleTimeString("pt-BR") : "Membro Ausente"}</b>
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => handleToggleCheckin(checkinScanResult.ins!.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer shadow transition-all ${
                        checkinScanResult.ins.checkedIn
                          ? "bg-rose-600 hover:bg-rose-500 text-slate-950 font-black"
                          : "bg-teal-500 hover:bg-teal-400 text-slate-950 font-black animate-bounce"
                      }`}
                    >
                      {checkinScanResult.ins.checkedIn ? "Anular Check-In" : "Efetuar Check-In Agora"}
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* NEW CONGRESS FORM EDITOR */}
      {(!selectedCongressId || isEditingCongress) && (
        <div className="bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-4">
          <h4 className="text-sm font-black text-white uppercase tracking-wider font-display border-b border-white/5 pb-2">
            {isEditingCongress ? "Editar Parâmetros do Congresso" : "Modelar Novo Congresso e Vago"}
          </h4>

          <form onSubmit={handleSaveCongress} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título do Congresso</label>
                <input
                  type="text"
                  value={congFormTitle}
                  onChange={(e) => setCongFormTitle(e.target.value)}
                  placeholder="35° Congresso Estadual UMESC (Catarinense)"
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status de Inscrição</label>
                <select
                  value={congFormStatus}
                  onChange={(e) => setCongFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white"
                >
                  <option value="open">Aberto (Aceitando Inscrições)</option>
                  <option value="closed">Fechado / Concluído</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Visibilidade no Frontend</label>
                <select
                  value={congFormActive ? "active" : "inactive"}
                  onChange={(e) => setCongFormActive(e.target.value === "active")}
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white font-semibold"
                >
                  <option value="active">🟢 Ativo (Visível no Frontend)</option>
                  <option value="inactive">🔴 Inativo (Ocultar do Frontend)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição Comercial</label>
              <textarea
                value={congFormDesc}
                onChange={(e) => setCongFormDesc(e.target.value)}
                placeholder="Indique os objetivos, as pregações e a integridade de capelania."
                className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data / Período Extenso</label>
                <input
                  type="text"
                  value={congFormDate}
                  onChange={(e) => setCongFormDate(e.target.value)}
                  placeholder="13 a 15 de Novembro de 2026"
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Localização</label>
                <input
                  type="text"
                  value={congFormLoc}
                  onChange={(e) => setCongFormLoc(e.target.value)}
                  placeholder="CentroSul, Florianópolis - SC"
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Taxa de Inscrição (R$)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    value={congFormPrice}
                    onChange={(e) => setCongFormPrice(Number(e.target.value))}
                    placeholder="40"
                    className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white disabled:opacity-50"
                    required
                    disabled={congFormPrice === 0}
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-400 select-none">
                    <input
                      type="checkbox"
                      checked={congFormPrice === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCongFormPrice(0);
                          setCongFormPixKey("Entrada Franca");
                          setCongFormPixName("Entrada Franca / Isento");
                        } else {
                          setCongFormPrice(45);
                          setCongFormPixKey("");
                          setCongFormPixName("");
                        }
                      }}
                      className="accent-amber-500 rounded cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Ativar Entrada Franca (Sem custo / PIX)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Chave PIX de Recebimento</label>
                <input
                  type="text"
                  value={congFormPixKey}
                  onChange={(e) => setCongFormPixKey(e.target.value)}
                  placeholder="pix@unesc-sc.org.br"
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white font-mono disabled:opacity-50"
                  required={congFormPrice > 0}
                  disabled={congFormPrice === 0}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Beneficiário Legal</label>
                <input
                  type="text"
                  value={congFormPixName}
                  onChange={(e) => setCongFormPixName(e.target.value)}
                  placeholder="UMESC Florianópolis Caixa Geral"
                  className="w-full px-3 py-2 bg-[#0a101a] border border-white/10 rounded-lg text-xs text-white disabled:opacity-50"
                  required={congFormPrice > 0}
                  disabled={congFormPrice === 0}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-3">
              {isEditingCongress && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCongress(false);
                    clearCongressForm();
                    loadData();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 border border-white/10 text-slate-350 hover:text-white text-xs font-bold font-mono rounded-lg cursor-pointer text-center"
                >
                  Cancelar Edição
                </button>
              )}

              {isEditingCongress && (
                <button
                  type="button"
                  onClick={() => handleDeleteCongress(congFormId)}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Congresso
                </button>
              )}
              
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 hover:text-black font-black text-xs uppercase rounded-lg cursor-pointer transition-all text-center"
              >
                {isEditingCongress ? "Salvar Alterações do Congresso" : "Postar Congresso no Frontend"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Lightbox / Modal for Payment Receipt File Verification */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0b1424] border border-amber-500/25 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-stretch animate-in fade-in duration-200 text-left">
            
            {/* Close Button top-right */}
            <button
              onClick={() => setSelectedReceiptForPreview(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar Visualização"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Receipt File Visualizer */}
            <div className="flex-1 flex flex-col justify-center items-center bg-[#070c14] rounded-xl border border-white/5 p-4 min-h-[300px] md:min-h-[450px]">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-3 block font-mono">
                Documento Enviado pelo Membro
              </span>
              
              {selectedReceiptForPreview.paymentProofUrl && selectedReceiptForPreview.paymentProofUrl.startsWith("data:") ? (
                /* Real User Upload (Base64) image preview */
                <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-auto rounded border border-white/5 bg-black">
                  <img
                    src={selectedReceiptForPreview.paymentProofUrl}
                    alt="Comprovante de pagamento original"
                    className="max-h-[360px] object-contain max-w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                /* Simulated highly authentic digital PIX transaction receipt */
                <div className="bg-white text-slate-800 p-6 rounded-xl border-2 border-dashed border-slate-300 w-full max-w-[360px] space-y-4 font-sans shadow-lg text-xs relative overflow-hidden self-center select-none text-left">
                  {/* Top Brand Stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
                  
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="font-bold text-[8.5px] text-slate-400 uppercase tracking-widest font-mono">Comprovante de Transferência</h5>
                      <div className="text-[14px] font-black text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
                        <span>PIX enviado</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono bg-slate-50">
                        ID: {selectedReceiptForPreview.id}
                      </span>
                    </div>
                  </div>

                  {/* Big Value Display */}
                  <div className="py-1">
                    <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                      {activeCongress?.price === 0 ? "Entrada Franca" : "R$ " + (activeCongress?.price?.toFixed(2) || "100,00")}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {activeCongress?.price === 0 ? "Inscrição Gratuita Autorizada" : "Transação Realizada via PIX"}
                    </div>
                  </div>

                  {/* Receipt Parameters Grid */}
                  <div className="space-y-3 pt-3 border-t border-slate-150">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Favorecido (Recebedor)</span>
                      <strong className="text-slate-800 text-[11px] block leading-tight">{activeCongress?.pixReceiverName || "UMESC Associação Legal"}</strong>
                      <span className="text-[9.5px] text-slate-500 block font-mono mt-0.5">Chave: {activeCongress?.pixKey}</span>
                    </div>

                    <div>
                      <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Instigador (Pagador)</span>
                      <strong className="text-slate-800 text-[11px] block leading-tight">{selectedReceiptForPreview.memberName}</strong>
                      <span className="text-[9.5px] text-slate-500 block font-mono mt-0.5">CPF: {selectedReceiptForPreview.memberCpf} • {selectedReceiptForPreview.memberRank}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/50">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Data e Hora</span>
                        <span className="text-slate-700 font-mono text-[9px] font-semibold mt-0.5 block">
                          {selectedReceiptForPreview.registrationDate ? new Date(selectedReceiptForPreview.registrationDate).toLocaleDateString("pt-BR") : "10/06/2026"} às {selectedReceiptForPreview.registrationDate ? new Date(selectedReceiptForPreview.registrationDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "12:00"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Banco Origem</span>
                        <span className="text-slate-700 font-mono text-[9px] font-semibold mt-0.5 block">Aplicativo Bancário Digital</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Código de Autenticação do Gateway</span>
                      <span className="text-[8px] text-slate-550 font-mono select-all break-all leading-tight block mt-0.5">
                        E131804242026061015200M{selectedReceiptForPreview.id}F93B8A72
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status footer on viewer */}
              <div className="mt-4 text-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  Arquivo anexado: <strong className="text-white font-mono">{selectedReceiptForPreview.paymentProofName || "comprovante_envio.pdf"}</strong>
                </span>
              </div>
            </div>

            {/* Right Column: Inscription Auditor & Moderation */}
            <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 text-left">
              <div className="space-y-5">
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-500 font-mono block">Auditoria do Evento</span>
                  <h3 className="text-lg font-black text-white font-display leading-tight mt-1">Confronto Financeiro</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Verifique os dados da transferência acima com os lançamentos na conta receptora antes de homologar.
                  </p>
                </div>

                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-3 text-left">
                  <div>
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">Inscrito / Candidato</span>
                    <strong className="text-white text-xs block mt-0.5">{selectedReceiptForPreview.memberName}</strong>
                    <span className="text-[10px] text-slate-300 block">{selectedReceiptForPreview.memberRank}</span>
                  </div>
                  
                  <div>
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">CPF do Membro</span>
                    <span className="font-mono text-white text-xs block tracking-wider mt-0.5">{selectedReceiptForPreview.memberCpf}</span>
                  </div>

                  <div>
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">Contato / WhatsApp</span>
                    <span className="font-mono text-white text-xs block mt-0.5">{selectedReceiptForPreview.memberPhone}</span>
                  </div>

                  <div>
                    <span className="block text-[8.5px] uppercase font-bold text-slate-400">Status Atual do Ingresso</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-1 ${
                      selectedReceiptForPreview.paymentStatus === "pago"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : selectedReceiptForPreview.paymentStatus === "em_analise"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse"
                          : selectedReceiptForPreview.paymentStatus === "recusado"
                            ? "bg-rose-500/10 text-rose-455 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400 border border-white/5"
                    }`}>
                      {selectedReceiptForPreview.paymentStatus === "em_analise" ? "Aguardando Análise" : selectedReceiptForPreview.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Validation Info Box */}
                <div className="flex gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-300 text-left">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-semibold">
                    A aprovação ativa o QR Code credencial e envia notificação de homologação ao e-mail cadastrado.
                  </p>
                </div>
              </div>

              {/* Action Buttons to moderate within Modal */}
              <div className="space-y-3 mt-6 pt-4 border-t border-white/5 text-left">
                <span className="block text-[8.5px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                  Definir Auditoria Final:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleSetInscriptionStatus(selectedReceiptForPreview.id, "pago");
                      alert("Inscrição HOMOLOGADA! O status foi alterado para Pago.");
                    }}
                    className={`py-2 rounded font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedReceiptForPreview.paymentStatus === "pago"
                        ? "bg-teal-500 text-slate-950 font-extrabold shadow"
                        : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20"
                    }`}
                  >
                    <Check className="w-4 h-4" /> Aprovar
                  </button>

                  <button
                    onClick={() => {
                      handleSetInscriptionStatus(selectedReceiptForPreview.id, "recusado");
                      alert("Inscrição RECUSADA. O status foi alterado para Recusado.");
                    }}
                    className={`py-2 rounded font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedReceiptForPreview.paymentStatus === "recusado"
                        ? "bg-rose-500 text-white font-extrabold shadow animate-none"
                        : "bg-rose-500/10 hover:bg-rose-550/20 text-rose-350 border border-rose-500/20"
                    }`}
                  >
                    <X className="w-4 h-4" /> Rejeitar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-lg transition-colors border border-white/5 cursor-pointer text-center"
                >
                  Voltar ao Painel
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: VERIFICAR DUPLICIDADES (NOME E CPF) */}
      {isDupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-amber-500/30 rounded-2xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white uppercase tracking-tight font-display">
                    Auditoria de Duplicidades por Nome e CPF
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Evento: <strong className="text-white">{activeCongress?.title || "Selecionado"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules Info banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>Regras de Auditoria de Duplicidades:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-300 leading-relaxed">
                <li>O mesmo número de <strong>telefone É PERMITIDO</strong> para realizar múltiplas inscrições.</li>
                <li>A verificação busca exclusivamente por <strong>Nomes ou CPFs idênticos</strong> na lista de inscritos do <strong>evento selecionado</strong>.</li>
                <li>Inscrições com o mesmo Nome ou CPF em <em>outros congressos</em> não são consideradas duplicadas.</li>
              </ul>
            </div>

            {/* Filter Tabs and Groups */}
            {(() => {
              const dupData = getCongressDuplicates(selectedCongressId);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setDupTab("todos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        dupTab === "todos"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      Todos ({dupData.totalDuplicateEntries})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDupTab("cpf")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        dupTab === "cpf"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      CPF Duplicado ({dupData.cpfGroups.length} grupos)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDupTab("nome")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        dupTab === "nome"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      Nome Duplicado ({dupData.nameGroups.length} grupos)
                    </button>
                  </div>

                  {/* Empty state */}
                  {dupData.totalDuplicateEntries === 0 ? (
                    <div className="p-8 text-center bg-[#09101a] rounded-2xl border border-teal-500/20 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wide">
                        Nenhuma duplicidade encontrada!
                      </h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto">
                        Não existem nomes ou CPFs duplicados na lista de inscritos deste evento. Todas as inscrições para <strong className="text-white">{activeCongress?.title}</strong> são únicas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* CPF Groups */}
                      {(dupTab === "todos" || dupTab === "cpf") && dupData.cpfGroups.map(group => (
                        <div key={`cpf-${group.key}`} className="p-4 bg-[#0d1626] rounded-xl border border-amber-500/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold rounded uppercase">
                                CPF Duplicado
                              </span>
                              <span className="font-mono font-bold text-white text-sm">
                                {group.displayValue}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {group.inscriptions.length} inscrições com este CPF
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.inscriptions.map((ins) => (
                              <div key={ins.id} className="p-3 bg-[#060c16] rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-amber-500 font-bold">{ins.id}</span>
                                    <span className="font-bold text-white">{ins.memberName}</span>
                                    <span className="text-[10px] text-slate-400">({ins.memberRank})</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                      ins.paymentStatus === "pago"
                                        ? "bg-teal-500/10 text-teal-400"
                                        : ins.paymentStatus === "em_analise"
                                          ? "bg-amber-500/15 text-amber-400"
                                          : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {ins.paymentStatus}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                                    <span>Fone: {ins.memberPhone}</span>
                                    <span>E-mail: {ins.memberEmail}</span>
                                    <span>Data: {new Date(ins.registrationDate).toLocaleDateString("pt-BR")}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteDuplicateEntry(ins.id, ins.memberName)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 self-start sm:self-center"
                                  title="Excluir este registro duplicado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir Inscrição Duplicada</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Name Groups */}
                      {(dupTab === "todos" || dupTab === "nome") && dupData.nameGroups.map(group => (
                        <div key={`nome-${group.key}`} className="p-4 bg-[#0d1626] rounded-xl border border-indigo-500/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold rounded uppercase">
                                Nome Duplicado
                              </span>
                              <span className="font-bold text-white text-sm uppercase">
                                {group.displayValue}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {group.inscriptions.length} inscrições com este nome
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.inscriptions.map((ins) => (
                              <div key={ins.id} className="p-3 bg-[#060c16] rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-indigo-400 font-bold">{ins.id}</span>
                                    <span className="font-bold text-white">{ins.memberName}</span>
                                    <span className="text-[10px] text-slate-400">({ins.memberRank})</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                      ins.paymentStatus === "pago"
                                        ? "bg-teal-500/10 text-teal-400"
                                        : ins.paymentStatus === "em_analise"
                                          ? "bg-amber-500/15 text-amber-400"
                                          : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {ins.paymentStatus}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                                    <span>CPF: {ins.memberCpf}</span>
                                    <span>Fone: {ins.memberPhone}</span>
                                    <span>Data: {new Date(ins.registrationDate).toLocaleDateString("pt-BR")}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteDuplicateEntry(ins.id, ins.memberName)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 self-start sm:self-center"
                                  title="Excluir este registro duplicado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir Inscrição Duplicada</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsDupModalOpen(false)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-white/5 cursor-pointer"
                    >
                      Fechar Auditoria
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Reusable premium safety confirmation modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-rose-500/35 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-450 text-rose-400 font-display">
                  {confirmModal.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tight">Painel de Segurança UMESC</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-905 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-550 text-white font-black text-xs uppercase rounded-lg cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-600/15"
              >
                <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
