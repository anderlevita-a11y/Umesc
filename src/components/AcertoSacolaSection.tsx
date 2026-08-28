import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, ShieldCheck, Fingerprint, Plus, Trash2, CheckCircle2, 
  AlertCircle, DollarSign, Calendar, MapPin, User, FileText, Printer, 
  Download, Eye, RefreshCw, X, ShieldAlert, Sparkles, Smartphone, Check
} from "lucide-react";
import { AcertoSacola, ItemSacola } from "../types";
import { sacolaService, DEFAULT_ITENS_SACOLA_TEMPLATE } from "../lib/sacolaService";
import { biometricsService, getBiometricLabel } from "../lib/biometrics";

interface AcertoSacolaSectionProps {
  isAdmin?: boolean;
  currentUser?: {
    name: string;
    cpf: string;
    rgMilitar?: string;
    email: string;
    force?: string;
    rank?: string;
    city?: string;
  };
}

export default function AcertoSacolaSection({ isAdmin = false, currentUser }: AcertoSacolaSectionProps) {
  const [acertos, setAcertos] = useState<AcertoSacola[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"novo" | "detalhes" | "imprimir" | null>(null);
  const [selectedAcerto, setSelectedAcerto] = useState<AcertoSacola | null>(null);

  // Form state for creating/editing an Acerto
  const [numeroSacola, setNumeroSacola] = useState("");
  const [responsavelNome, setResponsavelNome] = useState(currentUser?.name || "");
  const [responsavelCpf, setResponsavelCpf] = useState(currentUser?.cpf || "");
  const [responsavelRgMilitar, setResponsavelRgMilitar] = useState(currentUser?.rgMilitar || "");
  const [regional, setRegional] = useState(currentUser?.city ? `${currentUser.city} / Região` : "1º BPM / Grande Florianópolis");
  const [dataRetirada, setDataRetirada] = useState(new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0]);
  const [dataAcerto, setDataAcerto] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");
  const [valorPix, setValorPix] = useState<number>(0);
  const [valorDinheiro, setValorDinheiro] = useState<number>(0);
  const [valorCartao, setValorCartao] = useState<number>(0);
  
  // Items list in the form
  const [itens, setItens] = useState<ItemSacola[]>(() => 
    DEFAULT_ITENS_SACOLA_TEMPLATE.map((t, idx) => ({
      ...t,
      id: `item-${Date.now()}-${idx}`
    }))
  );

  // WebAuthn Biometric verification state
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricPrompting, setBiometricPrompting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // WebAuthn device check
  const isWebAuthnSupported = biometricsService.isWebAuthnSupported();
  const biometricLabel = getBiometricLabel();

  // Load acertos
  const loadData = async () => {
    setLoading(true);
    try {
      const list = await sacolaService.getAcertos();
      setAcertos(list);
    } catch (err) {
      console.error("Erro ao carregar acertos de sacola:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("umesc_content_updated", loadData);
    return () => window.removeEventListener("umesc_content_updated", loadData);
  }, []);

  // Update totals whenever items or payments change
  const valorTotalItens = itens.reduce((acc, curr) => acc + (curr.qtdDistribuida * curr.precoUnitario), 0);
  const totalArrecadadoInformado = Number(valorPix || 0) + Number(valorDinheiro || 0) + Number(valorCartao || 0);
  const diferencaBalanco = valorTotalItens - totalArrecadadoInformado;

  const handleOpenNewModal = () => {
    const nextNum = `SAC-${new Date().getFullYear()}-${String(acertos.length + 1).padStart(3, "0")}`;
    setNumeroSacola(nextNum);
    setResponsavelNome(currentUser?.name || "");
    setResponsavelCpf(currentUser?.cpf || "");
    setResponsavelRgMilitar(currentUser?.rgMilitar || "");
    setRegional(currentUser?.city ? `${currentUser.city} / Região` : "1º BPM / Florianópolis");
    setDataRetirada(new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0]);
    setDataAcerto(new Date().toISOString().split("T")[0]);
    setObservacoes("");
    
    // Default items
    const defaultItens: ItemSacola[] = DEFAULT_ITENS_SACOLA_TEMPLATE.map((t, idx) => ({
      ...t,
      id: `item-${Date.now()}-${idx}`,
      valorTotalItem: t.qtdDistribuida * t.precoUnitario
    }));
    setItens(defaultItens);

    const initialTotal = defaultItens.reduce((acc, curr) => acc + curr.valorTotalItem, 0);
    setValorPix(initialTotal);
    setValorDinheiro(0);
    setValorCartao(0);

    setFeedbackMsg(null);
    setActiveModal("novo");
  };

  const handleItemChange = (id: string, field: keyof ItemSacola, value: any) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      
      // Auto recalculate devolvidas and total
      if (field === "qtdRecebida" || field === "qtdDistribuida") {
        const recebida = field === "qtdRecebida" ? Number(value) : item.qtdRecebida;
        const distribuida = field === "qtdDistribuida" ? Number(value) : item.qtdDistribuida;
        updated.qtdDevolvida = Math.max(0, recebida - distribuida);
        updated.valorTotalItem = distribuida * updated.precoUnitario;
      } else if (field === "precoUnitario") {
        updated.valorTotalItem = item.qtdDistribuida * Number(value);
      }
      return updated;
    }));
  };

  const handleAddItem = () => {
    const newItem: ItemSacola = {
      id: `item-custom-${Date.now()}`,
      descricao: "Novo Artigo / Material Institucional",
      precoUnitario: 20.00,
      qtdRecebida: 5,
      qtdDistribuida: 5,
      qtdDevolvida: 0,
      valorTotalItem: 100.00
    };
    setItens(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (itens.length <= 1) {
      alert("A sacola deve possuir pelo menos 1 item registrado.");
      return;
    }
    setItens(prev => prev.filter(i => i.id !== id));
  };

  // Submit and sign Acerto de Sacola with WebAuthn
  const handleSubmitAcerto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!responsavelNome.trim() || !responsavelCpf.trim()) {
      setFeedbackMsg({ type: "error", text: "Preencha o nome e CPF do militar responsável pelo acerto." });
      return;
    }

    if (diferencaBalanco !== 0) {
      const confirmProceed = confirm(
        `Atenção: Há uma diferença de R$ ${Math.abs(diferencaBalanco).toFixed(2)} entre o total distribuído (R$ ${valorTotalItens.toFixed(2)}) e as formas de pagamento (R$ ${totalArrecadadoInformado.toFixed(2)}). Deseja prosseguir com o acerto mesmo assim?`
      );
      if (!confirmProceed) return;
    }

    setIsSubmitting(true);
    setBiometricPrompting(useBiometrics && isWebAuthnSupported);

    try {
      const newAcerto: AcertoSacola = {
        id: `sac-${Date.now()}`,
        numeroSacola: numeroSacola.trim() || `SAC-${Date.now()}`,
        responsavelNome: responsavelNome.trim(),
        responsavelCpf: responsavelCpf.trim(),
        responsavelRgMilitar: responsavelRgMilitar.trim() || undefined,
        regional: regional.trim(),
        dataRetirada,
        dataAcerto,
        status: isAdmin ? "homologado" : "pendente",
        itens,
        valorTotalArrecadado: valorTotalItens,
        valorPix: Number(valorPix || 0),
        valorDinheiro: Number(valorDinheiro || 0),
        valorCartao: Number(valorCartao || 0),
        observacoes: observacoes.trim() || undefined,
        biometricAuthenticated: false
      };

      const userIdentifier = {
        id: currentUser?.cpf || responsavelCpf,
        name: currentUser?.name || responsavelNome,
        email: currentUser?.email || `${responsavelCpf}@membro.umesc`
      };

      const result = await sacolaService.signAndSubmitAcerto(newAcerto, userIdentifier, useBiometrics);

      if (!result.success) {
        setFeedbackMsg({ 
          type: "error", 
          text: result.error || "A verificação de segurança não foi aprovada. O acerto não pôde ser gravado." 
        });
        return;
      }

      await loadData();
      setActiveModal(null);
      alert(`✓ Acerto de Sacola ${newAcerto.numeroSacola} protocolado com sucesso! Assinatura de segurança WebAuthn registrada.`);
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Erro ao salvar acerto." });
    } finally {
      setIsSubmitting(false);
      setBiometricPrompting(false);
    }
  };

  const handleHomologar = async (id: string) => {
    if (!confirm("Deseja homologar formalmente este acerto de sacola na tesouraria?")) return;
    await sacolaService.homologarAcerto(id);
    await loadData();
    if (selectedAcerto && selectedAcerto.id === id) {
      setSelectedAcerto(prev => prev ? { ...prev, status: "homologado" } : null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir o registro deste acerto de sacola?")) return;
    await sacolaService.deleteAcerto(id);
    await loadData();
    setActiveModal(null);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0e1726] border border-white/10 rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight font-display">
                Acerto de Sacolas & Materiais Institucionais
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Fingerprint className="w-3 h-3 text-emerald-400" />
                WebAuthn Biometria Ativa
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
              Preste contas de kits de revistas, Bíblias militares, devocionais e distintivos com fechamento de estoque, valores arrecadados e <strong>validação biométrica do dispositivo</strong> (Touch ID / Face ID / Windows Hello).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Acerto de Sacola
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-[#162338] hover:bg-[#1f304c] text-slate-300 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-white/5">
          <div className="bg-[#090f1a] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total de Sacolas</span>
            <span className="text-lg font-black text-white font-display mt-0.5 block">{acertos.length}</span>
          </div>
          <div className="bg-[#090f1a] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Homologadas</span>
            <span className="text-lg font-black text-emerald-400 font-display mt-0.5 block">
              {acertos.filter(a => a.status === "homologado").length}
            </span>
          </div>
          <div className="bg-[#090f1a] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Pendentes de Revisão</span>
            <span className="text-lg font-black text-amber-400 font-display mt-0.5 block">
              {acertos.filter(a => a.status === "pendente").length}
            </span>
          </div>
          <div className="bg-[#090f1a] p-3 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Movimentado</span>
            <span className="text-lg font-black text-teal-400 font-display mt-0.5 block">
              R$ {acertos.reduce((acc, a) => acc + (a.valorTotalArrecadado || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Acertos List / Table */}
      <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white font-display flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Histórico de Protocolos e Fechamentos
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {acertos.length} registro(s) encontrado(s)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Carregando registros de sacolas...
          </div>
        ) : acertos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
            <p>Nenhum acerto de sacola registrado até o momento.</p>
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Criar Primeiro Acerto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3">Sacola / Lote</th>
                  <th className="py-3 px-3">Militar Responsável</th>
                  <th className="py-3 px-3">Regional / OPM</th>
                  <th className="py-3 px-3">Data Acerto</th>
                  <th className="py-3 px-3 text-right">Valor Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Assinatura Biometria</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {acertos.map((acerto) => (
                  <tr key={acerto.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {acerto.numeroSacola}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{acerto.responsavelNome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        CPF: {acerto.responsavelCpf} {acerto.responsavelRgMilitar ? `• RG: ${acerto.responsavelRgMilitar}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {acerto.regional}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {acerto.dataAcerto}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                      R$ {acerto.valorTotalArrecadado?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        acerto.status === "homologado"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}>
                        {acerto.status === "homologado" ? "✓ Homologado" : "⏳ Pendente"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {acerto.biometricAuthenticated ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-mono font-bold" title={`Validado com ${acerto.biometricDeviceType || "WebAuthn"}`}>
                          <Fingerprint className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>Autenticado</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Eletrônica</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedAcerto(acerto);
                          setActiveModal("detalhes");
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Ver detalhes da sacola"
                      >
                        <Eye className="w-3 h-3" />
                        Detalhes
                      </button>

                      {isAdmin && acerto.status !== "homologado" && (
                        <button
                          onClick={() => handleHomologar(acerto.id)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Homologar Acerto"
                        >
                          <Check className="w-3 h-3" />
                          Homologar
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(acerto.id)}
                          className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg border border-rose-500/30 text-[10px] font-mono transition-all cursor-pointer inline-flex items-center"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: NOVO ACERTO DE SACOLA COM WEBAUTHN */}
      {activeModal === "novo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0e1726] border border-white/15 rounded-2xl shadow-2xl p-6 relative my-8 space-y-5 animate-fadeIn text-left">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight font-display">
                  Novo Acerto e Prestação de Contas de Sacola
                </h3>
                <p className="text-slate-400 text-xs">
                  Informe os materiais distribuídos, sobras físicas e finalize com a validação biométrica do dispositivo.
                </p>
              </div>
            </div>

            {feedbackMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                feedbackMsg.type === "error" ? "bg-rose-950/50 border-rose-500/40 text-rose-300" : "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
              }`}>
                {feedbackMsg.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAcerto} className="space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-[#080d16] p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Nº do Lote / Sacola:
                  </label>
                  <input
                    type="text"
                    value={numeroSacola}
                    onChange={(e) => setNumeroSacola(e.target.value)}
                    required
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Militar Responsável:
                  </label>
                  <input
                    type="text"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    required
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    CPF do Responsável:
                  </label>
                  <input
                    type="text"
                    value={responsavelCpf}
                    onChange={(e) => setResponsavelCpf(e.target.value)}
                    required
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    RG Militar / Matrícula:
                  </label>
                  <input
                    type="text"
                    value={responsavelRgMilitar}
                    onChange={(e) => setResponsavelRgMilitar(e.target.value)}
                    placeholder="Ex: 923412-0"
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Regional / Batalhão:
                  </label>
                  <input
                    type="text"
                    value={regional}
                    onChange={(e) => setRegional(e.target.value)}
                    required
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Data Retirada:
                    </label>
                    <input
                      type="date"
                      value={dataRetirada}
                      onChange={(e) => setDataRetirada(e.target.value)}
                      required
                      className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-2 py-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                      Data do Acerto:
                    </label>
                    <input
                      type="date"
                      value={dataAcerto}
                      onChange={(e) => setDataAcerto(e.target.value)}
                      required
                      className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-2 py-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Itens e Materiais na Sacola ({itens.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Outro Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#090f1a]">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-mono text-[9px] uppercase tracking-wider bg-white/[0.02]">
                        <th className="py-2.5 px-3">Descrição do Material</th>
                        <th className="py-2.5 px-2 text-center w-24">Unitário (R$)</th>
                        <th className="py-2.5 px-2 text-center w-20">Recebidos</th>
                        <th className="py-2.5 px-2 text-center w-20">Distribuídos</th>
                        <th className="py-2.5 px-2 text-center w-20">Devolvidos</th>
                        <th className="py-2.5 px-3 text-right w-28">Subtotal (R$)</th>
                        <th className="py-2.5 px-2 text-center w-12">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {itens.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.01]">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleItemChange(item.id, "descricao", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-amber-500 outline-none text-white text-xs py-1"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={item.precoUnitario}
                              onChange={(e) => handleItemChange(item.id, "precoUnitario", parseFloat(e.target.value) || 0)}
                              className="w-20 bg-[#121c2d] border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono text-xs focus:border-amber-500 outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtdRecebida}
                              onChange={(e) => handleItemChange(item.id, "qtdRecebida", parseInt(e.target.value) || 0)}
                              className="w-16 bg-[#121c2d] border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono text-xs focus:border-amber-500 outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.qtdRecebida}
                              value={item.qtdDistribuida}
                              onChange={(e) => handleItemChange(item.id, "qtdDistribuida", parseInt(e.target.value) || 0)}
                              className="w-16 bg-[#121c2d] border border-amber-500/40 rounded px-1.5 py-1 text-center text-amber-300 font-mono font-bold text-xs focus:border-amber-500 outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400 font-bold">
                            {item.qtdDevolvida}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-400">
                            R$ {item.valorTotalItem.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/10 bg-white/[0.03] font-mono font-bold text-xs">
                        <td colSpan={3} className="py-2.5 px-3 text-slate-300 uppercase text-[10px]">
                          Total Geral Distribuído:
                        </td>
                        <td className="py-2.5 px-2 text-center text-amber-400">
                          {itens.reduce((acc, curr) => acc + curr.qtdDistribuida, 0)} un.
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">
                          {itens.reduce((acc, curr) => acc + curr.qtdDevolvida, 0)} sobras
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 text-sm font-black">
                          R$ {valorTotalItens.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Formas de Pagamento & Balanço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#080d16] p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-teal-400" />
                    Depósito PIX (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorPix}
                    onChange={(e) => setValorPix(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-400" />
                    Dinheiro em Espécie (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorDinheiro}
                    onChange={(e) => setValorDinheiro(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-sky-400" />
                    Cartão / Outro (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorCartao}
                    onChange={(e) => setValorCartao(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121c2d] border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Observações / Detalhes de Distribuição:
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Recursos referentes ao culto do batalhão. Sobras de 5 revistas devolvidas à sede estadual..."
                  className="w-full bg-[#080d16] border border-white/10 rounded-xl p-3 text-white text-xs focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* WebAuthn Biometric Checkbox & Security Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#0c2420] to-[#0a182b] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useBiometrics}
                      onChange={(e) => setUseBiometrics(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-white/20"
                    />
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-emerald-400" />
                      Assinar e Homologar com Biometria do Dispositivo ({biometricLabel})
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    WebAuthn Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                  Ao acionar a biometria, o navegador solicitará sua impressão digital, Face ID ou Windows Hello para autenticar o fechamento da sacola com chave criptográfica sem envio de senhas.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {biometricPrompting ? "Aguardando Biometria..." : "Gravando Acerto..."}
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Concluir Acerto de Sacola
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO ACERTO SELECIONADO */}
      {activeModal === "detalhes" && selectedAcerto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0e1726] border border-white/15 rounded-2xl shadow-2xl p-6 relative my-8 space-y-5 animate-fadeIn text-left">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white tracking-tight font-display">
                    Protocolo {selectedAcerto.numeroSacola}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                    selectedAcerto.status === "homologado"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {selectedAcerto.status}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-mono">
                  Regional: {selectedAcerto.regional} • Data do Acerto: {selectedAcerto.dataAcerto}
                </p>
              </div>
            </div>

            {/* Biometric Verification Badge */}
            <div className="p-4 rounded-xl bg-[#081220] border border-teal-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold font-mono">
                <Fingerprint className="w-5 h-5 text-teal-400" />
                <span>Autenticação Biométrica WebAuthn</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Dispositivo / Método:</span>
                  <span className="font-bold text-white">{selectedAcerto.biometricDeviceType || "WebAuthn Biometria"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Timestamp da Assinatura:</span>
                  <span className="text-slate-300">{selectedAcerto.biometricTimestamp || selectedAcerto.createdAt || "Registrado"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Hash Criptográfico:</span>
                  <span className="text-teal-400 font-bold truncate block">{selectedAcerto.biometricSignatureHash || "WEBAUTHN-VALID"}</span>
                </div>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080d16] p-4 rounded-xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Responsável:</span>
                <span className="font-bold text-white block">{selectedAcerto.responsavelNome}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">CPF / RG:</span>
                <span className="font-bold text-white block">{selectedAcerto.responsavelCpf}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Data Retirada:</span>
                <span className="text-slate-300 block">{selectedAcerto.dataRetirada}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Valor Total:</span>
                <span className="font-black text-emerald-400 block text-sm">R$ {selectedAcerto.valorTotalArrecadado?.toFixed(2)}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Detalhamento dos Materiais
              </h4>
              <div className="border border-white/10 rounded-xl overflow-hidden bg-[#090f1a]">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono text-[9px] uppercase tracking-wider bg-white/[0.02]">
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Unitário</th>
                      <th className="py-2 px-2 text-center">Recebidos</th>
                      <th className="py-2 px-2 text-center">Distribuídos</th>
                      <th className="py-2 px-2 text-center">Devolvidos</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {selectedAcerto.itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-white">{item.descricao}</td>
                        <td className="py-2 px-2 text-center font-mono">R$ {item.precoUnitario.toFixed(2)}</td>
                        <td className="py-2 px-2 text-center font-mono">{item.qtdRecebida}</td>
                        <td className="py-2 px-2 text-center font-mono text-amber-400 font-bold">{item.qtdDistribuida}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-400">{item.qtdDevolvida}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">R$ {item.valorTotalItem.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="grid grid-cols-3 gap-3 bg-[#080d16] p-3 rounded-xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase text-slate-500 block">PIX:</span>
                <span className="font-bold text-white">R$ {(selectedAcerto.valorPix || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 block">Dinheiro:</span>
                <span className="font-bold text-white">R$ {(selectedAcerto.valorDinheiro || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-500 block">Cartão / Outro:</span>
                <span className="font-bold text-white">R$ {(selectedAcerto.valorCartao || 0).toFixed(2)}</span>
              </div>
            </div>

            {selectedAcerto.observacoes && (
              <div className="p-3 bg-[#080d16] rounded-xl border border-white/5 text-xs text-slate-300">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">Observações:</span>
                <p>{selectedAcerto.observacoes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>

              {isAdmin && selectedAcerto.status !== "homologado" && (
                <button
                  onClick={() => handleHomologar(selectedAcerto.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Homologar
                </button>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
