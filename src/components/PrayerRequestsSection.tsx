import React, { useState } from "react";
import { MessageSquare, User, Send, Heart, Check, Church, Compass } from "lucide-react";
import { prayerRequestsService } from "../lib/supabase";

export interface PrayerRequest {
  id: string;
  name: string;
  whatsapp: string;
  request: string;
  createdAt: string;
  status: "pending" | "prayed";
}

export default function PrayerRequestsSection() {
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !request.trim()) return;

    setIsSubmitting(true);

    try {
      await prayerRequestsService.createRequest({
        name: name.trim(),
        whatsapp: "", // Deleted per user request
        request: request.trim(),
        status: "pending"
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      setName("");
      setRequest("");

      // Trigger custom window event to notify AdminPortal if active
      window.dispatchEvent(new Event("umesc_prayer_requests_updated"));

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <section id="prayer-requests" className="py-16 bg-[#09111e] relative overflow-hidden border-b border-white/5">
      {/* Light elegant halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest font-mono">
            Apoio Espiritual UMESC
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-2 flex items-center justify-center gap-2.5">
            <Compass className="w-6 h-6 text-amber-500 animate-pulse" />
            PEDIDO DE ORAÇÃO
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl mx-auto font-medium leading-relaxed">
            Nós, capelães militares associados da UMESC, estamos ao seu dispor para interceder por sua vida, família e missão nas forças de segurança de Santa Catarina.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Visual card on left */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0c1626] to-[#080d17] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient gold glow */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all duration-700" />
            
            <div className="space-y-6">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Church className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">Clamor Militar Voluntário</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Todos os pedidos são tratados sob o mais estrito sigilo de conformidade ética e LGPD pela equipe de capelania de plantão.
                </p>
              </div>

              <div className="space-y-3.5 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">✓</div>
                  <p className="text-[11px] text-slate-300 leading-normal"><strong className="text-slate-100">Sigilo Garantido:</strong> Seu motivo de oração não é exposto publicamente.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">✓</div>
                  <p className="text-[11px] text-slate-300 leading-normal"><strong className="text-slate-100">Intercessão Rápida:</strong> Nossa rede de intercessores oficiais recebe a notificação instantaneamente.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">✓</div>
                  <p className="text-[11px] text-slate-300 leading-normal"><strong className="text-slate-100">Suporte Fraterno:</strong> Se desejar, um capelão credenciado entrará em contato via WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Praying hands banner visual */}
            <div className="mt-8 relative h-36 rounded-2xl overflow-hidden border border-white/5">
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" 
                alt="Mãos em Oração" 
                className="w-full h-full object-cover brightness-[0.4] contrast-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09111e] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-500/90 tracking-widest font-mono">"Orai sem cessar"</span>
                <span className="text-[9px] font-mono text-slate-400">1 Tessalonicenses 5:17</span>
              </div>
            </div>
          </div>

          {/* Form on Right */}
          <div className="lg:col-span-7 bg-[#0c1626]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl">
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Heart className="w-8 h-8 fill-emerald-500/20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Pedido Recebido com Sucesso!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Seu clamor já foi encaminhado com sigilo para nossos capelães e intercessores de SC. Estaremos cobrindo sua vida em oração. Que Deus abençoe poderosamente seu fardamento e família!
                  </p>
                </div>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-[#09111e] text-[11px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                >
                  Fazer Novo Pedido
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nome field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-305 uppercase text-slate-300 tracking-wider">
                    Seu Nome ou Inicial/Codinome (Pode ser sob sigilo/anônimo):
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Insira seu nome ou codinome"
                      className="w-full bg-[#121c2d] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Pedido de Oração text field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-305 uppercase text-slate-300 tracking-wider">
                    Seu Pedido:
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <textarea
                      required
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      placeholder="Escreva aqui seu motivo de oração..."
                      rows={4}
                      className="w-full bg-[#121c2d] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono resize-none"
                    />
                  </div>
                </div>

                {/* Disclaimer / LGPD Alert */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[9px] text-amber-500/80 leading-normal font-sans">
                  Sua privacidade é nossa prioridade. De acordo com a LGPD Lei nº 13.709/2018, as informações aqui inseridas serão utilizadas estritamente para suporte espiritual fraterno e sob nenhuma hipótese serão compartilhadas ou expostas fora do corpo oficial de Capelães UMESC.
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09111e] font-display font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Send className="w-4 h-4 animate-spin" />
                      <span>Processando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 animate-pulse" />
                      <span>Enviar Pedido de Oração</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
