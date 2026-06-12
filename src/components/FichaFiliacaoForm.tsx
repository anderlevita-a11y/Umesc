import React, { useState, useRef, useEffect } from "react";
import { 
  FileCheck, ShieldCheck, Download, Trash2, Edit3, 
  Check, FileText, Printer, ShieldAlert, Wifi, Key, CreditCard, PenTool, Type
} from "lucide-react";
import { FichaFiliacao, MemberRegistration } from "../types";
import { generateFichaPdf } from "../lib/fichaPdfHelper";

interface FichaFiliacaoFormProps {
  loggedInUser: MemberRegistration;
  submittedFicha: FichaFiliacao | null;
  onFichaSubmitted: (ficha: FichaFiliacao) => void;
  onFichaDeleted?: () => void;
}

export default function FichaFiliacaoForm({ 
  loggedInUser, 
  submittedFicha, 
  onFichaSubmitted,
  onFichaDeleted
}: FichaFiliacaoFormProps) {
  
  // Signature Drawing Canvas States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Form Fields State
  const [organ, setOrgan] = useState<"PMSC 2801" | "BMSC 2802" | "OUTRO">("PMSC 2801");
  const [organOther, setOrganOther] = useState("");
  const [lotacaoMunicipio, setLotacaoMunicipio] = useState("");
  const [categoria, setCategoria] = useState<"ATIVA" | "PRESERVA_REMUNERADA" | "PENSIONISTA" | "REFORMADO">("ATIVA");
  const [matricula, setMatricula] = useState("");
  const [vinculo, setVinculo] = useState("1");
  const [birthDate, setBirthDate] = useState("");
  const [genero, setGenero] = useState<"M" | "F">("M");
  
  const [addressRua, setAddressRua] = useState("");
  const [addressBairro, setAddressBairro] = useState("");
  const [addressCep, setAddressCep] = useState("");
  const [addressCidade, setAddressCidade] = useState("");
  
  const [contactCidade, setContactCidade] = useState("");
  const [contactFones, setContactFones] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  
  const [opcaoAutorizacao, setOpcaoAutorizacao] = useState<1 | 2 | 3>(1);
  const [percentualDesconto, setPercentualDesconto] = useState<0.6 | 1.2 | 1.8 | 2.4 | 3.0>(1.2);
  const [percentualAnterior, setPercentualAnterior] = useState<0.6 | 1.2 | 1.8 | 2.4 | 3.0>(1.2);
  const [percentualNovo, setPercentualNovo] = useState<0.6 | 1.2 | 1.8 | 2.4 | 3.0>(1.8);
  
  const [dataInscricao, setDataInscricao] = useState("");
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaType, setAssinaturaType] = useState<"type" | "draw">("type");
  
  const [consent, setConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pre-fill initial state when user is defined
  useEffect(() => {
    if (loggedInUser) {
      const isBM = loggedInUser.militaryForce === "BM";
      const isPM = loggedInUser.militaryForce === "PM";
      
      setOrgan(isPM ? "PMSC 2801" : isBM ? "BMSC 2802" : "OUTRO");
      setOrganOther(isPM || isBM ? "" : loggedInUser.militaryForce || "");
      setLotacaoMunicipio(loggedInUser.city || "");
      setMatricula(loggedInUser.rgMilitar || "");
      setBirthDate(loggedInUser.birthDate || "");
      
      setAddressCidade(loggedInUser.city || "");
      setContactCidade(loggedInUser.city || "");
      setContactFones(loggedInUser.phone || "");
      setContactEmail(loggedInUser.email || "");
      
      setAssinaturaNome(loggedInUser.name || "");
      setDataInscricao(`${loggedInUser.city || "Florianópolis"}, ${new Date().toLocaleDateString("pt-BR")}`);
    }
  }, [loggedInUser]);

  // Handle signature Canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a"; // Professional blue ink

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit digital form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validations
    if (!lotacaoMunicipio.trim()) {
      setErrorMsg("O campo Lotação Município é obrigatório.");
      return;
    }
    if (!matricula.trim()) {
      setErrorMsg("O campo Matrícula é obrigatório.");
      return;
    }
    if (!addressRua.trim() || !addressBairro.trim() || !addressCep.trim() || !addressCidade.trim()) {
      setErrorMsg("Por favor, preencha todos os campos do Endereço Residencial.");
      return;
    }
    if (!contactCidade.trim() || !contactFones.trim() || !contactEmail.trim()) {
      setErrorMsg("Por favor, preencha todos os campos de Contato.");
      return;
    }
    if (!assinaturaNome.trim()) {
      setErrorMsg("O nome completo para assinatura eletrônica é obrigatório.");
      return;
    }
    if (assinaturaType === "draw" && !hasDrawn) {
      setErrorMsg("Por favor, faça seu desenho de assinatura no painel abaixo.");
      return;
    }
    if (!consent) {
      setErrorMsg("Você deve declarar a veracidade das informações e aceitar o preenchimento.");
      return;
    }

    // Capture Canvas data if drawn
    let drawnSignatureUrl = undefined;
    if (assinaturaType === "draw" && canvasRef.current) {
      drawnSignatureUrl = canvasRef.current.toDataURL("image/png");
    }

    // Generate cryptographic-like parameters
    const uuid = Math.random().toString(36).substring(2, 11).toUpperCase();
    const mockIP = `189.112.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
    const mockHashSeed = `${loggedInUser.cpf}-${new Date().toISOString()}-${uuid}`;
    
    // Type-safe simulated SHA256 sum
    let hashSum = 0;
    for (let idx = 0; idx < mockHashSeed.length; idx++) {
      hashSum = (hashSum * 31 + mockHashSeed.charCodeAt(idx)) & 0xffffffff;
    }
    const mockHash = "SHA256-" + Math.abs(hashSum).toString(16).toUpperCase() + uuid;

    const newFicha: FichaFiliacao = {
      id: "FL-" + uuid,
      memberCpf: loggedInUser.cpf,
      memberName: loggedInUser.name,
      organ,
      organOther: organ === "OUTRO" ? organOther : undefined,
      lotacaoMunicipio,
      categoria,
      matricula,
      vinculo,
      birthDate,
      genero,
      addressRua,
      addressBairro,
      addressCep,
      addressCidade,
      contactCidade,
      contactFones,
      contactEmail,
      opcaoAutorizacao,
      percentualDesconto: opcaoAutorizacao === 1 ? percentualDesconto : undefined,
      percentualAnterior: opcaoAutorizacao === 2 ? percentualAnterior : undefined,
      percentualNovo: opcaoAutorizacao === 2 ? percentualNovo : undefined,
      dataInscricao,
      assinaturaNome,
      assinaturaDesenho: drawnSignatureUrl,
      signatureDate: new Date().toLocaleString("pt-BR"),
      ipAddress: mockIP,
      securitySeal: mockHash,
    };

    // Save to localStorage
    const saved = localStorage.getItem("umesc_fichas_filiacao");
    let currentList: FichaFiliacao[] = [];
    if (saved) {
      try {
        currentList = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Filter existing from this member
    currentList = currentList.filter(f => f.memberCpf !== loggedInUser.cpf);
    currentList.push(newFicha);
    localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(currentList));

    setSuccessMsg("Ficha de Filiação enviada e assinada com sucesso!");
    onFichaSubmitted(newFicha);
    
    // Smooth scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download PDF helper
  const handleDownloadPdf = (ficha: FichaFiliacao) => {
    const blob = generateFichaPdf(ficha);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ficha_filiacao_${ficha.memberName.replace(/ /g, "_").toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If already submitted, show beautiful success/signed page
  if (submittedFicha) {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Certificate banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-950/20 to-teal-950/25 border border-emerald-500/20 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase font-display tracking-wide">Ficha de Filiação Cadastrada</h3>
                <p className="text-xs text-emerald-400 font-medium">Assinatura Eletrônica Certificada ICP-Brasil Simulada</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Código de Autenticidade: <span className="font-mono text-slate-300 font-bold">{submittedFicha.securitySeal}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleDownloadPdf(submittedFicha)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/10"
              >
                <Download className="w-4 h-4" /> Baixar PDF Oficial
              </button>
              
              {onFichaDeleted && (
                <button
                  onClick={() => {
                    if (confirm("Deseja realmente cancelar seu desconto e remover esta ficha de filiação? Suas informações serão removidas dos registros de consignação da UMESC.")) {
                      const saved = localStorage.getItem("umesc_fichas_filiacao");
                      if (saved) {
                        try {
                          const list = JSON.parse(saved) as FichaFiliacao[];
                          const filtered = list.filter(f => f.memberCpf !== loggedInUser.cpf);
                          localStorage.setItem("umesc_fichas_filiacao", JSON.stringify(filtered));
                          onFichaDeleted();
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }
                  }}
                  className="px-4 py-2 bg-[#0d141e] hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-white/5 hover:border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Cancelar / Excluir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Paper visualizer replica of physical SC form */}
        <div className="bg-white text-slate-950 rounded-2xl border border-slate-200 p-5 sm:p-8 max-w-4xl mx-auto shadow-2xl space-y-6 font-sans">
          
          {/* Top header of State Form */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center p-1 border border-slate-300">
              {/* Symbolic seal representing Santa Catarina */}
              <span className="text-[10px] font-black font-serif text-center leading-none text-emerald-800">SC<br/>BR</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xs uppercase font-serif tracking-widest font-bold text-slate-900 leading-tight">Estado de Santa Catarina</h2>
              <h1 className="text-sm uppercase font-black tracking-wider text-slate-950 leading-none mt-1">Autorização de Desconto/Cancelamento em Folha de Pagamento</h1>
            </div>
          </div>

          {/* Form grid mimicking table layout */}
          <div className="grid grid-cols-12 gap-px bg-slate-300 border border-slate-300 text-[11px]">
            
            {/* Header Block 1 */}
            <div className="col-span-4 bg-slate-50 p-2 border-slate-300">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Órgão</span>
              <span className="font-bold text-slate-900 font-mono">{submittedFicha.organ}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Lotação Município</span>
              <span className="font-bold text-slate-900">{submittedFicha.lotacaoMunicipio}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Categoria</span>
              <span className="font-bold text-slate-900">{submittedFicha.categoria.replace("_", " ")}</span>
            </div>

            {/* Consigned Entity */}
            <div className="col-span-8 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Entidade Consignada</span>
              <span className="font-bold text-slate-900">UMESC - União de Militares Evangélicos de Santa Catarina</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Código de Desconto</span>
              <span className="font-mono font-bold text-slate-900">05-0554-01</span>
            </div>

            {/* Servidor Section Title */}
            <div className="col-span-12 bg-slate-200 px-2 py-1 font-extrabold uppercase text-slate-700 text-[9px]">
              Servidor Consignado
            </div>

            {/* Servidor details */}
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Matrícula</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.matricula}</span>
            </div>
            <div className="col-span-2 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Vínculo</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.vinculo}</span>
            </div>
            <div className="col-span-6 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Nome Completo</span>
              <span className="font-bold text-slate-900 uppercase">{submittedFicha.memberName}</span>
            </div>

            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">CPF</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.memberCpf}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Data de Nascimento</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.birthDate}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Gênero</span>
              <span className="font-bold text-slate-900">{submittedFicha.genero === "M" ? "Masculino" : "Feminino"}</span>
            </div>

            {/* Endereco Title */}
            <div className="col-span-12 bg-slate-200 px-2 py-1 font-extrabold uppercase text-slate-700 text-[9px]">
              Endereço Residencial do Servidor
            </div>
            
            {/* Endereco details */}
            <div className="col-span-8 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Rua / Av. / Nº</span>
              <span className="font-bold text-slate-900">{submittedFicha.addressRua}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Bairro</span>
              <span className="font-bold text-slate-900">{submittedFicha.addressBairro}</span>
            </div>

            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">CEP</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.addressCep}</span>
            </div>
            <div className="col-span-8 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Cidade</span>
              <span className="font-bold text-slate-900">{submittedFicha.addressCidade}</span>
            </div>

            {/* Contato Title */}
            <div className="col-span-12 bg-slate-200 px-2 py-1 font-extrabold uppercase text-slate-700 text-[9px]">
              Contatos e Comunicação
            </div>

            {/* Contato details */}
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Cidade</span>
              <span className="font-bold text-slate-900">{submittedFicha.contactCidade}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">Fones</span>
              <span className="font-mono font-bold text-slate-900">{submittedFicha.contactFones}</span>
            </div>
            <div className="col-span-4 bg-slate-50 p-2">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500">E-mail</span>
              <span className="font-semibold text-slate-900">{submittedFicha.contactEmail}</span>
            </div>

            {/* Autorização Clause Title */}
            <div className="col-span-12 bg-slate-200 px-2 py-1 font-extrabold uppercase text-slate-700 text-[9px]">
              Autorização de Desconto em Folha de Pagamento (01)
            </div>

            {/* Choice Output */}
            <div className="col-span-12 bg-slate-50 p-3 leading-relaxed">
              {submittedFicha.opcaoAutorizacao === 1 && (
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-slate-800 text-white flex items-center justify-center font-bold text-xs rounded shrink-0">1</span>
                  <span>
                    <strong>AUTORIZO</strong> O SETORIAL/SECCIONAL DE GESTÃO DE PESSOAS DO ÓRGÃO EM QUE ESTOU LOTADO A <strong>DESCONTAR CONTRIBUIÇÃO MENSAL</strong>, NO PERCENTUAL DE <strong>{submittedFicha.percentualDesconto}%</strong> PARA A ENTIDADE ACIMA INDICADA (UMESC). A PRESENTE ASSINATURA NÃO INVALIDA EVENTUAIS DESCONTOS JÁ CONSIGNADOS EM FOLHA.
                  </span>
                </div>
              )}

              {submittedFicha.opcaoAutorizacao === 2 && (
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-slate-800 text-white flex items-center justify-center font-bold text-xs rounded shrink-0">2</span>
                  <span>
                    <strong>ALTERAR</strong> A CONTRIBUIÇÃO MENSAL DE <strong>{submittedFicha.percentualAnterior}%</strong> PARA <strong>{submittedFicha.percentualNovo}%</strong> DA ENTIDADE INDICADA (UMESC).
                  </span>
                </div>
              )}

              {submittedFicha.opcaoAutorizacao === 3 && (
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-slate-800 text-white flex items-center justify-center font-bold text-xs rounded shrink-0">3</span>
                  <span>
                    <strong>REQUER</strong> AO SETORIAL/SECCIONAL DE GESTÃO DE PESSOAS O <strong>CANCELAMENTO DO CÓDIGO DE DESCONTO</strong> CONSTANTE ACIMA DA FOLHA DE PAGAMENTO.
                  </span>
                </div>
              )}
            </div>

            {/* Signature Area Grid Block */}
            <div className="col-span-6 bg-slate-50 p-4 border-r border-slate-300">
              <span className="block text-[8px] font-extrabold uppercase text-slate-500 mb-2">Protocolo e data</span>
              <span className="font-medium text-slate-900 block lg:mt-5">{submittedFicha.dataInscricao}</span>
              <p className="text-[9px] text-slate-400 mt-2">Enviado e autenticado via Portal Intranet UMESC</p>
            </div>

            <div className="col-span-6 bg-slate-50 p-4 flex flex-col items-center justify-center text-center">
              <span className="block text-[8px] font-extrabold uppercase text-slate-400 mb-1">Assinatura do Associado</span>
              
              {submittedFicha.assinaturaDesenho ? (
                <img 
                  src={submittedFicha.assinaturaDesenho} 
                  alt="Assinatura Eletrônica" 
                  className="max-h-16 max-w-full border-b border-dashed border-slate-400 pb-1"
                />
              ) : (
                <span className="font-serif italic text-lg text-blue-900 font-extrabold tracking-wide border-b border-dashed border-slate-400 px-6 py-2 block" style={{ fontFamily: 'Georgia, serif' }}>
                  {submittedFicha.assinaturaNome}
                </span>
              )}
              
              <span className="text-[9px] text-slate-500 font-semibold block mt-2">Assinado Eletronicamente</span>
              <span className="text-[8px] text-emerald-600 font-mono mt-0.5 block">IP: {submittedFicha.ipAddress} - {submittedFicha.signatureDate}</span>
            </div>

          </div>

          {/* Cryptographic Certification Footprint footer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-250">
              <Key className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 space-y-1">
              <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">Selo Eletrônico de Integridade (Prerrogativa MP 2.200-2/01)</span>
              <span className="block font-mono text-[9px] text-slate-600 font-bold break-all leading-tight">
                {submittedFicha.securitySeal} • PROTOCOLO DIGITAL {submittedFicha.id}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show active, beautiful live prefilling form
  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left animate-fadeIn">
      {/* Intro banner */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 to-[#121c2c] border border-amber-500/15 rounded-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-xs text-white uppercase font-display tracking-wider">Onboarding Eletrônico UMESC</h4>
          <p className="text-xs text-slate-400 mt-1">
            Preencha os dados e assine digitalmente a ficha oficial para a <strong>União de Militares Evangélicos de SC</strong>. Os dados preenchidos serão salvos para consolidação legal de consignação na folha de pagamento junto à corporação (PMSC ou BMSC).
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/25 text-rose-300 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main split work: Form Inputs (Left) and live paper preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Inputs Form */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Dynamic Pending/Incomplete Fields Tracker */}
          {(() => {
            const missing = [];
            if (!lotacaoMunicipio.trim()) missing.push("Lotação Município");
            if (!matricula.trim()) missing.push("Matrícula Militar");
            if (!addressRua.trim()) missing.push("Rua / Avenida / Número");
            if (!addressBairro.trim()) missing.push("Bairro (Residência)");
            if (!addressCep.trim()) missing.push("CEP (Residência)");
            if (!addressCidade.trim()) missing.push("Cidade (Residência)");
            if (!contactCidade.trim()) missing.push("Cidade de Contatos");
            if (!contactFones.trim()) missing.push("Telefones / Fones");
            if (!contactEmail.trim()) missing.push("E-mail de Contato");
            if (!birthDate.trim()) missing.push("Data de Nascimento");
            if (assinaturaType === "type" && !assinaturaNome.trim()) missing.push("Nome Assinatura Eletrônica");
            if (assinaturaType === "draw" && !hasDrawn) missing.push("Desenho da Assinatura");
            if (!consent) missing.push("Aceitar Termos e Consentimento");

            if (missing.length > 0) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide font-mono">
                      Campos Pendentes para Filiação ({missing.length})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Faltam preencher as seguintes informações obrigatórias para poder assinar e enviar o contrato digital UMESC:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-1 py-1">
                    {missing.map((field, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-[11px] text-amber-200/85 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-md animate-pulse"></span>
                        <span className="truncate">{field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/15 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                      Tudo Pronto para Assinar!
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-semibold">
                      Todos os dados obrigatórios foram inseridos. Marque o termo de declaração abaixo e envie a ficha.
                    </span>
                  </div>
                </div>
              );
            }
          })()}

          {/* Section: Organ e Categoria */}
          <div className="p-4 bg-[#111d2d] rounded-xl border border-white/5 space-y-4">
            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-display">1. Corporação & Categoria</h5>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Órgão Vinculado</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "PMSC 2801", label: "PMSC 2801" },
                    { id: "BMSC 2802", label: "BMSC 2802" },
                    { id: "OUTRO", label: "OUTRO" }
                  ].map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrgan(o.id as any)}
                      className={`py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        organ === o.id
                          ? "bg-amber-500 text-slate-950 border-transparent font-black shadow-lg shadow-amber-500/10"
                          : "bg-[#0b1320] text-slate-300 border-white/5 hover:bg-[#162539]"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {organ === "OUTRO" && (
                  <input
                    type="text"
                    placeholder="Especifique outro órgão (ex: Civil/Apoiador)"
                    value={organOther}
                    onChange={(e) => setOrganOther(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-[#0b1320] text-white border border-white/10 rounded-lg text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                    <span>Lotação Município</span>
                    {!lotacaoMunicipio.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={lotacaoMunicipio}
                    onChange={(e) => setLotacaoMunicipio(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !lotacaoMunicipio.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Ex: Florianópolis"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                    <span>Matrícula Militar</span>
                    {!matricula.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !matricula.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Matrícula"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                    <span>Vínculo</span>
                    {!vinculo.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">*</span>}
                  </label>
                  <input
                    type="text"
                    value={vinculo}
                    onChange={(e) => setVinculo(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !vinculo.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                    <span>Nascimento</span>
                    {!birthDate.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !birthDate.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Gênero</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGenero("M")}
                      className={`py-2 text-[10px] font-bold rounded border text-center transition-all cursor-pointer ${
                        genero === "M"
                          ? "bg-teal-500 text-slate-950 border-transparent font-black"
                          : "bg-[#0b1320] text-slate-300 border-white/5"
                      }`}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenero("F")}
                      className={`py-2 text-[10px] font-bold rounded border text-center transition-all cursor-pointer ${
                        genero === "F"
                          ? "bg-teal-500 text-slate-950 border-transparent font-black"
                          : "bg-[#0b1320] text-slate-300 border-white/5"
                      }`}
                    >
                      F
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoria Funcional</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { id: "ATIVA", label: "Ativa" },
                    { id: "PRESERVA_REMUNERADA", label: "Preserva Remunerada" },
                    { id: "PENSIONISTA", label: "Pensionista" },
                    { id: "REFORMADO", label: "Reformado" }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoria(c.id as any)}
                      className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        categoria === c.id
                          ? "bg-emerald-600 text-slate-950 border-transparent font-black"
                          : "bg-[#0b1320] text-slate-300 border-white/5"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Section: Residence Address */}
          <div className="p-4 bg-[#111d2d] rounded-xl border border-white/5 space-y-4">
            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-display">2. Endereço & Contatos</h5>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                  <span>Rua / Avenida / Número</span>
                  {!addressRua.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                </label>
                <input
                  type="text"
                  value={addressRua}
                  onChange={(e) => setAddressRua(e.target.value)}
                  className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                    !addressRua.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                  }`}
                  placeholder="Ex: Av. Beira Mar, 1000, Apto 302"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>Bairro</span>
                    {!addressBairro.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={addressBairro}
                    onChange={(e) => setAddressBairro(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !addressBairro.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Ex: Centro"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>CEP</span>
                    {!addressCep.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={addressCep}
                    onChange={(e) => setAddressCep(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !addressCep.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Ex: 88000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>Cidade (Residência)</span>
                    {!addressCidade.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={addressCidade}
                    onChange={(e) => setAddressCidade(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !addressCidade.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>Cidade Contatos</span>
                    {!contactCidade.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={contactCidade}
                    onChange={(e) => setContactCidade(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !contactCidade.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>Telefone / Fone</span>
                    {!contactFones.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={contactFones}
                    onChange={(e) => setContactFones(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !contactFones.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Ex: (48) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>E-mail</span>
                    {!contactEmail.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#0b1320] text-white border rounded-lg text-xs transition-all ${
                      !contactEmail.trim() ? "border-amber-500/30 focus:border-amber-500" : "border-white/10 focus:border-teal-500"
                    }`}
                    placeholder="Ex: militar@example.com"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Section: Autorização Option */}
          <div className="p-4 bg-[#111d2d] rounded-xl border border-white/5 space-y-4">
            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-display">3. Opção de Desconto / Operação</h5>
            
            <div className="space-y-4">
              {[
                { id: 1, text: "1. AUTORIZAR DESCONTO MENSAL" },
                { id: 2, text: "2. ALTERAR PERCENTUAL ATUAL" },
                { id: 3, text: "3. CANCELAMENTO DO DESCONTO" }
              ].map(opt => (
                <label 
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 bg-[#0b1320] rounded-lg border transition-all cursor-pointer ${
                    opcaoAutorizacao === opt.id
                      ? "border-amber-500 bg-[#162135]"
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="opcao_autorizacao"
                    checked={opcaoAutorizacao === opt.id}
                    onChange={() => setOpcaoAutorizacao(opt.id as any)}
                    className="mt-1 text-amber-500 accent-amber-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">{opt.text}</span>
                    {opt.id === 1 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Autoriza desconto mensal voluntário do percentual selecionado em folha de pagamento.
                      </p>
                    )}
                    {opt.id === 2 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Substitui o percentual de desconto antigo por um novo.
                      </p>
                    )}
                    {opt.id === 3 && (
                      <p className="text-[10px] text-rose-300 mt-1">
                        Atenção: Solicita o encerramento do código de repasse e a desvinculação financeira.
                      </p>
                    )}
                  </div>
                </label>
              ))}

              {opcaoAutorizacao === 1 && (
                <div className="p-3 bg-[#0b1320] rounded-xl border border-white/5 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Percentual de Desconto</span>
                  <div className="grid grid-cols-5 gap-1.5 text-xs">
                    {([0.6, 1.2, 1.8, 2.4, 3.0] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPercentualDesconto(p)}
                        className={`py-1.5 bg-[#121c2d] border text-center font-bold rounded cursor-pointer transition-all ${
                          percentualDesconto === p
                            ? "border-amber-500 text-amber-500 bg-amber-500/10 font-black"
                            : "border-white/5 text-slate-350 hover:bg-[#1a283e]"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {opcaoAutorizacao === 2 && (
                <div className="p-3 bg-[#0b1320] rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">De (Anterior)</span>
                    <select
                      value={percentualAnterior}
                      onChange={(e) => setPercentualAnterior(Number(e.target.value) as any)}
                      className="w-full px-2 py-1.5 bg-[#121c2d] border border-white/10 text-white text-xs rounded-lg font-bold"
                    >
                      {[0.6, 1.2, 1.8, 2.4, 3.0].map(v => (
                        <option key={v} value={v}>{v}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Para (Novo)</span>
                    <select
                      value={percentualNovo}
                      onChange={(e) => setPercentualNovo(Number(e.target.value) as any)}
                      className="w-full px-2 py-1.5 bg-[#121c2d] border border-white/10 text-white text-xs rounded-lg font-bold"
                    >
                      {[0.6, 1.2, 1.8, 2.4, 3.0].map(v => (
                        <option key={v} value={v}>{v}%</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Section: Electronic Signature Pad */}
          <div className="p-4 bg-[#111d2d] rounded-xl border border-white/5 space-y-4">
            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-display flex items-center gap-1.5">
              <span>4. Assinatura Eletrônica Certificada</span>
            </h5>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssinaturaType("type")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assinaturaType === "type"
                      ? "bg-amber-500 text-slate-950 border-transparent font-black"
                      : "bg-[#0b1320] text-slate-300 border-white/5"
                  }`}
                >
                  <Type className="w-4 h-4" /> Escrever Texto
                </button>

                <button
                  type="button"
                  onClick={() => setAssinaturaType("draw")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    assinaturaType === "draw"
                      ? "bg-amber-500 text-slate-950 border-transparent font-black"
                      : "bg-[#0b1320] text-slate-300 border-white/5"
                  }`}
                >
                  <PenTool className="w-4 h-4" /> Desenhar com Mouse/Dedo
                </button>
              </div>

              {assinaturaType === "type" ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                    <span>Nome Completo para Assinatura</span>
                    {!assinaturaNome.trim() && <span className="text-amber-500 font-extrabold font-mono text-[9px] animate-pulse">* PENDENTE</span>}
                  </label>
                  <input
                    type="text"
                    value={assinaturaNome}
                    onChange={(e) => setAssinaturaNome(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1320] text-white border border-white/10 rounded-lg text-xs font-semibold"
                    placeholder="Digite seu nome exatamente como no registro"
                  />
                  <div className="mt-3 p-3 bg-[#080d16] rounded-lg border border-dashed border-white/10 text-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Visualização da Assinatura Digital</span>
                    <span className="text-xl text-blue-400 font-extrabold italic select-none" style={{ fontFamily: 'Georgia, serif' }}>
                      {assinaturaNome || "Nome Assinado"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Assine no espaço abaixo</label>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[10px] font-black text-rose-450 hover:text-rose-400 uppercase tracking-wider bg-slate-950/40 px-2 py-1 rounded border border-white/5 cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-slate-300 overflow-hidden cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full block bg-slate-50"
                    />
                  </div>
                  <span className="block text-[9px] text-slate-450 text-center italic mt-1 leading-tight">
                    * Use seu cursor (PC) ou o dedo (Mobile/Tablet) para assinar de forma fluida.
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Consent / Terms */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-300 font-medium select-none cursor-pointer p-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 text-amber-500 accent-amber-500 rounded"
              />
              <span>
                Eu declaro, sob as penas do Art. 299 do Código Penal, que todas as informações acima declaradas são verídicas. Autorizo a Unidade Gestora Consignatária a repassar e operacionalizar as contribuições supracitadas à UMESC nos termos acordados sob os regramentos da LGPD (Lei 13.709/2018).
              </span>
            </label>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-lg text-xs uppercase font-extrabold tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                consent
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 font-black shadow-xl shadow-amber-500/10"
                  : "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
              }`}
              disabled={!consent}
            >
              <FileCheck className="w-4 h-4 font-bold" /> Enviar e Autenticar Ficha Eletronicamente
            </button>
          </div>

        </div>

        {/* Right Side: LIVE physical paper replica preview */}
        <div className="lg:col-span-7 bg-slate-900 overflow-x-auto p-2 lg:p-4 rounded-xl border border-white/5 self-start">
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-[9px] font-black uppercase tracking-wider border border-teal-500/15">
              <Wifi className="w-3 h-3 text-teal-400 animate-pulse" /> Visualizador do Documento em Tempo Real
            </span>
            <p className="text-[10px] text-slate-450 mt-1 leading-tight">
              Os dados preenchidos ao lado alimentam a folha física oficial representativa abaixo.
            </p>
          </div>

          <div className="bg-white text-slate-950 p-4 sm:p-6 w-[210mm] max-w-full mx-auto shadow-xl space-y-4 text-[9px] font-sans border border-slate-200 select-none scale-95 origin-top">
            
            {/* Header */}
            <div className="border-b border-slate-800 pb-2.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded border border-slate-300 flex items-center justify-center text-[8px] font-serif font-black text-emerald-800">
                SC
              </div>
              <div className="text-left flex-1">
                <span className="block text-[8px] font-serif tracking-widest uppercase font-bold text-slate-800">Estado de Santa Catarina</span>
                <span className="block text-[9px] font-black uppercase tracking-wide text-slate-950 leading-tight">Autorização de Desconto/Cancelamento em Folha de Pagamento</span>
              </div>
            </div>

            {/* Simulated Grid layout */}
            <div className="grid grid-cols-12 gap-px bg-slate-300 border border-slate-300 text-[9px]">
              
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Órgão</span>
                <span className="font-mono font-bold text-slate-900">{organ === "OUTRO" ? (organOther || "OUTRO") : organ}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Lotação Município</span>
                <span className="font-bold text-slate-900">{lotacaoMunicipio || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Categoria</span>
                <span className="font-bold text-slate-900">{categoria.replace("_", " ")}</span>
              </div>

              <div className="col-span-8 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Entidade Consignada</span>
                <span className="font-semibold text-slate-900">UMESC - União de Militares Evangélicos de Santa Catarina</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Código de Desconto</span>
                <span className="font-mono font-bold text-slate-800">05-0554-01</span>
              </div>

              <div className="col-span-12 bg-slate-200 px-1.5 py-0.5 text-left font-black uppercase text-slate-700 text-[8px]">
                Dados do Servidor Consignado
              </div>

              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Matrícula</span>
                <span className="font-mono font-bold text-slate-900">{matricula || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-2 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Vínculo</span>
                <span className="font-mono font-bold text-slate-900">{vinculo}</span>
              </div>
              <div className="col-span-6 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Nome Completo</span>
                <span className="font-bold text-slate-900 uppercase">{loggedInUser.name}</span>
              </div>

              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">CPF</span>
                <span className="font-mono font-bold text-slate-900">{loggedInUser.cpf}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Data de Nascimento</span>
                <span className="font-mono font-bold text-slate-900">{birthDate || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Gênero</span>
                <span className="font-bold text-slate-900">{genero === "M" ? "M" : "F"}</span>
              </div>

              {/* Endereco Residencial */}
              <div className="col-span-12 bg-slate-200 px-1.5 py-0.5 text-left font-black uppercase text-slate-700 text-[8px]">
                Endereço Residencial do Servidor
              </div>

              <div className="col-span-8 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Rua / Av / Nº</span>
                <span className="font-bold text-slate-950 font-sans">{addressRua || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Bairro</span>
                <span className="font-bold text-slate-950">{addressBairro || "(NÃO PREENCHIDO)"}</span>
              </div>

              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">CEP</span>
                <span className="font-mono font-bold text-slate-955">{addressCep || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-8 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Cidade</span>
                <span className="font-bold text-slate-950">{addressCidade || "(NÃO PREENCHIDO)"}</span>
              </div>

              {/* Contatos */}
              <div className="col-span-12 bg-slate-200 px-1.5 py-0.5 text-left font-black uppercase text-slate-700 text-[8px]">
                Contatos e Comunicação
              </div>

              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Cidade</span>
                <span className="font-bold text-slate-950">{contactCidade || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">Fones</span>
                <span className="font-mono font-bold text-slate-950">{contactFones || "(NÃO PREENCHIDO)"}</span>
              </div>
              <div className="col-span-4 bg-slate-50 p-1.5 text-left">
                <span className="block text-[7px] font-bold uppercase text-slate-550">E-mail</span>
                <span className="font-bold text-slate-950">{contactEmail || "(NÃO PREENCHIDO)"}</span>
              </div>

              {/* Opcao de Autorizacao visual text */}
              <div className="col-span-12 bg-slate-200 px-1.5 py-0.5 text-left font-black uppercase text-slate-700 text-[8px]">
                Cláusula de Autorização / Cancelamento (01)
              </div>

              <div className="col-span-12 bg-slate-100 p-2.5 text-left space-y-1.5 leading-tight">
                <div className={`p-1.5 rounded border transition-all ${opcaoAutorizacao === 1 ? "bg-slate-300 border-slate-400 inline-block w-full font-semibold" : "opacity-45 bg-[#fdfdfd]"}`}>
                  <span>[ {opcaoAutorizacao === 1 ? "X" : " "} ] 1 - <strong>AUTORIZO</strong> o desconto mensal consignado em folha de: <strong>{percentualDesconto}%</strong></span>
                </div>
                <div className={`p-1.5 rounded border transition-all ${opcaoAutorizacao === 2 ? "bg-slate-300 border-slate-400 inline-block w-full font-semibold" : "opacity-45 bg-[#fdfdfd]"}`}>
                  <span>[ {opcaoAutorizacao === 2 ? "X" : " "} ] 2 - <strong>ALTERAR</strong> percentual atual de: <strong>{percentualAnterior}%</strong> para: <strong>{percentualNovo}%</strong></span>
                </div>
                <div className={`p-1.5 rounded border transition-all ${opcaoAutorizacao === 3 ? "bg-slate-350 border-rose-400 inline-block w-full text-rose-950 px-2 py-1 select-none font-semibold" : "opacity-45 bg-[#fdfdfd]"}`}>
                  <span>[ {opcaoAutorizacao === 3 ? "X" : " "} ] 3 - <strong>REQUERER CANCELAMENTO</strong> do código de desconto consignado</span>
                </div>
              </div>

              {/* Assinatura preview block */}
              <div className="col-span-6 bg-slate-50 p-3 text-left border-r border-slate-300 flex flex-col justify-between">
                <div>
                  <span className="block text-[7px] font-bold uppercase text-slate-450 mb-1">Local e data</span>
                  <span className="font-serif italic text-slate-800 leading-tight block">{dataInscricao || "(NÃO INICIADO)"}</span>
                </div>
                <p className="text-[7.5px] text-slate-400 mt-2">Autenticação por IP de rede do associado</p>
              </div>

              <div className="col-span-6 bg-slate-50 p-3 text-center flex flex-col items-center justify-center min-h-[70px]">
                <span className="block text-[7px] font-black uppercase text-slate-400 mb-1">Assinatura Eletrônica do Associado</span>
                
                {assinaturaType === "draw" && hasDrawn ? (
                  <span className="text-[8px] font-mono text-emerald-800 font-extrabold flex items-center gap-1 bg-emerald-100 border border-emerald-350 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> ASSINATURA DRAW PRONTA
                  </span>
                ) : (
                  <span className="font-serif italic text-xs text-blue-900 border-b border-dashed border-slate-400 px-6 leading-tight select-none mt-2 block" style={{ fontFamily: 'Georgia, serif' }}>
                    {assinaturaNome || "(DIGITE NOME AO LADO)"}
                  </span>
                )}
                
                <span className="text-[6.5px] text-slate-500 font-bold block mt-1.5 uppercase tracking-wider">Pelo Portal Intranet UMESC</span>
              </div>

            </div>

            {/* Cryptographic certified sealing mockup */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2 text-left">
              <div className="w-6.5 h-6.5 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300/20">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-sans text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Acreditação Legal e Conformidade MP nº 2.200-2</span>
                <span className="block font-mono text-[7px] text-slate-400">Autenticação pendente até o clique em "Enviar e Autenticar Ficha"</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </form>
  );
}
