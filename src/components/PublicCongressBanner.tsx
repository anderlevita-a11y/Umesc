import React, { useState, useEffect } from "react";
import { 
  Calendar, MapPin, Clock, ArrowRight, Sparkles, ShieldCheck, 
  Users, Award, ChevronRight, Lock, Ticket, HelpCircle
} from "lucide-react";
import { congressService, Congress } from "../lib/congressService.ts";

interface PublicCongressBannerProps {
  onEnterMemberDashboard: (tab: "notices" | "agenda" | "structure" | "registration" | "congressos") => void;
}

// Robust date-parsing utility to make countdown work on any Portuguese written date formats
function parseCongressDate(dateStr: string): Date {
  const now = new Date();
  try {
    // Look for a year like 2026/2027
    const yearMatch = dateStr.match(/\b(202\d|203\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear();

    // Month translation map (Portuguese -> JavaScript indices)
    const months: { [key: string]: number } = {
      janeiro: 0, fev: 1, fevereiro: 1, mar: 2, marco: 2, março: 2,
      abr: 3, abril: 3, mai: 4, maio: 4, jun: 5, junho: 5,
      jul: 6, julho: 6, ago: 7, agosto: 7, set: 8, setembro: 8,
      out: 9, outubro: 9, nov: 10, novembro: 10, dez: 11, dezembro: 11
    };

    let month = 10; // Default to Nov (the main event month)
    const lowerStr = dateStr.toLowerCase();
    for (const m of Object.keys(months)) {
      if (lowerStr.includes(m)) {
        month = months[m];
        break;
      }
    }

    // Extract first day number
    const dayMatch = dateStr.match(/\b(\d{1,2})\b/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 13;

    const targetDate = new Date(year, month, day, 19, 0, 0); // starts at 19:00

    if (isNaN(targetDate.getTime())) {
      return new Date(now.getFullYear(), 10, 13, 19, 0, 0); // fallback
    }
    return targetDate;
  } catch (err) {
    return new Date(now.getFullYear() + 1, 10, 13, 19, 0, 0);
  }
}

export default function PublicCongressBanner({ onEnterMemberDashboard }: PublicCongressBannerProps) {
  const [activeCongresses, setActiveCongresses] = useState<Congress[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  // Pull latest congresses on mount
  useEffect(() => {
    const list = congressService.getCongresses().filter(c => c.status === "open" && c.isActive !== false);
    setActiveCongresses(list);
    
    // Prioritize the congress marked as featured/active by the admin
    const featIdx = list.findIndex(c => c.isFeatured === true);
    if (featIdx !== -1) {
      setFeaturedIndex(featIdx);
    } else {
      setFeaturedIndex(0);
    }
  }, []);

  const featured = activeCongresses[featuredIndex];

  // Update countdown clock
  useEffect(() => {
    if (!featured) return;

    const targetDate = parseCongressDate(featured.date);

    const updateClock = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    updateClock(); // Initial run
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, [featured]);

  // If there are no open events, output nothing or a sleek placeholder to keep page beautiful
  if (activeCongresses.length === 0) {
    return null;
  }

  return (
    <section 
      id="public-featured-events-banner" 
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      {/* Absolute Decorative Glow Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-r from-amber-500/5 via-sky-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Core Box with border framing & gold shadow overlays */}
      <div className="relative bg-gradient-to-br from-[#121c2e] via-[#0d1522] to-[#121c2e] rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl overflow-hidden shadow-amber-500/5">
        
        {/* State Flag Colored Bar Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 flex">
          <div className="flex-1 bg-gradient-to-r from-red-600 to-red-500"></div>
          <div className="w-16 bg-white shrink-0"></div>
          <div className="flex-1 bg-emerald-600"></div>
          <div className="w-16 bg-white shrink-0"></div>
          <div className="flex-1 bg-gradient-to-l from-red-600 to-red-500"></div>
        </div>

        {/* Small top selector/indicator if there are multiple active congresses */}
        {activeCongresses.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6 z-20 relative">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase py-1 pr-2 self-center">
              Eventos Disponíveis:
            </span>
            {activeCongresses.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setFeaturedIndex(idx)}
                className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${
                  idx === featuredIndex
                    ? "bg-amber-500 text-[#0c1421] shadow-lg shadow-amber-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.title.split("(")[0]}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Congress Presentation */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Live Indicator Pulse Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping"></span>
                Inscrições Abertas Gêneras
              </span>
              <span className="px-2.5 py-1 rounded bg-[#0b121e] border border-white/5 text-[9px] text-slate-400 uppercase font-mono tracking-wider font-extrabold flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                Vaga Oficial Garantida
              </span>
            </div>

            {/* Title / Description block */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight font-display tracking-tight hover:text-amber-300 transition-colors">
                {featured.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
                {featured.description}
              </p>
            </div>

            {/* Quick Informational Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-100 pb-3 border-b border-white/5">
              
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Data do Congresso</span>
                  <span className="font-bold">{featured.date}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Local de Realização</span>
                  <span className="font-bold truncate max-w-[200px] block">{featured.location}</span>
                </div>
              </div>

            </div>

            {/* Quick benefits info lines */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Certificado Digital Integrado
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                {featured.workshops.length} Oficinas Temáticas Práticas
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
                Ingresso Digital com QR Code no Celular
              </span>
            </div>

          </div>

          {/* Right Column: Beautiful High-Tech Countdown Box & CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-center bg-[#090e18]/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-6">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest block">
                {timeLeft.isOver ? "O CONGRESSO JÁ REUNIDO EM SC" : "CONTAGEM REGRESSIVA PARA O GRANDE ENCONTRO"}
              </span>
              <div className="w-12 h-0.5 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            {/* Dynamic Countdown Grid Blocks */}
            {!timeLeft.isOver ? (
              <div className="grid grid-cols-4 gap-3 text-center">
                
                {/* Days */}
                <div className="bg-[#121c2d] rounded-xl p-3 border border-white/5 relative group hover:border-amber-550 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent rounded-xl pointer-events-none" />
                  <span className="block text-xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mt-0.5">Dias</span>
                </div>

                {/* Hours */}
                <div className="bg-[#121c2d] rounded-xl p-3 border border-white/5 relative group hover:border-amber-550 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent rounded-xl pointer-events-none" />
                  <span className="block text-xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mt-0.5">Horas</span>
                </div>

                {/* Minutes */}
                <div className="bg-[#121c2d] rounded-xl p-3 border border-white/5 relative group hover:border-amber-550 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent rounded-xl pointer-events-none" />
                  <span className="block text-xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mt-0.5">Minutos</span>
                </div>

                {/* Seconds */}
                <div className="bg-[#121c2d] rounded-xl p-3 border border-white/5 relative group hover:border-amber-550 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent rounded-xl pointer-events-none" />
                  <span className="block text-xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight animate-pulse">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mt-0.5">Segs</span>
                </div>

              </div>
            ) : (
              <div className="text-center py-4 text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse font-mono flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                Acontecendo agora / Realizado
                <Sparkles className="w-4 h-4 shrink-0" />
              </div>
            )}

            {/* Action booking blocks */}
            <div className="space-y-3 pt-2">
              
              <div className="flex items-center justify-between bg-[#121c2d]/50 rounded-xl p-3.5 border border-white/5">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold font-mono tracking-widest">VALOR DA INCRIÇÃO</span>
                  <span className="text-lg font-black text-white hover:text-amber-400 transition-colors">R$ {featured.price.toFixed(2)}</span>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-medium">
                  Até 2 oficinas inclusas
                </div>
              </div>

              <button
                id={`btn-cta-congress-public-${featured.id}`}
                onClick={() => onEnterMemberDashboard("congressos")}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 font-black text-[#0c1421] uppercase text-xs tracking-wider transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>Inscrever-se Agora</span>
                <ArrowRight className="w-4 h-4 text-[#0c1421]" />
              </button>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500 inline" />
                  Uso exclusivo para filiados da UMESC via Portal do Membro.
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
