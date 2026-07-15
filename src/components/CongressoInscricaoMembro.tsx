import React, { useState, useEffect } from "react";
import { 
  Calendar, MapPin, DollarSign, BookOpen, Clock, Check, X, 
  QrCode, UploadCloud, Copy, FileCheck, Info, FileText, Printer, ShieldAlert,
  ChevronRight, Sparkles, Users, Share2, Send, User
} from "lucide-react";
import { congressService, Congress, CongressInscription, Workshop } from "../lib/congressService.ts";
import { MemberRegistration } from "../types";

export function generatePixString(pixKey: string, amount: number, receiverName: string): string {
  if (!pixKey) return "";
  if (pixKey.startsWith("000201")) {
    return pixKey;
  }

  const formatParam = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  const cleanKey = pixKey.trim();
  const cleanName = (receiverName || "UMESC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // alphanumeric only
    .slice(0, 25) // limits length
    .trim()
    .toUpperCase();

  // 1. Payload Format Indicator (ID 00)
  let payload = formatParam("00", "01");

  // 2. Merchant Account Information (ID 26)
  const merchantAccInfo_GUI = formatParam("00", "br.gov.bcb.pix");
  const merchantAccInfo_key = formatParam("01", cleanKey);
  const merchantAccountInfo = formatParam("26", merchantAccInfo_GUI + merchantAccInfo_key);
  payload += merchantAccountInfo;

  // 3. Merchant Category Code (ID 52)
  payload += formatParam("52", "0000");

  // 4. Transaction Currency (ID 53) - 986 for BRL
  payload += formatParam("53", "986");

  // 5. Transaction Amount (ID 54)
  payload += formatParam("54", amount.toFixed(2));

  // 6. Country Code (ID 58)
  payload += formatParam("58", "BR");

  // 7. Merchant Name (ID 59)
  payload += formatParam("59", cleanName || "UMESC");

  // 8. Merchant City (ID 60)
  payload += formatParam("60", "FLORIANOPOLIS");

  // 9. Additional Data Field (ID 62)
  const txid = formatParam("05", "***");
  payload += formatParam("62", txid);

  // 10. CRC16 Flag (ID 63)
  payload += "6304";

  // Cyclic Redundancy Check (CRC16 CCITT)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  const crcString = crc.toString(16).toUpperCase().padStart(4, "0");
  return `${payload}${crcString}`;
}

interface CongressoInscricaoMembroProps {
  loggedInUser: MemberRegistration;
}

export default function CongressoInscricaoMembro({ loggedInUser }: CongressoInscricaoMembroProps) {
  const [congresses, setCongresses] = useState<Congress[]>([]);
  const [selectedCongressId, setSelectedCongressId] = useState<string>("");
  const [myInscription, setMyInscription] = useState<CongressInscription | null>(null);

  // Selections during signup wizard
  const [chosenWsIds, setChosenWsIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [memberPhotoUrl, setMemberPhotoUrl] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Payment proof simulation states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fakeFileName, setFakeFileName] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedPixString, setCopiedPixString] = useState(false);

  useEffect(() => {
    if (loggedInUser && loggedInUser.photoUrl) {
      setMemberPhotoUrl(loggedInUser.photoUrl);
    }
    loadCongressData();

    // Subscribe to background data synchronization events
    const refresh = () => {
      loadCongressData();
    };
    window.addEventListener("umesc-data-sync", refresh);
    return () => window.removeEventListener("umesc-data-sync", refresh);
  }, [loggedInUser, selectedCongressId]);

  const loadCongressData = () => {
    const list = congressService.getCongresses().filter(c => c.status === "open" && c.isActive !== false);
    setCongresses(list);
    
    // Default to the first open congress
    if (list.length > 0 && !selectedCongressId) {
      setSelectedCongressId(list[0].id);
    }

    // Lookup if this member already has an inscription for the selected/active congress
    updateMyInscriptionState(selectedCongressId || (list[0]?.id || ""));
  };

  const updateMyInscriptionState = (congId: string) => {
    if (!congId) return;
    const allIns = congressService.getInscriptions();
    const found = allIns.find(i => i.congressId === congId && i.memberCpf === loggedInUser.cpf);
    
    if (found) {
      setMyInscription(found);
      setChosenWsIds(found.selectedWorkshopIds);
    } else {
      setMyInscription(null);
      setChosenWsIds([]);
    }
  };

  const activeCongress = congresses.find(c => c.id === selectedCongressId);

  const handleSelectCongress = (congId: string) => {
    setSelectedCongressId(congId);
    updateMyInscriptionState(congId);
  };

  // Select/Deselect workshops and handle capacity bounds validation
  const handleToggleWorkshopSelection = (ws: Workshop) => {
    if (myInscription) return; // Cant change after registered!

    if (chosenWsIds.includes(ws.id)) {
      setChosenWsIds(prev => prev.filter(id => id !== ws.id));
    } else {
      // Check remaining capacity capacity check
      if (ws.registeredCount >= ws.capacity) {
        alert(`Impossível selecionar: O workshop "${ws.title}" já está com todas as vagas esgotadas para este congresso.`);
        return;
      }
      setChosenWsIds(prev => [...prev, ws.id]);
    }
  };

  // Confirm registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCongress) return;
    
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const rankAndName = `${loggedInUser.rank || "Membro"} ${loggedInUser.name}`;
      
      const created = congressService.addInscription({
        congressId: activeCongress.id,
        congressTitle: activeCongress.title,
        memberCpf: loggedInUser.cpf,
        memberName: loggedInUser.name,
        memberEmail: loggedInUser.email || "contato@umesc.org.br",
        memberPhone: loggedInUser.phone || "(48) 99999-9999",
        memberRank: loggedInUser.rank || "Membro",
        selectedWorkshopIds: chosenWsIds,
        paymentStatus: activeCongress.price === 0 ? "pago" : "pendente",
        memberPhotoUrl: memberPhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
      });

      setMyInscription(created);
      // Hot reload listing to reflect updated totals
      const freshList = congressService.getCongresses();
      setCongresses(freshList);
    } catch (err: any) {
      setSubmitError(err?.message || "Ocorreu um erro ao emitir a solicitação de inscrição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate copy PIX key
  const handleCopyPixKey = () => {
    if (activeCongress) {
      navigator.clipboard.writeText(activeCongress.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  // Copy full PIX Copia e Cola string
  const handleCopyPixString = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPixString(true);
    setTimeout(() => setCopiedPixString(false), 2500);
  };

  // Payment proof drag & drop simulated attach
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFakeFileName(file.name);
    }
  };

  const handleFakeFileUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myInscription || (!selectedFile && !fakeFileName)) return;

    setIsUploadingProof(true);

    const proceedWithUpload = (proofUrl: string) => {
      const name = fakeFileName || "comprovante_transfer_pix.pdf";
      const updated = congressService.updateInscriptionStatus(
        myInscription.id, 
        "em_analise", 
        proofUrl, 
        name
      );

      if (updated) {
        setMyInscription(updated);
        // Sync lister to ensure admin side sees it immediately
        loadCongressData();
      }
      setIsUploadingProof(false);
      setSelectedFile(null);
      alert("Comprovante anexado! A Diretoria UMESC foi notificada e fará o batimento bancário do PIX. Seu ingresso será liberado.");
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
      }, 1200);
    }
  };

  const handleShareWhatsapp = () => {
    if (!activeCongress || !myInscription) return;
    
    // Exact terms as rendered on the high-fidelity visual credential card
    const credencialStatus = myInscription.paymentStatus === "pago" ? "HOMOLOGADO" : "PENDENTE";
    const categoriaCredencial = myInscription.paymentStatus === "pago" ? "CONGRESSISTA" : "RESERVA PROV";
    const tokenVoucher = myInscription.qrCodeToken;
    
    const wsText = myInscription.selectedWorkshopIds.length > 0
      ? myInscription.selectedWorkshopIds.map((id, idx) => {
          const matched = activeCongress.workshops.find(w => w.id === id);
          return `  ${idx + 1}. ${matched?.title || "Workshop Acadêmico"}`;
        }).join("\n")
      : "  - Nenhum workshop opcional selecionado.";

    const textMessage = `*VOUCHER CREDENCIAL DE ACESSO OFICIAL UMESC-SC* 🎫\n` +
      `=================================\n` +
      `*Acreditação/Membro:* ${myInscription.memberName.toUpperCase()}\n` +
      `*Posto / Graduação:* ${(myInscription.memberRank || "Membro").toUpperCase()}\n` +
      `*CPF Cadastrado:* ${myInscription.memberCpf}\n` +
      `=================================\n` +
      `*STATUS DA HOMOLOGAÇÃO:* ${credencialStatus}\n` +
      `*CLASSE DA CREDENCIAL:* ${categoriaCredencial}\n` +
      `*TOKEN DO VOUCHER:* ${tokenVoucher}\n` +
      `=================================\n` +
      `*Evento:* ${activeCongress.title}\n` +
      `*Período:* ${activeCongress.date}\n` +
      `*Local:* ${activeCongress.location}\n` +
      `=================================\n` +
      `*Módulos e Salas Reservadas:*\n${wsText}\n\n` +
      `Apresente esta credencial oficial na portaria do evento. O Staff da UMESC efetuará a leitura do seu QR Code (${tokenVoucher}) para confecção do seu crachá físico.\n\n` +
      `*União de Militares Evangélicos de Santa Catarina*\n_Credencial oficial gerada via Sistema Integrado UMESC_`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textMessage)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title & Introduction header block */}
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display uppercase">
          <Calendar className="w-5 h-5 text-amber-500" />
          Congressos e Eventos de Santa Catarina
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Efetue sua inscrição oficial nos simpósios, escolha os workshops de capacitação e retire seu QR Code de check-in na portaria militar.
        </p>
      </div>

      {/* Gorgeous Showcase Grid of available open Congresses */}
      {congresses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-black tracking-widest text-amber-500 font-mono uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Selecione o Evento para Inscrição ou Ver Voucher
            </h4>
            <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded bg-[#0b131f] border border-white/5 text-slate-400 font-mono font-bold">
              {congresses.length} {congresses.length === 1 ? "Evento Disponível" : "Eventos Disponíveis"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {congresses.map((c) => {
              const ins = congressService.getInscriptions().find(i => i.congressId === c.id && i.memberCpf === loggedInUser.cpf);
              const isSelected = c.id === selectedCongressId;
              
              return (
                <div
                  key={c.id}
                  id={`congress-card-${c.id}`}
                  onClick={() => handleSelectCongress(c.id)}
                  className={`group rounded-2xl p-5 border text-left transition-all duration-300 transform cursor-pointer relative overflow-hidden flex flex-col justify-between h-full hover:-translate-y-0.5 ${
                    isSelected
                      ? "bg-gradient-to-b from-[#182941] to-[#0f1b2d] border-amber-500/80 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
                      : "bg-[#111c2a] border-white/5 hover:border-white/10 hover:bg-[#152336] shadow-sm"
                  }`}
                >
                  {/* Subtle hover blur glow */}
                  {isSelected && (
                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                  )}
                  
                  <div className="space-y-3">
                    {/* Upper Badges Block */}
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider font-mono ${
                        ins
                          ? ins.paymentStatus === 'pago'
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : ins.paymentStatus === 'em_analise'
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse"
                              : "bg-orange-500/15 border border-orange-500/25 text-orange-400"
                          : "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                      }`}>
                        {ins
                          ? ins.paymentStatus === 'pago'
                            ? "✓ INSCRITO • ATIVO"
                            : ins.paymentStatus === 'em_analise'
                              ? "✦ EM AUDITORIA"
                              : "⚠ COMPROVANTE PENDENTE"
                          : "INSCRIÇÕES ABERTAS"}
                      </span>

                      <div className="text-right flex items-center gap-1 text-xs font-mono font-black text-amber-400">
                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                        <span>{c.price === 0 ? "Entrada Franca" : "R$ " + c.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h5 className={`font-display text-sm font-black leading-tight group-hover:text-amber-400 transition-colors ${
                        isSelected ? "text-amber-400" : "text-white"
                      }`}>
                        {c.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                    </div>

                    {/* Meta info layout */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5 text-[10.5px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{c.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom details block */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{c.workshops.length} {c.workshops.length === 1 ? "Workshop" : "Workshops"}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold font-mono">
                      {isSelected ? (
                        <span className="text-amber-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                          Selecionado
                        </span>
                      ) : (
                        <span className="text-slate-400 group-hover:text-amber-400 transition-colors flex items-center gap-0.5">
                          Acessar <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-amber-550" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#111d2d] border border-white/5 rounded-xl p-8 text-center text-slate-450 italic text-xs">
          💡 No momento não há congressos cadastrados ou ativos no fardamento catarinense.
        </div>
      )}

      {/* RENDER ACTIVE CONGRESS SIGNUP FLOW (IF NOT REGISTERED YET) */}
      {activeCongress && !myInscription ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: General information and agenda schedule lists */}
          <div className="lg:col-span-7 bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-6">
            
            {/* Header info panel */}
            <div className="space-y-3 text-left">
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] rounded-full font-bold uppercase tracking-wider font-mono">Inscrições Abertas</span>
              <h4 className="text-lg font-extrabold text-white font-display leading-tight">{activeCongress.title}</h4>
              <p className="text-xs text-slate-350 leading-relaxed font-semibold">{activeCongress.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 text-[11.5px] border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{activeCongress.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{activeCongress.location}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                  <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Taxa: {activeCongress.price === 0 ? "Entrada Franca" : "R$ " + activeCongress.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Congress Schedule Agenda accordion list */}
            {activeCongress.agenda.length > 0 && (
              <div className="space-y-4">
                <h5 className="text-[11.5px] font-black tracking-widest text-amber-400 font-mono uppercase pb-1.5 border-b border-white/5">
                  Cronograma e Grade de Atividades
                </h5>
                <div className="space-y-3">
                  {activeCongress.agenda.map((item) => (
                    <div key={item.id} className="p-3.5 bg-[#0a111a] border border-white/5 rounded-lg text-left flex gap-3.5">
                      <div className="text-center min-w-[55px] border-r border-white/5 pr-3.5 shrink-0">
                        <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest leading-none">{item.day.split(" ")[0]}</span>
                        <strong className="block text-sm text-amber-400 font-mono font-black mt-1">{item.time}h</strong>
                      </div>
                      <div className="space-y-1">
                        <h6 className="font-bold text-xs text-slate-100 font-display leading-tight">{item.title}</h6>
                        {item.description && <p className="text-[10.5px] text-slate-405 leading-relaxed font-semibold">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right: Registration workshop checklist and submit action */}
          <div className="lg:col-span-5 bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-6">
            
            <div className="space-y-2">
              <h5 className="text-xs font-black tracking-widest text-amber-400 font-mono uppercase">
                Escolha Seus Workshops
              </h5>
              <p className="text-[10px] text-slate-400 leading-normal">
                Atividades de capacitação no sábado à tarde. Escolha suas cadeiras livres (vagas limitadas por sala):
              </p>
            </div>

            <div className="space-y-3 text-left">
              {activeCongress.workshops.map((ws) => {
                const isSelected = chosenWsIds.includes(ws.id);
                const isFull = ws.registeredCount >= ws.capacity;
                const remaining = Math.max(0, ws.capacity - ws.registeredCount);

                return (
                  <div
                    key={ws.id}
                    onClick={() => handleToggleWorkshopSelection(ws)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 relative select-none ${
                      isSelected 
                        ? "bg-[#182c3c] border-amber-500/40 text-white" 
                        : isFull 
                          ? "bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed opacity-60"
                          : "bg-[#0b131e] border-white/5 hover:border-slate-500 text-slate-300 hover:bg-[#111e2f]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex items-center gap-2">
                        {/* Custom checkbox styled mimicking high-fidelity radios */}
                        <span className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-amber-500 border-amber-500" : "border-slate-500 bg-[#09101a]"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[4px]" />}
                        </span>
                        
                        <div>
                          <strong className="block text-xs font-bold leading-snug">{ws.title}</strong>
                          <span className="block text-[10.5px] text-slate-450 mt-0.5 font-semibold">Ministrante: {ws.speaker}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-1 border-t border-white/5">
                      <span>🕒 {ws.timeSlot}</span>
                      <span>
                        {isFull ? (
                          <span className="text-rose-500 font-bold uppercase">Sala Lotada</span>
                        ) : (
                          `${remaining} vagas de ${ws.capacity} livres`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {activeCongress.workshops.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  Nenhum workshop extra cadastrado para seleção. Prossiga diretamente para o pagamento.
                </div>
              )}
            </div>

            {/* Foto Oficial para Credenciamento */}
            <div className="p-4 bg-[#0a1018] rounded-xl border border-white/5 text-left space-y-3">
              <span className="block text-[8px] font-mono text-amber-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" /> FOTO CRÉDENCIAL (3x4 Oficial)
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Anexe uma foto nítida de perfil para confecção e impressão do seu crachá de identificação militar UMESC.
              </p>
              
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl border border-white/10 bg-slate-950 overflow-hidden shrink-0 relative flex items-center justify-center">
                  {memberPhotoUrl ? (
                    <img src={memberPhotoUrl} alt="Foto crachá" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Users className="w-6 h-6 text-slate-700 animate-pulse" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="inline-block px-3 py-1.5 bg-[#121c2d] hover:bg-[#18263c] border border-white/10 rounded text-[10px] font-black text-slate-200 cursor-pointer transition-colors text-center uppercase tracking-wider font-mono">
                     Anexar Foto 3x4
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setIsUploadingPhoto(true);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setMemberPhotoUrl(reader.result as string);
                            setIsUploadingPhoto(false);
                          };
                          reader.onerror = () => {
                            setIsUploadingPhoto(false);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  
                  {/* Select preset samples */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">Exemplos:</span>
                    <button
                      type="button"
                      onClick={() => setMemberPhotoUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300")}
                      className="text-[9px] text-amber-500 hover:text-amber-400 font-bold underline"
                    >
                      Militar Masc.
                    </button>
                    <span className="text-slate-600 text-[9px]">•</span>
                    <button
                      type="button"
                      onClick={() => setMemberPhotoUrl("https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300")}
                      className="text-[9px] text-amber-500 hover:text-amber-400 font-bold underline"
                    >
                      Militar Fem.
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Autofill user context callout to give user high comfort design */}
            <div className="p-3 bg-slate-900/45 rounded-lg border border-white/5 text-left text-[11px] text-slate-400 space-y-1 select-none">
              <span className="block text-[8px] font-mono text-amber-550 uppercase tracking-widest font-black">Preenchimento Inteligente</span>
              <p>Membro identificado como: <strong className="text-slate-100 font-bold">{loggedInUser.name}</strong> • CPF: <strong className="text-slate-100 font-mono font-bold">{loggedInUser.cpf}</strong> ({loggedInUser.rank})</p>
              <p>Os dados cadastrados na UMESC serão vinculados automaticamente ao seu crachá de credenciamento.</p>
            </div>

            {/* Error output message */}
            {submitError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/25 rounded-lg text-rose-350 text-xs text-left font-semibold">
                ⚠️ {submitError}
              </div>
            )}

            {/* Submit registration order trigger button */}
            <button
              onClick={handleRegisterSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer font-bold shrink-0 shadow-lg text-center"
            >
              {isSubmitting ? "Emitindo Inscrição..." : activeCongress.price === 0 ? "Confirmar Inscrição Gratuita" : `Confirmar Inscrição • R$ ${activeCongress.price.toFixed(2)}`}
            </button>

          </div>

        </div>
      ) : activeCongress && myInscription ? (
        
        /* RENDER SUCCESS BADGE & PIX PAYMENT FLOW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: TICKET PORTFOLIO WITH DYNAMIC TICKET AND QR CODE */}
          <div className="lg:col-span-7 bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-6">
            
            <div className="border-b border-white/5 pb-3">
              <h4 className="text-base font-black text-white font-display uppercase tracking-wider">
                Seu Ingresso Digital Ativo
              </h4>
              <p className="text-xs text-slate-400">
                Apresente este voucher na portaria nos dias do evento para validação física e retirada do crachá.
              </p>
            </div>

            {/* LANYARD / CORDÃO DE PORTAL DO CONGRESSO (SILENT & AUTHENTIC REALISM) */}
            <div className="flex flex-col items-center justify-center -mb-5 relative z-10 select-none pointer-events-none">
              {/* Ribbon strap representation */}
              <div className="w-6 h-12 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-850 rounded-t shadow-inner border-t border-white/5"></div>
              {/* Metal lobster connector/clasp loop */}
              <div className="w-5 h-5 -mt-1 bg-gradient-to-b from-[#bec3cc] to-[#888e99] rounded-full border border-slate-350 flex items-center justify-center shadow">
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
              </div>
              {/* Solid shiny clasp body hook */}
              <div className="w-1.5 h-6 -mt-0.5 bg-gradient-to-r from-[#bec3cc] via-slate-100 to-[#818792] rounded shadow-md"></div>
            </div>

            {/* HIGH FIDELITY DESIGN CONFIRMATION CARD BADGE WITH INTEGRATED COMPLIANCE DETAILS */}
            <div className="mx-auto w-full max-w-[340px] bg-gradient-to-b from-[#d900ff] via-[#890b9b] to-[#4c0519] border border-fuchsia-400/45 rounded-3xl pt-5 pb-0 shadow-2xl relative overflow-hidden select-none flex flex-col justify-between">
              
              {/* Premium abstract graphic shapes for high-end creds card backdrop (patterns like euVou) */}
              <div className="absolute top-4 left-4 w-6 h-6 border-2 border-white/10 rounded-full opacity-35"></div>
              <div className="absolute top-12 right-6 w-12 h-1 whitespace-pre rounded bg-white/5 rotate-12 opacity-30"></div>
              <div className="absolute bottom-16 left-5 w-8 h-8 rounded-full border border-white/5 opacity-20"></div>
              
              {/* Card slot hanger hole */}
              <div className="w-8 h-2.5 bg-slate-950 rounded-full border border-white/15 mx-auto -mt-2 mb-4 shadow-inner"></div>

              {/* Core header banner of metadata - Official Logo of the entity positioned proudly */}
              <div className="text-center px-5 space-y-2">
                <div className="h-16 flex items-center justify-center">
                  <img 
                    src="https://qndjkphfsejuqopmfgas.supabase.co/storage/v1/object/public/qr%20code%20pix%20entidade/Nova%20Log.png" 
                    alt="Logo UMESC Oficial" 
                    className="max-h-full max-w-[170px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center mt-1">
                  <span className="text-[8.5px] font-black uppercase text-fuchsia-250 font-mono tracking-widest bg-black/35 px-2 py-0.5 rounded-full inline-block">
                    VOUCHER OFICIAL IMPRESSO
                  </span>
                </div>
              </div>

              {/* White visual credentials inner container inside the badge layout */}
              <div className="mx-4 mt-5 bg-[#fafcfd]/90 text-slate-950 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-white/40 backdrop-blur-sm min-h-[145px]">
                
                {/* Left meta user info */}
                <div className="flex-1 text-left space-y-1.5">
                  <span className="inline-block px-2 py-0.5 bg-fuchsia-100 text-[#890b9b] text-[8.5px] font-black uppercase tracking-wider rounded font-mono">
                    {myInscription.memberRank || "Membro Oficial"}
                  </span>
                  
                  <div className="space-y-0.5">
                    <h5 className="font-extrabold text-[#000] text-sm leading-tight uppercase font-display select-text tracking-tight max-w-[145px] truncate">
                      {myInscription.memberName.split(" ").slice(0, 2).join(" ")}
                    </h5>
                    <p className="text-[8.5px] text-slate-550 font-semibold uppercase tracking-tight line-clamp-1 select-text">
                      {myInscription.memberName}
                    </p>
                  </div>

                  <div className="text-[9px] text-slate-600 font-mono space-y-0.5">
                    <div>CPF: <b className="select-text">{myInscription.memberCpf}</b></div>
                    <div>STATUS: <b className={`uppercase ${myInscription.paymentStatus === 'pago' ? "text-emerald-600" : "text-amber-600 animate-pulse"}`}>
                      {myInscription.paymentStatus === 'pago' ? "HOMOLOGADO" : "PENDENTE"}
                    </b></div>
                  </div>
                </div>

                {/* Right content: 3x4 photo + API QR Code container layout */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  {/* Photo representation in miniature inside credentials card */}
                  <div className="w-12 h-14 rounded-lg border border-slate-300 bg-slate-200 overflow-hidden shrink-0 shadow-sm relative">
                    {myInscription.memberPhotoUrl ? (
                      <img src={myInscription.memberPhotoUrl} alt="Foto Credencial" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* QR pattern container block */}
                  <div className="w-[66px] h-[66px] bg-white p-0.5 rounded-lg border border-slate-300 flex items-center justify-center shadow">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=0f172a&data=${encodeURIComponent(myInscription.qrCodeToken)}`}
                      alt="Voucher QR Code"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-rose-600 font-extrabold select-all tracking-wider text-center">
                    {myInscription.qrCodeToken}
                  </span>
                </div>

              </div>

              {/* Workshops display embedded or micro-strip if chosen */}
              {myInscription.selectedWorkshopIds.length > 0 && (
                <div className="mx-4 mt-2 mb-1 p-2 bg-black/40 border border-white/5 rounded-xl text-left select-none">
                  <span className="block text-[7.5px] uppercase font-bold text-fuchsia-305 font-mono tracking-wider">Módulos Reservados:</span>
                  <div className="text-[8px] text-fuchsia-200 mt-0.5 space-y-0.5 truncate max-w-[280px]">
                    {myInscription.selectedWorkshopIds.map((wsId, idx) => {
                      const matchedWs = activeCongress.workshops.find(w => w.id === wsId);
                      return (
                        <div key={wsId} className="truncate">
                          ✓ {idx + 1}. {matchedWs?.title || "Workshop Acadêmico"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stark Bottom bold band simulating high-end hanging badges tier labels */}
              <div className="mt-4 bg-[#fafcfd]/95 hover:bg-white text-slate-950 py-3 px-4 border-t border-slate-150 flex flex-col items-center justify-center relative shadow-inner overflow-hidden select-none shrink-0">
                {/* Patterns stripes in bottom block background */}
                <div className="absolute left-3 w-5 h-5 bg-fuchsia-750 rounded-full opacity-10"></div>
                <div className="absolute right-3 w-5 h-5 bg-purple-750 rounded-full opacity-10"></div>
                
                <span className="font-extrabold text-[#000] text-[18px] sm:text-[21px] font-mono uppercase tracking-[0.25em] leading-none text-center">
                  {myInscription.paymentStatus === 'pago' ? "CONGRESSISTA" : "RESERVA PROV"}
                </span>
                <span className="text-[8.5px] font-mono text-slate-550 uppercase tracking-widest font-bold mt-1 text-center truncate max-w-full">
                  {activeCongress.title}
                </span>
              </div>

              {/* Presence Stamp overlay fallback if checkedIn */}
              {myInscription.checkedIn && (
                <div className="absolute inset-0 bg-[#0c1a17]/95 flex flex-col items-center justify-center p-3 rounded text-teal-400 border border-teal-505 animate-fadeIn text-center z-20">
                  <FileCheck className="w-10 h-10 text-teal-450 shrink-0 mb-1" />
                  <strong className="text-sm uppercase font-mono font-black select-none">Check-In Efetuado!</strong>
                  <span className="text-[10px] text-slate-300 block mt-0.5 font-bold">Oficiais da Recepção Autorizaram Entrada</span>
                </div>
              )}

            </div>

            {/* Print and WhatsApp Action Buttons Block */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-end items-stretch pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-[#1a2d42] border border-white/10 rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" /> Imprimir Ticket
              </button>

              <button
                type="button"
                onClick={handleShareWhatsapp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-black text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Share2 className="w-3.5 h-3.5 text-white animate-pulse" /> Compartilhar no WhatsApp
              </button>
            </div>

          </div>

          {/* Right: SECURE COPY PASTE PAYMENT PIX & RECEIPT UPLOADER (Adote as melhores práticas) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Payment Panel */}
            <div className="bg-[#131f2f] rounded-xl border border-white/5 p-5 space-y-5 text-left">
              
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">
                  Guia de Quitação de Inscrição
                </h4>
                <p className="text-xs text-slate-300">
                  Para efetivar e homologar e liberar seu ingresso no sistema UMESC, siga os passos abaixo:
                </p>
              </div>

              {/* Status information alert boxes */}
              {myInscription.paymentStatus === "pendente" ? (
                <div className="p-3.5 bg-[#25100a] border border-amber-600/30 text-amber-250 text-xs rounded-xl flex gap-3 select-none leading-relaxed font-semibold">
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    Aguardando Comprovante! Faça a transferência bancária de exatamente <strong className="text-white font-bold">R$ {activeCongress.price.toFixed(2)}</strong> via PIX e anexe o comprovante abaixo.
                  </div>
                </div>
              ) : myInscription.paymentStatus === "em_analise" ? (
                <div className="p-3.5 bg-[#0b2420] border border-teal-500/30 text-teal-350 text-xs rounded-xl flex gap-3 select-none leading-relaxed font-semibold">
                  <FileCheck className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    Comprovante enviado! Nossa tesouraria estadual está promovendo o batimento em conta do PIX. Seu QR Code assumirá conformidade ativa nas próximas horas.
                  </div>
                </div>
              ) : myInscription.paymentStatus === "pago" ? (
                <div className="p-3.5 bg-[#0b1e1d] border border-teal-500/30 text-teal-350 text-xs rounded-xl flex gap-3 select-none leading-relaxed font-semibold animate-fadeIn">
                  <Check className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    {activeCongress.price === 0 
                      ? "Inscrição de Entrada Franca Homologada! Sua credencial está garantida e ativa gratuitamente. Desejamos um maravilhoso congresso!" 
                      : "Inscrição Homologada com Sucesso! Não há nenhuma ação pendente. Desejamos um maravilhoso congresso!"}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-[#240b0e] border border-rose-500/30 text-rose-350 text-xs rounded-xl flex gap-3 select-none leading-relaxed font-semibold font-mono">
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    Comprovante recusado pelos auditores! Por favor, efetue nova conferência do PIX e reenvie a folha de auditoria abaixo.
                  </div>
                </div>
              )}

              {/* PIX COPY PASTE CARD BLOCK */}
              {myInscription.paymentStatus !== "pago" && (() => {
                const fullPixString = generatePixString(activeCongress.pixKey, activeCongress.price, activeCongress.pixReceiverName);
                return (
                  <div className="bg-[#0b131e] border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400 uppercase text-[9.5px]">Dados Bancários UMESC</span>
                      <span className="text-teal-400 font-bold font-mono">R$ {activeCongress.price.toFixed(2)}</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Visual QR Code to scan dynamically using the real-time generated active Congress Pix details */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#070c14] p-3 rounded-lg border border-white/5">
                        <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0f172a&data=${encodeURIComponent(fullPixString)}`} 
                            alt="QR Code PIX" 
                            className="w-28 h-28 select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1.5 text-center sm:text-left">
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded font-bold uppercase">
                            <QrCode className="w-3 h-3 text-emerald-400" /> PIX DINÂMICO HOMOLOGADO
                          </span>
                          <p className="text-[10.5px] text-slate-350 leading-relaxed font-semibold">
                            Abra o app do seu banco, selecione <strong className="text-white">Pagar via Pix / QR Code</strong> e aponte para a imagem. O valor de <strong className="text-amber-500">R$ {activeCongress.price.toFixed(2)}</strong> e o beneficiário serão identificados automaticamente!
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black font-mono">Beneficiário</span>
                        <strong className="text-white font-semibold block">{activeCongress.pixReceiverName}</strong>
                      </div>

                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black font-mono">Chave Pix Secundária (Para Transferência Manual)</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            id="copiador-chave-pix-input"
                            type="text"
                            readOnly
                            value={activeCongress.pixKey}
                            className="flex-1 font-sans font-bold tracking-wide text-[11px] text-slate-350 bg-[#050a11] px-2 py-1.5 rounded border border-white/5 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPixKey}
                            className={`p-1.5 rounded flex items-center justify-center transition-all ${
                              copiedPix ? "bg-teal-500 text-slate-950" : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                            }`}
                            title="Copiar Chave PIX"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedPix && <span className="text-[10px] text-teal-400 mt-1 block font-bold">✓ Chave Pix copiada com sucesso!</span>}
                      </div>

                      <div>
                        <span className="block text-[8px] text-emerald-500 uppercase font-black font-mono">Código PIX Copia e Cola (Ideal para Celular)</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            id="copiador-codigo-copia-cola-input"
                            type="text"
                            readOnly
                            value={fullPixString}
                            className="flex-1 font-sans font-bold tracking-tight text-[10px] text-teal-400 bg-[#050a11] px-2 py-1.5 rounded border border-white/5 focus:outline-none truncate"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyPixString(fullPixString)}
                            className={`p-1.5 rounded flex items-center justify-center transition-all ${
                              copiedPixString ? "bg-teal-500 text-slate-950" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                            }`}
                            title="Copiar Código Copia e Cola"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedPixString && <span className="text-[10px] text-emerald-400 mt-1 block font-bold">✓ Código Copia e Cola copiado com sucesso!</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SUBMISSION FORM OF THE PAYMENT PROOF (comprovantes) */}
              {myInscription.paymentStatus !== "pago" && (
                <form onSubmit={handleFakeFileUploadSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase font-mono">
                      Encaminhar Recibo/Comprovante de Pagamento:
                    </label>
                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      Formatos aceitos: JPG, PNG ou PDF de celular. Após envio, seu voucher será analisado.
                    </p>
                  </div>

                  {/* Standard Custom File upload component with both trigger selector and drag overlay support */}
                  <div className="border border-dashed border-white/10 hover:border-amber-500/20 bg-[#0a111a] rounded-xl p-5 text-center transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div className="space-y-2 select-none">
                      <div className="w-10 h-10 bg-slate-900 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-white/5">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      
                      {fakeFileName ? (
                        <div>
                          <span className="block text-xs font-bold text-teal-400 truncate max-w-[200px] mx-auto font-mono">{fakeFileName}</span>
                          <span className="block text-[10px] text-slate-500 mt-1">Clique ou arraste outro para alterar</span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-xs font-bold text-slate-300">Escolha ou Arraste o Arquivo</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">Tamanho máximo de 5MB por upload</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    disabled={isUploadingProof || (!selectedFile && !fakeFileName)}
                    className={`w-full py-2 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      isUploadingProof || (!selectedFile && !fakeFileName)
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg text-center"
                    }`}
                  >
                    {isUploadingProof ? "Transmitindo Comprovante..." : "Enviar Comprovante para Auditoria"}
                  </button>
                </form>
              )}

            </div>

          </div>

        </div>
      ) : (
        <div className="bg-[#111d2e] border border-white/5 rounded-xl p-8 text-center text-slate-500 italic">
          💡 No momento não há congressos ativos com inscrições abertas para as Forças Militares de Santa Catarina.
        </div>
      )}

    </div>
  );
}
