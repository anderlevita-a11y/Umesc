import React, { useState, useEffect } from "react";
import { Compass, CheckCircle2, AlertCircle, RefreshCw, Send, Shield, User, Heart, MessageSquare, MapPin } from "lucide-react";
import { capelaniaVolunteersService, CapelaniaVolunteer } from "../lib/supabase";

interface CapelaniaVolunteeringFormProps {
  loggedInUser?: {
    name: string;
    city: string;
    rawPhone?: string;
  } | null;
}

export default function CapelaniaVolunteeringForm({ loggedInUser }: CapelaniaVolunteeringFormProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredVol, setRegisteredVol] = useState<CapelaniaVolunteer | null>(null);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (loggedInUser) {
      setName(loggedInUser.name || "");
      setCity(loggedInUser.city || "");
      setWhatsapp(loggedInUser.rawPhone || "");
    }
  }, [loggedInUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !city.trim()) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!lgpdConsent) {
      setErrorMessage("Você precisa aceitar os termos de consentimento da LGPD para prosseguir.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await capelaniaVolunteersService.createVolunteer({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        city: city.trim()
      });
      setRegisteredVol(result);
      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao registrar sua inscrição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName(loggedInUser?.name || "");
    setWhatsapp(loggedInUser?.rawPhone || "");
    setCity(loggedInUser?.city || "");
    setLgpdConsent(false);
    setSubmitSuccess(false);
    setRegisteredVol(null);
    setErrorMessage("");
  };

  if (submitSuccess && registeredVol) {
    return (
      <div className="bg-[#101f30] border border-emerald-550/20 rounded-2xl p-6 sm:p-8 space-y-6 text-center animate-fadeIn max-w-2xl mx-auto">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white font-display">Inscrição Homologada com Sucesso!</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Que excelente decisão! Seus dados foram salvos com integridade e criptografia ponta-a-ponta no banco de dados da Capelania Voluntária da UMESC.
          </p>
        </div>

        <div className="bg-[#0b131f] border border-white/5 rounded-xl p-4 text-left space-y-2 text-xs font-mono max-w-md mx-auto">
          <div className="text-slate-450 border-b border-white/5 pb-1.5 font-bold uppercase tracking-wider text-[9px] text-amber-500">
            Comprovante de Inscrição
          </div>
          <div className="flex justify-between"><span className="text-slate-400">IDRegistro:</span> <span className="text-white font-bold">{registeredVol.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Nome:</span> <span className="text-white font-bold truncate max-w-[200px]">{registeredVol.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">WhatsApp:</span> <span className="text-white font-bold">{registeredVol.whatsapp}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Cidade:</span> <span className="text-white font-bold">{registeredVol.city}</span></div>
          <div className="flex justify-between border-t border-white/5 pt-1.5"><span className="text-slate-400">Data e Hora:</span> <span className="text-amber-400 font-bold">{new Date(registeredVol.createdAt || "").toLocaleString("pt-BR")}</span></div>
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Nova Inscrição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-[#101b2a] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Decorative top colored strip */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <Heart className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-mono tracking-widest text-[#f59e0b] font-black uppercase mb-0.5 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            PMSC & CBMSC Integrados
          </div>
          <h4 className="text-sm font-black text-white uppercase tracking-wider">Apoio e Missão Voluntária</h4>
          <p className="text-xs text-slate-350 leading-relaxed font-semibold">
            Ao se inscrever, você será catalogado na base geral da Capelania. A coordenação regional fará contato via WhatsApp para inclusão em escalas e cursos de capacitação de socorristas espirituais.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded bg-red-950/40 border border-red-500/20 text-rose-300 text-xs flex items-start gap-2.5 leading-normal">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-left">
            <strong className="block text-red-400 mb-0.5 uppercase tracking-wide font-bold">Incompatibilidade:</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* NOME COMPLETO */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-amber-500" /> Nome Completo:
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite seu nome completo"
            className="w-full bg-[#142337] text-xs border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 tracking-wide transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WHATSAPP */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp:
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex: (48) 99999-9999"
              className="w-full bg-[#142337] text-xs border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 tracking-wide transition-all"
            />
          </div>

          {/* CIDADE */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-450 text-rose-450" /> Cidade:
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Florianópolis"
              className="w-full bg-[#142337] text-xs border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 tracking-wide transition-all"
            />
          </div>
        </div>

        {/* COMPLIANCE / LGPD */}
        <div className="bg-[#0b131f] border border-white/5 rounded-xl p-3.5 space-y-3">
          <div className="flex gap-2.5 items-start">
            <input
              id="chk-vol-consent"
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-[#142337] text-amber-500 mt-0.5 accent-amber-500 shrink-0 cursor-pointer"
            />
            <label htmlFor="chk-vol-consent" className="text-[10px] text-slate-350 leading-relaxed font-semibold select-none cursor-pointer">
              <strong>Termo de Consentimento Voluntário (LGPD):</strong> Autorizo em caráter irrevogável o armazenamento dos meus dados básicos (Nome, WhatsApp, Cidade) exclusivamente pela diretoria estatutária da UMESC para fins de integração operacional, contato para escalas, e distribuição de serviços eclesiásticos e capelania voluntária militar.
            </label>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-xs border border-transparent bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg font-mono"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Homologando Registro...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar Inscrição de Voluntário
            </>
          )}
        </button>

      </form>
    </div>
  );
}
