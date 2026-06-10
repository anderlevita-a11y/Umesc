import React, { useState, useEffect } from "react";
import { 
  BookOpen, Check, RotateCcw, AlertTriangle, ShieldCheck, 
  Search, Calendar, Trophy, ChevronRight, BookOpenCheck,
  CheckCircle2, Circle, Eye, Sparkles, Filter
} from "lucide-react";
import { MemberRegistration } from "../types";

interface PlanoLeituraBiblicaProps {
  loggedInUser: MemberRegistration;
}

interface DailyReading {
  dayNumber: number;
  month: number; // 0 = Jan, 11 = Dez
  dayOfMonth: number;
  oldTestament: string;
  newTestament: string;
  wisdom: string;
  category: string; // e.g. "Pentateuco", "Evangelhos", "Epístolas", "Poesia"
}

// Generate an authentic daily Bible reading plan programmatically for 365 days
// This gives highly realistic biblical assignments pacing through the whole scripture.
const generateBibleReadingPlan = (): DailyReading[] => {
  const plan: DailyReading[] = [];
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Scriptural lists & structures
  const otBooks = [
    { name: "Gênesis", chs: 50 }, { name: "Êxodo", chs: 40 }, { name: "Levítico", chs: 27 },
    { name: "Números", chs: 36 }, { name: "Deuteronômio", chs: 34 }, { name: "Josué", chs: 24 },
    { name: "Juízes", chs: 21 }, { name: "Rute", chs: 4 }, { name: "1 Samuel", chs: 31 },
    { name: "2 Samuel", chs: 24 }, { name: "1 Reis", chs: 22 }, { name: "2 Reis", chs: 25 },
    { name: "1 Crônicas", chs: 29 }, { name: "2 Crônicas", chs: 36 }, { name: "Esdras", chs: 10 },
    { name: "Neemias", chs: 13 }, { name: "Ester", chs: 105 }, { name: "Isaías", chs: 66 },
    { name: "Jeremias", chs: 52 }, { name: "Lamentações", chs: 5 }, { name: "Ezequiel", chs: 48 },
    { name: "Daniel", chs: 12 }, { name: "Oséias", chs: 14 }, { name: "Joel", chs: 3 },
    { name: "Amós", chs: 9 }, { name: "Obadias", chs: 1 }, { name: "Jonas", chs: 4 },
    { name: "Miqueias", chs: 7 }, { name: "Naum", chs: 3 }, { name: "Habacuque", chs: 3 },
    { name: "Sofonias", chs: 3 }, { name: "Ageu", chs: 2 }, { name: "Zacarias", chs: 14 },
    { name: "Malaquias", chs: 4 }
  ];

  const ntBooks = [
    { name: "Mateus", chs: 28 }, { name: "Marcos", chs: 16 }, { name: "Lucas", chs: 24 },
    { name: "João", chs: 21 }, { name: "Atos", chs: 28 }, { name: "Romanos", chs: 16 },
    { name: "1 Coríntios", chs: 16 }, { name: "2 Coríntios", chs: 13 }, { name: "Gálatas", chs: 6 },
    { name: "Efésios", chs: 6 }, { name: "Filipenses", chs: 4 }, { name: "Colossenses", chs: 4 },
    { name: "1 Tessalonicenses", chs: 5 }, { name: "2 Tessalonicenses", chs: 3 },
    { name: "1 Timóteo", chs: 6 }, { name: "2 Timóteo", chs: 4 }, { name: "Tito", chs: 3 },
    { name: "Filemom", chs: 1 }, { name: "Hebreus", chs: 13 }, { name: "Tiago", chs: 5 },
    { name: "1 Pedro", chs: 5 }, { name: "2 Pedro", chs: 3 }, { name: "1 João", chs: 5 },
    { name: "2 João", chs: 1 }, { name: "3 João", chs: 1 }, { name: "Judas", chs: 1 },
    { name: "Apocalipse", chs: 22 }
  ];

  // Flat pointer references
  let otBookIndex = 0;
  let otChStart = 1;
  let ntBookIndex = 0;
  let ntChStart = 1;
  let countAccum = 1;

  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= monthDays[m]; d++) {
      const dayNum = countAccum++;
      
      // Calculate realistic OT chapters for today (generally 2-3 chapters)
      const currentOt = otBooks[otBookIndex];
      const maxOtChapters = otBookIndex < 5 ? 3 : 2; // Pentateuch is faster paced
      let otChEnd = otChStart + maxOtChapters - 1;
      let otStr = "";
      
      if (otChEnd >= currentOt.chs) {
        otStr = `${currentOt.name} ${otChStart}-${currentOt.chs}`;
        if (otBookIndex + 1 < otBooks.length) {
          otBookIndex++;
          const nextOt = otBooks[otBookIndex];
          const rolloverAmount = otChEnd - currentOt.chs;
          otChStart = 1;
          if (rolloverAmount > 0) {
            const nextChEnd = Math.min(rolloverAmount, nextOt.chs);
            otStr += ` & ${nextOt.name} 1-${nextChEnd}`;
            otChStart = nextChEnd + 1;
          }
        } else {
          otChStart = 1; // start over if we finish early
        }
      } else {
        otStr = `${currentOt.name} ${otChStart}-${otChEnd}`;
        otChStart = otChEnd + 1;
      }

      // Calculate realistic NT chapters for today (generally 1 chapter)
      const currentNt = ntBooks[ntBookIndex];
      let ntStr = `${currentNt.name} ${ntChStart}`;
      ntChStart++;
      if (ntChStart > currentNt.chs) {
        if (ntBookIndex + 1 < ntBooks.length) {
          ntBookIndex++;
          ntChStart = 1;
        } else {
          ntBookIndex = 0;
          ntChStart = 1;
        }
      }

      // Calculate a dynamic psalm/proverb reflection
      const psalmIndex = ((dayNum - 1) % 150) + 1;
      const provIndex = ((dayNum - 1) % 31) + 1;
      let wisdomStr = `Salmos ${psalmIndex}`;
      if (dayNum % 7 === 0) {
        wisdomStr = `Provérbios ${provIndex}`;
      } else if (dayNum % 13 === 0) {
        const jobIndex = ((dayNum - 1) % 42) + 1;
        wisdomStr = `Jó ${jobIndex}`;
      }

      // Determine category based on month or OT status
      let category = "Narrativas Históricas";
      if (dayNum <= 60) category = "Gênesis e Êxodo (Pentateuco)";
      else if (dayNum <= 150) category = "Históricos do Antigo Pacto";
      else if (dayNum <= 240) category = "Profetas Maiores e Menores";
      else category = "Ensinos Apostólicos & Epístolas";

      plan.push({
        dayNumber: dayNum,
        month: m,
        dayOfMonth: d,
        oldTestament: otStr,
        newTestament: ntStr,
        wisdom: wisdomStr,
        category
      });
    }
  }

  return plan;
};

const BIBLE_PLAN = generateBibleReadingPlan();

const MONTHS_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function PlanoLeituraBiblica({ loggedInUser }: PlanoLeituraBiblicaProps) {
  const localStorageKey = `unesc_bible_reading_progress_${loggedInUser.cpf}`;

  // Reading logs state (storing arrays of completed dayNumbers)
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [activeMonthFilter, setActiveMonthFilter] = useState<number>(new Date().getMonth()); // default to current month
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "concluidos" | "pendentes">("todos");
  
  // Custom reset modal prompt state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [errorResetMsg, setErrorResetMsg] = useState("");
  
  // Load progress from LocalStorage on mount or when user changes
  useEffect(() => {
    const savedProgress = localStorage.getItem(localStorageKey);
    if (savedProgress) {
      try {
        setCompletedDays(JSON.parse(savedProgress));
      } catch (err) {
        console.error("Error reading bible progress:", err);
        setCompletedDays([]);
      }
    } else {
      setCompletedDays([]);
    }
  }, [loggedInUser.cpf, localStorageKey]);

  // Toggle day completion status
  const toggleDayCompletion = (dayNumber: number) => {
    let updated: number[];
    if (completedDays.includes(dayNumber)) {
      updated = completedDays.filter(d => d !== dayNumber);
    } else {
      updated = [...completedDays, dayNumber].sort((a, b) => a - b);
    }
    setCompletedDays(updated);
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  };

  // Complete/Uncomplete all days in the currently filtered list
  const getVisibleReadings = () => {
    return BIBLE_PLAN.filter(item => {
      // Month match
      if (item.month !== activeMonthFilter) return false;
      
      // Search match
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = item.oldTestament.toLowerCase().includes(searchLower) ||
                           item.newTestament.toLowerCase().includes(searchLower) ||
                           item.wisdom.toLowerCase().includes(searchLower) ||
                           `dia ${item.dayNumber}`.includes(searchLower);
      if (!matchSearch) return false;

      // Status Filter
      const isDone = completedDays.includes(item.dayNumber);
      if (filterType === "concluidos" && !isDone) return false;
      if (filterType === "pendentes" && isDone) return false;

      return true;
    });
  };

  const handleToggleAllMonthReadings = (action: "check" | "uncheck") => {
    const visibleDays = getVisibleReadings().map(r => r.dayNumber);
    if (visibleDays.length === 0) return;

    let updated: number[];
    if (action === "check") {
      // Union of completed and visible
      updated = Array.from(new Set([...completedDays, ...visibleDays])).sort((a,b)=>a-b);
    } else {
      // Subtract visible from completed
      updated = completedDays.filter(d => !visibleDays.includes(d));
    }
    setCompletedDays(updated);
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  };

  // Perform hard reset upon confirmation match
  const handleConfirmReset = () => {
    if (confirmInput.toUpperCase() === "RESETAR") {
      setCompletedDays([]);
      localStorage.setItem(localStorageKey, JSON.stringify([]));
      setShowResetModal(false);
      setConfirmInput("");
      setErrorResetMsg("");
    } else {
      setErrorResetMsg("Por favor, digite a palavra 'RESETAR' corretamente para validar a exclusão.");
    }
  };

  // Performance calculations
  const totalDays = 365;
  const completedCount = completedDays.length;
  const completionPercent = Math.round((completedCount / totalDays) * 100) || 0;
  
  // Calculate streaks
  const calculateStreak = () => {
    let streak = 0;
    const sorted = [...completedDays].sort((a,b) => b-a); // descending
    const todayNum = getDayOfYear();
    
    // Check if yesterday or today is checked to verify active streak
    if (!completedDays.includes(todayNum) && !completedDays.includes(todayNum - 1)) {
      return 0;
    }

    // Calculate contiguous days descending from the most recent completed day
    let current = completedDays.includes(todayNum) ? todayNum : todayNum - 1;
    while (completedDays.includes(current) && current > 0) {
      streak++;
      current--;
    }
    return streak;
  };

  // Helper helper to get day of year for active calendar date matches
  const getDayOfYear = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const activeStreak = calculateStreak();

  // Custom praise messages based on completion progress rank
  const getPraiseRank = () => {
    if (completionPercent >= 100) return { title: "Doutor das Escrituras", color: "text-amber-400", phrase: "Excelente! Você concluiu a Bíblia inteira neste ano. Parabéns pela perseverança gloriosa." };
    if (completionPercent >= 80) return { title: "Teólogo Dedicado", color: "text-teal-400", phrase: "Incrível! Faltam poucas páginas para você meditar em todos os conselhos do Altíssimo." };
    if (completionPercent >= 50) return { title: "Soldado Bereiano", color: "text-blue-400", phrase: "Metade da jornada vencida. 'Lâmpada para os meus pés é a tua palavra'." };
    if (completionPercent >= 20) return { title: "Caminhante Constante", color: "text-emerald-400", phrase: "Belo início de discpulado. Guardando a fé através do estudo metódico diário." };
    if (completionPercent > 0) return { title: "Iniciante Próspero", color: "text-amber-500", phrase: "Cada passo conta. 'Não só de pão viverá o homem, mas de toda Palavra de Deus'." };
    return { title: "Inicie sua Leitura", color: "text-slate-400", phrase: "Marque seu primeiro dia concluído abaixo para ativar a jornada de comunhão anual!" };
  };

  const praise = getPraiseRank();

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Header Banner & Stats */}
      <div className="p-5 bg-gradient-to-br from-[#122338] to-[#0c1825] border border-white/10 rounded-2xl relative overflow-hidden">
        
        {/* Subtle decorative background icon */}
        <div className="absolute right-4 -bottom-4 text-white/5 font-black text-9xl pointer-events-none select-none select-none">
          †
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-1 bg-transparent">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest leading-none mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Comunhão e Disciplina Espiritual
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-display">
              Plano de Leitura Bíblica Anual
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-xl">
              Alimente-se diariamente com o conselho dos Profetas, Salmistas e Apóstolos. Um programa estratégico de 365 dias projetado para guiar membros fardados da UMESC através das Escrituras.
            </p>
          </div>

          {/* User badge */}
          <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs space-y-1 text-left min-w-[200px] shrink-0">
            <span className="text-[8px] uppercase font-bold text-slate-500 block">Assinatura Ativa</span>
            <div className="text-white font-extrabold truncate">{loggedInUser.name}</div>
            <div className="text-amber-500 font-mono text-[10px] font-bold">Registro: {loggedInUser.rgMilitar || "Membro Ativo"}</div>
          </div>
        </div>

        {/* Dynamic Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          
          <div className="bg-[#0b131e] p-4 rounded-xl border border-white/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
              <BookOpenCheck className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450 tracking-wider">Porcentagem Completa</span>
              <span className="text-2xl font-black text-amber-500 block leading-none font-mono mt-1">{completionPercent}%</span>
            </div>
          </div>

          <div className="bg-[#0b131e] p-4 rounded-xl border border-white/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450 tracking-wider">Dias Marcados</span>
              <span className="text-2xl font-black text-teal-400 block leading-none font-mono mt-1">
                {completedCount} <span className="text-[10px] text-slate-500 font-normal">/ {totalDays}</span>
              </span>
            </div>
          </div>

          <div className="bg-[#0b131e] p-4 rounded-xl border border-white/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-455 flex items-center justify-center shrink-0 border border-rose-500/10">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="block text-[8px] uppercase font-bold text-slate-450 tracking-wider">Flâmula de Hábito</span>
              <span className="text-xs font-bold text-slate-200 block truncate mt-1.5 p-0.5 max-w-[140px] uppercase font-mono tracking-wider">
                {activeStreak} dias seguidos
              </span>
            </div>
          </div>

          <div className="bg-[#0b131e] p-3 rounded-xl border border-white/5 flex flex-col justify-center text-left">
            <span className="text-[9px] uppercase font-bold mr-2 tracking-widest font-mono text-amber-500">
              {praise.title}
            </span>
            <p className="text-[10px] text-slate-350 italic mt-1 leading-tight font-sans line-clamp-2">
              "{praise.phrase}"
            </p>
          </div>

        </div>

        {/* High contrast visual progress slider indicator */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono select-none">
            <span className="text-slate-400">Progresso de Meditação das Escrituras</span>
            <span className="text-slate-200 font-extrabold">{completedCount} concluídos do alvo de 365 canônicos</span>
          </div>
          <div className="w-full bg-[#1b2b3f] h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="bg-gradient-to-r from-amber-600 via-amber-500 to-teal-500 h-full transition-all duration-700 ease-out rounded-full relative" 
              style={{ width: `${completionPercent}%` }}
            >
              <span className="absolute right-1.5 top-0.5 text-[8px] text-slate-950 font-black leading-none">{completionPercent}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Reading Controls & Filters Panel */}
      <div className="p-4 bg-[#111d2e] rounded-xl border border-white/5 flex flex-col space-y-4">
        
        {/* Month selector toolbar scroll row */}
        <div className="overflow-x-auto pb-1 flex gap-1 bg-transparent">
          {MONTHS_LABELS.map((mLabel, index) => {
            const daysInMonthTotal = BIBLE_PLAN.filter(p => p.month === index).length;
            const completedInMonth = BIBLE_PLAN.filter(p => p.month === index && completedDays.includes(p.dayNumber)).length;
            const isMonthDone = completedInMonth === daysInMonthTotal && daysInMonthTotal > 0;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setActiveMonthFilter(index);
                  setSearchTerm("");
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 relative ${
                  activeMonthFilter === index
                    ? "bg-amber-500 text-slate-950 border-transparent font-black shadow-md"
                    : "bg-[#0b1320] text-slate-300 border-white/5 hover:text-white hover:bg-[#16273a]"
                }`}
              >
                <span>{mLabel}</span>
                
                {/* Month percentage dot indicator */}
                <span className={`text-[8px] font-mono rounded px-1 ${
                  activeMonthFilter === index 
                    ? "bg-amber-600 text-slate-950" 
                    : isMonthDone 
                      ? "bg-teal-500/20 text-teal-400" 
                      : "bg-[#18273a] text-slate-400"
                }`}>
                  {completedInMonth}/{daysInMonthTotal}
                </span>

                {isMonthDone && (
                  <CheckCircle2 className={`w-3 h-3 ${activeMonthFilter === index ? "text-slate-950" : "text-teal-400"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Text Filter search and state checkers */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2 border-t border-white/5">
          
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisar passagem (ex: Gênesis)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#09101a] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-[#0a111a] rounded-lg p-0.5 border border-white/5">
              {[
                { id: "todos", label: "Tudo" },
                { id: "concluidos", label: "Lidos" },
                { id: "pendentes", label: "Pendentes" }
              ].map( btn => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setFilterType(btn.id as any)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded cursor-pointer transition-all ${
                    filterType === btn.id
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

          </div>

          {/* Mass check/uncheck & reset area */}
          <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleToggleAllMonthReadings("check")}
              className="px-3 py-1.5 bg-[#12233c] hover:bg-[#1b3152] border border-white/5 rounded text-[10px] font-black text-slate-200 uppercase tracking-wider cursor-pointer"
            >
              Lido no Mês
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllMonthReadings("uncheck")}
              className="px-3 py-1.5 bg-[#12233c] hover:bg-rose-950/20 border border-white/5 rounded text-[10px] font-bold text-rose-350 hover:text-rose-400 uppercase tracking-wider cursor-pointer"
            >
              Zerar Mês
            </button>

            {/* Crucial requested RESET plan button */}
            <button
              type="button"
              onClick={() => {
                setErrorResetMsg("");
                setConfirmInput("");
                setShowResetModal(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 hover:text-black rounded text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 shadow-lg shadow-rose-900/10"
              title="Resetar Plano Anual de Leitura"
            >
              <RotateCcw className="w-3.5 h-3.5 font-extrabold" /> Resetar Plano
            </button>
          </div>

        </div>

      </div>

      {/* 3. Readings List Output */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getVisibleReadings().map((item) => {
          const isDone = completedDays.includes(item.dayNumber);
          const isTodayReading = getDayOfYear() === item.dayNumber;

          return (
            <div
              key={item.dayNumber}
              onClick={() => toggleDayCompletion(item.dayNumber)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-4 text-left relative overflow-hidden ${
                isDone
                  ? "bg-[#0b1d1f] border-teal-500/35 hover:bg-[#0f272a] shadow shadow-teal-500/5 group"
                  : isTodayReading
                    ? "bg-[#1f232b] border-amber-500/40 hover:bg-[#252a33]"
                    : "bg-[#132031] border-white/5 hover:border-white/15 hover:bg-[#172739]"
              }`}
            >
              {/* Completed background badge checkmark */}
              {isDone && (
                <div className="absolute right-0 top-0 w-16 h-16 bg-teal-500/5 rounded-bl-full flex items-center justify-center text-teal-400/20 font-black pointer-events-none">
                  ✓
                </div>
              )}

              {/* Day info row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    isDone 
                      ? "bg-teal-500/10 text-teal-400" 
                      : isTodayReading 
                        ? "bg-amber-500/20 text-amber-500 animate-pulse font-extrabold" 
                        : "bg-slate-900/60 text-slate-400"
                  }`}>
                    Dia {item.dayNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-normal font-mono">
                    {item.dayOfMonth} de {MONTHS_LABELS[item.month]}
                  </span>
                </div>

                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 hover:text-amber-500 shrink-0 transition-colors" />
                )}
              </div>

              {/* Scripture Passages */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-1 rounded shrink-0 leading-normal mt-0.5">Antigo</span>
                  <p className={`text-xs text-white font-bold tracking-tight leading-normal ${isDone ? "line-through text-slate-500" : ""}`}>
                    {item.oldTestament}
                  </p>
                </div>
                
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] font-black uppercase text-teal-400 bg-teal-400/10 px-1 rounded shrink-0 leading-normal mt-0.5">Novo</span>
                  <p className={`text-xs text-white font-bold tracking-tight leading-normal ${isDone ? "line-through text-slate-500" : ""}`}>
                    {item.newTestament}
                  </p>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-400/10 px-1 rounded shrink-0 leading-normal mt-0.5">Meditar</span>
                  <p className={`text-xs text-slate-300 font-semibold tracking-tight leading-normal ${isDone ? "line-through text-slate-500" : ""}`}>
                    {item.wisdom}
                  </p>
                </div>
              </div>

              {/* Foot information status */}
              <div className="flex items-center justify-between text-[8.5px] text-slate-500 uppercase font-bold select-none border-t border-white/5 pt-2 mt-2 leading-none">
                <span className="truncate max-w-[150px]">{item.category}</span>
                <span>{isDone ? "Concluído" : "Pendente"}</span>
              </div>
            </div>
          );
        })}

        {getVisibleReadings().length === 0 && (
          <div className="col-span-1 sm:col-span-3 text-center py-12 bg-[#132031] rounded-xl border border-white/5 space-y-2 select-none">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Nenhuma leitura encontrada para a filtragem ativa.</p>
          </div>
        )}
      </div>

      {/* 4. IMMERSIVE COMPLIES CONFIRMATION MODAL FOR ACCIDENTAL PLANNED RESET */}
      {showResetModal && (
        <div id="reset-reading-plan-confirmation-portal" className="fixed inset-0 bg-[#060b13]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto select-none animate-fadeIn">
          <div className="bg-[#121c2c] rounded-2xl max-w-md w-full border border-white/10 overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-455 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block font-mono">Ação Destrutiva Irreversível</span>
                <h4 className="font-extrabold text-white text-base uppercase font-display leading-tight">Confirmar Reset de Leitura?</h4>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/10 space-y-2 text-left">
              <p className="text-xs text-rose-300 leading-relaxed font-semibold">
                Esta operação irá limpar permanentemente todas as suas marcações de progresso do Plano de Leitura Anual da Bíblia.
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Seu histórico acumulado, medalha de hábito e registros de devocional correspondentes em folha serão redefinidos a zero por segurança.
              </p>
            </div>

            <div className="space-y-3.5 text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase leading-none">
                Para prosseguir, digite <strong className="text-rose-400 uppercase">RESETAR</strong> no campo abaixo:
              </label>
              
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value);
                  setErrorResetMsg("");
                }}
                className="w-full px-3.5 py-2.5 bg-[#080e16] border border-white/10 rounded-lg text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-rose-500 tracking-wider placeholder:text-slate-600 focus:ring-1 focus:ring-rose-500 uppercase"
                placeholder="Digitar confirmação legal"
                autoFocus
              />

              {errorResetMsg && (
                <p className="text-[10px] text-rose-400 font-bold font-mono">⚠️ {errorResetMsg}</p>
              )}
            </div>

            {/* Confirm modal interactive triggers */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmInput("");
                  setErrorResetMsg("");
                }}
                className="w-full py-2.5 rounded-lg text-xs uppercase font-extrabold text-slate-300 hover:text-white bg-[#142337] hover:bg-[#1b2f4a] border border-white/5 transition-all text-center cursor-pointer"
              >
                Voltar / Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={confirmInput.toUpperCase() !== "RESETAR"}
                className={`w-full py-2.5 rounded-lg text-xs uppercase font-black transition-all text-center flex items-center justify-center gap-1.5 ${
                  confirmInput.toUpperCase() === "RESETAR"
                    ? "bg-rose-550 hover:bg-rose-500 text-slate-950 font-black shadow-lg cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Confirmar Reset
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
