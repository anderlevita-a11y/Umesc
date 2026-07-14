import React, { useState, useEffect } from "react";
import { 
  X, Check, Search, Calendar, MapPin, Ticket, Award, CreditCard, 
  UploadCloud, CheckCircle2, AlertTriangle, QrCode, Phone, User, 
  Map, Mail, Building, Clipboard, Sparkles, CheckCircle, Info, Lock
} from "lucide-react";
import { congressService, Congress, CongressInscription, Workshop } from "../lib/congressService.ts";

interface VisitorCongressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCongressId?: string;
}

export default function VisitorCongressModal({ isOpen, onClose, initialCongressId }: VisitorCongressModalProps) {
  const [activeTab, setActiveTab] = useState<"register" | "query">("register");
  const [congresses, setCongresses] = useState<Congress[]>([]);
  const [selectedCongressId, setSelectedCongressId] = useState<string>("");

  // Registration Form State
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Florianópolis");
  const [church, setChurch] = useState("");
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<string[]>([]);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<CongressInscription | null>(null);

  // Query Form State
  const [queryInput, setQueryInput] = useState(""); // Can be CPF or Phone
  const [queryResult, setQueryResult] = useState<CongressInscription[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedQueriedIns, setSelectedQueriedIns] = useState<CongressInscription | null>(null);

  // Proof Upload State (for registered or queried pending inscriptions)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fakeFileName, setFakeFileName] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Load congresses
  useEffect(() => {
    const list = congressService.getCongresses().filter(c => c.status === "open" && c.isActive !== false);
    setCongresses(list);

    if (list.length > 0) {
      if (initialCongressId && list.some(c => c.id === initialCongressId)) {
        setSelectedCongressId(initialCongressId);
      } else {
        const featured = list.find(c => c.isFeatured);
        setSelectedCongressId(featured ? featured.id : list[0].id);
      }
    }
  }, [isOpen, initialCongressId]);

  if (!isOpen) return null;

  const activeCongress = congresses.find(c => c.id === selectedCongressId);
  const queriedCongress = selectedQueriedIns ? (congresses.find(c => c.id === selectedQueriedIns.congressId) || activeCongress) : activeCongress;

  // Mask CPF Helper
  const handleCpfChange = (val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 11);
    let masked = clean;
    if (clean.length > 9) {
      masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
    } else if (clean.length > 6) {
      masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`;
    } else if (clean.length > 3) {
      masked = `${clean.substring(0, 3)}.${clean.substring(3)}`;
    }
    setCpf(masked);
  };

  // Mask Phone Helper
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 11);
    let masked = clean;
    if (clean.length > 10) {
      masked = `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    } else if (clean.length > 6) {
      masked = `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    } else if (clean.length > 2) {
      masked = `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    }
    setPhone(masked);
  };

  // Form Submit handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCongress) return;
    if (!name.trim() || !cpf.trim() || !phone.trim() || !email.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!lgpdConsent) {
      alert("Para prosseguir, você precisa aceitar os termos de consentimento da LGPD.");
      return;
    }

    // Check if CPF already has an inscription for this congress
    const allInscriptions = congressService.getInscriptions();
    const cleanCpf = cpf.replace(/\D/g, "");
    const alreadyRegistered = allInscriptions.some(
      ins => ins.congressId === selectedCongressId && ins.memberCpf.replace(/\D/g, "") === cleanCpf
    );

    if (alreadyRegistered) {
      alert("Já existe uma inscrição ativa para este CPF no congresso selecionado. Você pode consultar seu status na aba 'Consultar Inscrição'.");
      setActiveTab("query");
      setQueryInput(cpf);
      handleSearchQuery(cpf);
      return;
    }

    // Add inscription
    const insData = {
      congressId: activeCongress.id,
      congressTitle: activeCongress.title,
      memberName: name,
      memberCpf: cpf,
      memberEmail: email,
      memberPhone: phone,
      memberRank: "Visitante", // Special non-member indicator
      selectedWorkshopIds,
      paymentStatus: activeCongress.price === 0 ? ("pago" as const) : ("pendente" as const)
    };

    const created = congressService.addInscription(insData);
    setRegistrationSuccess(created);
    setSelectedQueriedIns(created); // Set as selected so they see their voucher
  };

  const handleWorkshopToggle = (wsId: string) => {
    if (selectedWorkshopIds.includes(wsId)) {
      setSelectedWorkshopIds(selectedWorkshopIds.filter(id => id !== wsId));
    } else {
      setSelectedWorkshopIds([...selectedWorkshopIds, wsId]);
    }
  };

  // Search/Query status helper
  const handleSearchQuery = (forcedVal?: string) => {
    const term = (forcedVal || queryInput).replace(/\D/g, "").trim();
    if (!term) {
      alert("Por favor, insira o CPF ou número de telefone para consultar.");
      return;
    }

    const allInscriptions = congressService.getInscriptions();
    const matches = allInscriptions.filter(ins => {
      const matchCpf = ins.memberCpf.replace(/\D/g, "") === term;
      const matchPhone = ins.memberPhone.replace(/\D/g, "").includes(term);
      return matchCpf || matchPhone;
    });

    setQueryResult(matches);
    setSearched(true);
    if (matches.length === 1) {
      setSelectedQueriedIns(matches[0]);
    } else {
      setSelectedQueriedIns(null);
    }
  };

  // Copy PIX Info
  const handleCopyPix = (key: string) => {
    navigator.clipboard.writeText(key);
    alert("Chave PIX copiada com sucesso!");
  };

  // Handle proof upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFakeFileName(file.name);
    }
  };

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueriedIns || (!selectedFile && !fakeFileName)) return;

    setIsUploadingProof(true);

    const proceedWithUpload = (proofUrl: string) => {
      const name = fakeFileName || "comprovante_pix_visitante.jpg";
      const updated = congressService.updateInscriptionStatus(
        selectedQueriedIns.id,
        "em_analise",
        proofUrl,
        name
      );

      if (updated) {
        setSelectedQueriedIns(updated);
        // also update in lists
        setQueryResult(prev => prev.map(item => item.id === updated.id ? updated : item));
        if (registrationSuccess && registrationSuccess.id === updated.id) {
          setRegistrationSuccess(updated);
        }
      }
      setIsUploadingProof(false);
      setSelectedFile(null);
      setFakeFileName("");
      alert("Comprovante enviado com sucesso! A diretoria fará a verificação do pagamento e homologará seu crachá.");
    };

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        proceedWithUpload(reader.result as string);
      };
      reader.onerror = () => {
        proceedWithUpload("MOCK_UPLOADED_DATA_URL");
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setTimeout(() => {
        proceedWithUpload("MOCK_UPLOADED_DATA_URL");
      }, 1000);
    }
  };

  // Pix string simulation generator
  const generatePixString = (key: string, amount: number, receiver: string) => {
    return `00020101021226480014br.gov.bcb.pix0114${key}5204000053039865405${amount.toFixed(2)}5802BR5925${receiver.substring(0, 25)}6009FLORIPA62070503***6304`;
  };

  // Reset form to write another
  const resetForm = () => {
    setName("");
    setCpf("");
    setPhone("");
    setEmail("");
    setChurch("");
    setSelectedWorkshopIds([]);
    setLgpdConsent(false);
    setRegistrationSuccess(null);
    setSelectedQueriedIns(null);
    setSearched(false);
    setQueryInput("");
    setQueryResult([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0c1626] border border-amber-500/30 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 w-full shrink-0" />

        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0e192c]/85 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-display">
                Portal de Inscrições de Visitantes
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                UMESC • Gestão de Congressos & Credenciais Avulsas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Tabs */}
        {!registrationSuccess && (
          <div className="flex bg-[#080e18] border-b border-white/5 p-1 shrink-0">
            <button
              onClick={() => { setActiveTab("register"); resetForm(); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "register"
                  ? "border-amber-500 text-amber-400 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/2"
              }`}
            >
              Nova Inscrição (Visitante / Avulso)
            </button>
            <button
              onClick={() => { setActiveTab("query"); resetForm(); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "query"
                  ? "border-amber-500 text-amber-400 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/2"
              }`}
            >
              Consultar Status / Enviar Comprovante
            </button>
          </div>
        )}

        {/* Body Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#09101b]">
          
          {/* TAB 1: NEW VISITOR REGISTRATION */}
          {activeTab === "register" && !registrationSuccess && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              
              {/* Event selection if multiple */}
              {congresses.length > 0 ? (
                <div className="bg-[#111e30]/80 p-4 rounded-2xl border border-white/5 space-y-3">
                  <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Selecione o Congresso para se Inscrever
                  </label>
                  <select
                    value={selectedCongressId}
                    onChange={(e) => {
                      setSelectedCongressId(e.target.value);
                      setSelectedWorkshopIds([]);
                    }}
                    className="w-full px-3 py-2.5 bg-[#09101a] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {congresses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} — Taxa: {c.price === 0 ? "Entrada Franca" : "R$ " + c.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {activeCongress && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center text-[10px] text-slate-400 font-mono gap-x-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {activeCongress.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 truncate max-w-[250px]" />
                        {activeCongress.location}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/5 text-slate-400 italic">
                  Nenhum congresso com inscrições abertas no momento.
                </div>
              )}

              {activeCongress && (
                <div className="space-y-6">
                  {/* Personal Fields */}
                  <div className="bg-[#0e1929]/50 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-500" />
                      Dados Cadastrais do Visitante
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value.toUpperCase())}
                          placeholder="EX: ANDERSON DE SOUZA"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* CPF */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">CPF *</label>
                        <input
                          type="text"
                          required
                          value={cpf}
                          onChange={(e) => handleCpfChange(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">WhatsApp / Telefone *</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">E-mail *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="EX: visitante@email.com"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">Cidade *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Sua Cidade"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Church / Affiliation */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono text-slate-400">Igreja / Denominação</label>
                        <input
                          type="text"
                          value={church}
                          onChange={(e) => setChurch(e.target.value)}
                          placeholder="EX: Assembleia de Deus / Nenhuma"
                          className="w-full px-3.5 py-2 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Workshops choice if available */}
                  {activeCongress.workshops && activeCongress.workshops.length > 0 && (
                    <div className="bg-[#0e1929]/50 p-5 rounded-2xl border border-white/5 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                        <Map className="w-4 h-4 text-amber-500" />
                        Salas de Oficinas & Workshops Temáticos (Selecione as que deseja participar)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeCongress.workshops.map((ws) => {
                          const isSelected = selectedWorkshopIds.includes(ws.id);
                          const isFull = ws.registeredCount >= ws.capacity;

                          return (
                            <button
                              key={ws.id}
                              type="button"
                              onClick={() => !isFull && handleWorkshopToggle(ws.id)}
                              disabled={isFull && !isSelected}
                              className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 select-none ${
                                isSelected
                                  ? "bg-amber-500/10 border-amber-500 text-white"
                                  : isFull
                                    ? "bg-white/2 border-white/5 text-slate-500 cursor-not-allowed opacity-50"
                                    : "bg-[#09101a] border-white/5 text-slate-300 hover:border-white/15"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                                isSelected ? "bg-amber-500 border-amber-500 text-slate-950" : "border-white/20"
                              }`}>
                                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                              </div>
                              <div className="space-y-1 flex-1">
                                <span className="block text-xs font-bold leading-snug">{ws.title}</span>
                                <span className="block text-[10px] text-slate-400">Ministrante: {ws.speaker}</span>
                                <span className="block text-[9px] font-mono text-amber-500">{ws.timeSlot}</span>
                                <div className="flex justify-between items-center pt-1 text-[9px] font-mono">
                                  <span>Capacidade: {ws.capacity} vagas</span>
                                  <span className={isFull ? "text-rose-400 font-bold" : "text-emerald-400"}>
                                    {isFull ? "VAGAS ESGOTADAS" : `${ws.capacity - ws.registeredCount} vagas livres`}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* LGPD Terms & Confirmation */}
                  <div className="bg-[#111d2e] border border-amber-500/20 p-5 rounded-2xl space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        id="lgpd-chk-visitor"
                        type="checkbox"
                        required
                        checked={lgpdConsent}
                        onChange={(e) => setLgpdConsent(e.target.checked)}
                        className="w-4.5 h-4.5 accent-amber-500 mt-0.5 shrink-0 cursor-pointer"
                      />
                      <label htmlFor="lgpd-chk-visitor" className="text-[11px] text-slate-300 leading-relaxed select-none cursor-pointer">
                        * Eu declaro que estou ciente de que a <strong>UMESC</strong> coletará meus dados para fins exclusivos de credenciamento, confecção de crachás e controle de acesso no congresso, em perfeita conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/18)</strong>.
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-white/5">
                      <div className="text-center sm:text-left">
                        <span className="block text-[10px] text-slate-400 font-mono">VALOR TOTAL DA INSCRIÇÃO</span>
                        <span className="text-xl font-black text-amber-400">{activeCongress.price === 0 ? "Entrada Franca" : "R$ " + activeCongress.price.toFixed(2)}</span>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full sm:w-auto py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-[#0c1421] text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                      >
                        {activeCongress.price === 0 ? "Confirmar Inscrição Gratuita" : "Confirmar Inscrição Avulsa"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: QUERY STATUS & SUBMIT PROOF */}
          {activeTab === "query" && !registrationSuccess && (
            <div className="space-y-6">
              
              {/* Search Form */}
              <div className="bg-[#0e1929]/70 p-5 rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-500" />
                  Pesquisar Minha Inscrição Avulsa
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para conferir o status do seu crachá ou anexar o comprovante do Pix, digite seu <strong>CPF</strong> ou o número de <strong>Telefone</strong> usado no cadastro.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Digite o CPF ou Telefone (apenas números)..."
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchQuery()}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#09101a] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => handleSearchQuery()}
                    className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-slate-950 text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                  >
                    Buscar Registro
                  </button>
                </div>
              </div>

              {/* Search results list */}
              {searched && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                    Resultados da Busca ({queryResult.length})
                  </h4>

                  {queryResult.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {queryResult.map((ins) => (
                        <button
                          key={ins.id}
                          onClick={() => setSelectedQueriedIns(ins)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                            selectedQueriedIns?.id === ins.id
                              ? "bg-amber-500/10 border-amber-500 text-white"
                              : "bg-[#0e1929]/50 border-white/5 text-slate-300 hover:bg-[#0e1929]/80"
                          }`}
                        >
                          <div>
                            <span className="block text-[10px] font-mono text-amber-400 font-bold">{ins.id} • {ins.congressTitle}</span>
                            <span className="block text-sm font-bold text-white mt-1">{ins.memberName}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">CPF: {ins.memberCpf} • WhatsApp: {ins.memberPhone}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              ins.paymentStatus === "pago"
                                ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                : ins.paymentStatus === "em_analise"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                  : ins.paymentStatus === "recusado"
                                    ? "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {ins.paymentStatus === "em_analise" ? "Em Análise" : ins.paymentStatus}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono mt-1">Clique para ver crachá/PIX</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white/2 rounded-2xl border border-white/5 text-slate-450 italic">
                      Nenhum cadastro de visitante foi localizado para este CPF ou Telefone. Certifique-se de que os números digitados estão corretos ou realize uma nova inscrição na aba correspondente.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* DETAILED INSCRIPTION CARD WITH PIX DETAILS OR CONFIRMATION TICKET */}
          {selectedQueriedIns && (
            <div className="mt-8 bg-[#0a111a] border border-white/10 rounded-3xl p-6 space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Visitante Autorizado • Ficha {selectedQueriedIns.id}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1.5 font-display leading-tight">
                    {selectedQueriedIns.memberName}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Registrado para: <strong className="text-white">{selectedQueriedIns.congressTitle}</strong>
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase">STATUS DO PAGAMENTO</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-1.5 ${
                    selectedQueriedIns.paymentStatus === "pago"
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : selectedQueriedIns.paymentStatus === "em_analise"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        : selectedQueriedIns.paymentStatus === "recusado"
                          ? "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}>
                    {selectedQueriedIns.paymentStatus === "pago" && <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />}
                    {selectedQueriedIns.paymentStatus === "em_analise" && <Info className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />}
                    {selectedQueriedIns.paymentStatus === "recusado" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {selectedQueriedIns.paymentStatus === "pendente" && <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />}
                    {selectedQueriedIns.paymentStatus === "em_analise" ? "Em Análise" : selectedQueriedIns.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Inscription Details Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Digital Badge / Crachá */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-[280px] bg-gradient-to-b from-[#111e31] to-[#080f1a] border-2 border-amber-500/30 rounded-2xl p-5 text-center shadow-xl overflow-hidden">
                    
                    {/* Badge top ribbon */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
                    
                    <span className="block text-[9px] text-amber-400 font-mono font-bold tracking-widest uppercase mt-2">
                      UMESC CONGRESSISTA
                    </span>

                    {/* QR Code Placeholder with Real token */}
                    <div className="w-32 h-32 mx-auto my-4 bg-white p-2 rounded-xl flex flex-col items-center justify-center border border-white/5 relative group">
                      <QrCode className="w-full h-full text-slate-900" />
                      <div className="absolute inset-0 bg-[#0a111a]/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <span className="text-[8px] font-mono font-bold text-amber-400 break-all leading-snug">
                          {selectedQueriedIns.qrCodeToken}
                        </span>
                      </div>
                    </div>

                    <h5 className="text-xs font-black text-white uppercase truncate px-1">
                      {selectedQueriedIns.memberName}
                    </h5>
                    
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-mono text-slate-400">
                      <span>CPF: {selectedQueriedIns.memberCpf}</span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">VISITANTE</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono">
                      <div className="text-left">
                        <span className="block text-[7px] text-slate-500">CONGRESSO</span>
                        <span className="text-white truncate max-w-[130px] block font-bold">{selectedQueriedIns.congressTitle.split("(")[0]}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[7px] text-slate-500">TICKET</span>
                        <span className="text-amber-400 font-bold">{selectedQueriedIns.id}</span>
                      </div>
                    </div>

                    {/* Badge Status Banner overlay */}
                    <div className={`mt-3 py-1 rounded text-[9px] font-mono font-bold uppercase ${
                      selectedQueriedIns.paymentStatus === 'pago' 
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {selectedQueriedIns.paymentStatus === 'pago' ? "✓ INGRESSO HOMOLOGADO" : "⏳ COMPROVANTE EXIGIDO"}
                    </div>

                  </div>
                </div>

                {/* Instructions & Actions */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {selectedQueriedIns.paymentStatus === "pago" ? (
                    <div className="bg-teal-550/10 border border-teal-500/20 p-5 rounded-2xl space-y-3">
                      <h5 className="text-xs font-bold text-teal-400 flex items-center gap-1.5 uppercase font-mono">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Inscrição Aprovada com Sucesso!
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Seu pagamento foi compensado e sua inscrição está oficialmente garantida. Seu crachá com o código <strong>{selectedQueriedIns.id}</strong> foi homologado.
                      </p>
                      <div className="text-[11px] text-slate-450 bg-[#070c18] p-3 rounded-lg border border-white/5 space-y-1">
                        <span className="block text-white font-semibold">Instruções para o dia do evento:</span>
                        <p>1. Salve ou printe a imagem desta credencial com o QR Code.</p>
                        <p>2. Apresente-a diretamente no balcão de credenciamento na portaria do congresso.</p>
                        <p>3. Não há necessidade de levar comprovante impresso.</p>
                      </div>
                    </div>
                  ) : selectedQueriedIns.paymentStatus === "em_analise" ? (
                    <div className="bg-[#1c1c14] border border-amber-500/20 p-5 rounded-2xl space-y-3">
                      <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono animate-pulse">
                        <Info className="w-4 h-4 shrink-0" />
                        Comprovante em Análise Contábil
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Você anexou com sucesso o comprovante <strong>{selectedQueriedIns.paymentProofName}</strong>. A equipe financeira da UMESC está fazendo o batimento e liberará sua credencial em até 24 horas.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Não se preocupe! Você receberá sua confirmação no e-mail informado no cadastro ou poderá retornar a esta aba e digitar seu CPF para baixar o crachá homologado.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Payment Pending Alert / Free Admission Alert */}
                      {queriedCongress && queriedCongress.price === 0 ? (
                        <div className="bg-[#0b241b] border border-emerald-500/20 p-4 rounded-xl text-xs text-slate-200 leading-relaxed">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-bold text-emerald-400 uppercase font-mono text-[10px]">Entrada Franca / Credenciamento Gratuito</span>
                              <span>Este congresso é gratuito e livre de taxa de inscrição. Sua vaga está garantida gratuitamente! Seu crachá com o QR Code foi homologado com sucesso.</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-[#241312] border border-rose-500/20 p-4 rounded-xl text-xs text-slate-200 leading-relaxed">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4.5 h-4.5 text-rose-450 shrink-0 mt-0.5" />
                              <div>
                                <span className="block font-bold text-rose-400 uppercase font-mono text-[10px]">Ação Necessária</span>
                                <span>Para garantir sua vaga oficial e liberar o QR Code de portaria, realize a transferência de <strong>R$ {queriedCongress ? queriedCongress.price.toFixed(2) : "45,00"}</strong> via Pix e envie o comprovante de pagamento no formulário ao lado.</span>
                              </div>
                            </div>
                          </div>

                          {/* PIX copy block */}
                          {queriedCongress && (
                            <div className="bg-[#0e1929] border border-white/5 p-4 rounded-xl space-y-3">
                              <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">DADOS DE PAGAMENTO PIX</span>
                              
                              <div className="flex justify-between items-center bg-[#070c18] p-3 rounded-lg border border-white/10 gap-4">
                                <div className="truncate">
                                  <span className="block text-[8px] text-slate-500 uppercase font-mono">CHAVE PIX (CNPJ ou E-MAIL)</span>
                                  <span className="text-xs text-amber-400 font-mono font-bold truncate block">{queriedCongress.pixKey}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPix(queriedCongress.pixKey)}
                                  className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-[#0c1421] text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <Clipboard className="w-3 h-3" /> Copiar Chave
                                </button>
                              </div>

                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <p>Favorecido: <strong className="text-white">{queriedCongress.pixReceiverName}</strong></p>
                                <p>Valor exato: <strong className="text-amber-500">R$ {queriedCongress.price.toFixed(2)}</strong></p>
                              </div>
                            </div>
                          )}

                          {/* Receipt Uploader Form */}
                          <form onSubmit={handleProofSubmit} className="bg-[#0e1929]/50 p-4 rounded-xl border border-white/5 space-y-3">
                            <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">ANEXAR COMPROVANTE DO PIX</span>
                            
                            <div className="relative border border-dashed border-white/15 rounded-lg p-4 text-center hover:bg-white/2 hover:border-amber-500/50 transition-all">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <UploadCloud className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                              <span className="block text-xs font-bold text-white mt-2">
                                {fakeFileName ? fakeFileName : "Clique para selecionar foto ou PDF do comprovante"}
                              </span>
                              <span className="block text-[9px] text-slate-400 mt-1">
                                Suporta PNG, JPG ou PDF de até 5MB
                              </span>
                            </div>

                            <button
                              type="submit"
                              disabled={isUploadingProof || (!selectedFile && !fakeFileName)}
                              className={`w-full py-2 px-4 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                isUploadingProof || (!selectedFile && !fakeFileName)
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                  : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                              }`}
                            >
                              {isUploadingProof ? "Transmitindo Comprovante..." : "Enviar Comprovante de Pagamento"}
                            </button>
                          </form>
                        </>
                      )}

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0c1626] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left shrink-0">
          <span className="text-[10px] font-mono text-slate-500 italic">
            UMESC - União de Militares Evangélicos de SC
          </span>
          <div className="flex gap-3">
            {(registrationSuccess || selectedQueriedIns) && (
              <button
                onClick={resetForm}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Voltar à Busca / Inscrição
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0c1421] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Fechar Painel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
