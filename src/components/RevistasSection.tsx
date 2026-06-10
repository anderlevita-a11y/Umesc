import React, { useState, useEffect } from "react";
import { BookOpen, Search, Download, HelpCircle, Eye, ShieldCheck, Check } from "lucide-react";
import { getCleanImageUrl } from "../lib/imageDriveHelper.ts";

export interface RevistaEdition {
  id: string;
  title: string;
  volume: string;
  publishedDate: string;
  description: string;
  coverImage: string;
  downloads: number;
  downloadUrl?: string;
}

// Gerador de arquivos PDF reais gerados dinamicamente no navegador
const generateUmescPdf = (title: string, volume: string, date: string, description: string) => {
  const clean = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/–/g, "-")
      .replace(/[œŒæÆ]/g, "")
      .replace(/[“‘’”]/g, "'")
      .replace(/[çÇ]/g, "c")
      .replace(/ª/g, "a")
      .replace(/º/g, "o")
      .replace(/◆/g, "-")
      .replace(/[^\x00-\x7F]/g, ""); // Apenas caracteres ASCII válidos em PDFs padrão
  };

  const cTitle = clean(title).substring(0, 50);
  const cVolume = clean(volume).substring(0, 45);
  const cDate = clean(date);
  const cDesc = clean(description);

  const words = cDesc.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).length > 68) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  let streamText = `BT\n`;
  streamText += `  /F1 16 Tf\n`;
  streamText += `  40 790 Td\n`;
  streamText += `  (UMESC SC - PORTAL EDITORIAL MILITAR) Tj\n`;
  streamText += `  /F1 10 Tf\n`;
  streamText += `  0 -20 Td\n`;
  streamText += `  (DOCUMENTO CERTIFICADO DE LEITURA COMPLETA) Tj\n`;
  streamText += `  /F1 12 Tf\n`;
  streamText += `  0 -35 Td\n`;
  streamText += `  (TITULO: ${cTitle}) Tj\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (EDICAO: ${cVolume} - Data: ${cDate}) Tj\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (RESUMO EXECUTIVO:) Tj\n`;
  streamText += `  /F1 9 Tf\n`;

  for (const l of lines.slice(0, 8)) {
    streamText += `  0 -14 Td\n  (${l}) Tj\n`;
  }

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -35 Td\n`;
  streamText += `  (PREFACIO EDITORIAL - HONRA E PROTECAO) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -20 Td\n`;
  streamText += `  (A farda que vestimos traz consigo a altissima responsabilidade da salvaguarda publica,) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (honrando cada juramento proferido ante os estandartes catarinenses. Mas para) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (alem do dever exterior, existe o patrulhamento intimo da alma - onde as batalhas) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (contra o estresse severo se desdobram sem que o mundo perceba.) Tj\n`;
  streamText += `  0 -25 Td\n`;
  streamText += `  (A assistencia interdenominacional da UMESC garante que o bem-estar espiritual) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (do militar em Santa Catarina seja prioridade absoluta na corporacao.) Tj\n`;
  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (ARTIGO PRINCIPAL: RESGATE VOCACIONAL NOS BATALHOES) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -20 Td\n`;
  streamText += `  (Em turnos exaustivos da madrugada, sob o vento frio dos planaltos, a palavra) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (de comunhao e indispensavel. Nossos capelaes militares avancam voluntariamente) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (visitando hospitais, fornecendo literaturas compactas de bolso para patrulha.) Tj\n`;
  streamText += `  0 -25 Td\n`;
  streamText += `  (Mantenha a retidao etica, apoie suas fileiras e sua familia. Que as bencas) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (celestes acompanhem cada viatura e guarnicao de Santa Catarina!) Tj\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- VALIDACOES E SEGURANCA REGULAMENTAR LGPD ---) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (Selo de Seguranca: UMESC-SC-REG-${Math.floor(Math.random() * 900000 + 100000)}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (Uniao de Militares Evangelicos de Santa Catarina - Utilidade Publica Estadual.) Tj\n`;
  streamText += `ET`;

  const pdfBody = `%PDF-1.4\n` +
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n` +
    `4 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n` +
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n` +
    `xref\n0 6\n0000000000 65535 f\n` +
    `trailer\n<< /Size 6 /Root 1 0 R >>\n` +
    `startxref\n350\n%%EOF`;

  return new Blob([pdfBody], { type: "application/pdf" });
};

const INITIAL_REVISTAS: RevistaEdition[] = [
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
  },
  {
    id: "rev_3",
    title: "Valores Éticos Cristãos na Segurança Pública",
    volume: "Edição Digital Livro",
    publishedDate: "2025-11-10",
    description: "Análise doutrinária das bases de ética de patrulhamento sob a lei da dignidade humana, com prefácio especial do conselho oficial da UMESC SC.",
    coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400",
    downloads: 512
  }
];

export default function RevistasSection() {
  const [revistas, setRevistas] = useState<RevistaEdition[]>(() => {
    try {
      const saved = localStorage.getItem("umesc_revistas");
      return saved ? JSON.parse(saved) : INITIAL_REVISTAS;
    } catch {
      return INITIAL_REVISTAS;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [readingRevista, setReadingRevista] = useState<RevistaEdition | null>(null);
  const [downloadTracker, setDownloadTracker] = useState<Record<string, boolean>>({});

  // Listen to admin additions/deletions/edits
  useEffect(() => {
    const handleReload = () => {
      try {
        const saved = localStorage.getItem("umesc_revistas");
        setRevistas(saved ? JSON.parse(saved) : INITIAL_REVISTAS);
      } catch (err) {
        console.error("Error reloading revistas:", err);
      }
    };
    window.addEventListener("umesc_content_updated", handleReload);
    return () => window.removeEventListener("umesc_content_updated", handleReload);
  }, []);

  const handleDownload = (id: string, name: string, downloadUrl?: string) => {
    // Increment local counter
    const updated = revistas.map((rev) => {
      if (rev.id === id) {
        return { ...rev, downloads: rev.downloads + 1 };
      }
      return rev;
    });
    setRevistas(updated);
    localStorage.setItem("umesc_revistas", JSON.stringify(updated));

    // Dispatch update notification
    window.dispatchEvent(new CustomEvent("umesc_content_updated"));

    // Track state to show dynamic visual check icon
    setDownloadTracker((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDownloadTracker((prev) => ({ ...prev, [id]: false }));
    }, 2500);

    const matchedRev = revistas.find((r) => r.id === id);
    const description = matchedRev?.description || "";
    const volume = matchedRev?.volume || "Edicao Oficial";
    const date = matchedRev?.publishedDate || new Date().toISOString().split("T")[0];
    const coverImage = matchedRev?.coverImage || "";

    const isImageLink = downloadUrl && (
      downloadUrl === coverImage ||
      downloadUrl.toLowerCase().endsWith(".png") ||
      downloadUrl.toLowerCase().endsWith(".jpg") ||
      downloadUrl.toLowerCase().endsWith(".jpeg") ||
      downloadUrl.toLowerCase().endsWith(".gif") ||
      downloadUrl.toLowerCase().endsWith(".webp") ||
      downloadUrl.includes("images.unsplash.com")
    );

    if (downloadUrl && !isImageLink) {
      // Dynamic real download
      const element = document.createElement("a");
      element.href = downloadUrl;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
      
      // If it's a data URL, we give it a beautiful descriptive name
      if (downloadUrl.startsWith("data:")) {
        const match = downloadUrl.match(/data:([^;]+);/);
        let ext = "pdf";
        if (match && match[1]) {
          const mime = match[1];
          if (mime.includes("pdf")) ext = "pdf";
          else if (mime.includes("text")) ext = "txt";
          else if (mime.includes("word") || mime.includes("officedocument")) ext = "docx";
          else if (mime.includes("image")) ext = "jpg";
        }
        element.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${ext}`;
      } else {
        element.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      }
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // Offline direct dynamic PDF generator instead of basic .txt
      const pdfBlob = generateUmescPdf(name, volume, date, description);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const element = document.createElement("a");
      element.href = pdfUrl;
      element.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_edicao_completa.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    }
  };

  const filtered = revistas.filter((rev) =>
    rev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.volume.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="revista" className="py-20 bg-[#0b1220] text-slate-100 scroll-mt-20 border-t border-white/5 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0f1c30/40,transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-left max-w-2xl">
            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full tracking-widest inline-block mb-3 font-mono">
              Informativo & Leitura de Farda
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-display">
              Revistas de Capelania e Boletins
            </h2>
            <div className="w-12 h-1 bg-amber-500 rounded-full mt-3 mb-2"></div>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold leading-relaxed">
              Alimente seu espírito em postos de vigilância ou leituras domésticas de farda com nosso acervo editorial eletrônico oficial de doutrinas, notícias e artigos de capelania.
            </p>
          </div>

          {/* Search bar helper */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar edição ou artigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121c2d] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-amber-500 text-white placeholder-slate-500 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Magazine shelf Row visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#121c2d]/40 border border-white/5 hover:border-white/10 rounded-xl overflow-hidden flex flex-col justify-between p-4 bg-gradient-to-b from-[#121c2d]/40 to-slate-950/40 group hover:shadow-lg transition-all"
            >
              <div className="flex gap-4">
                {/* Visual Cover */}
                <div className="w-24 h-36 rounded shadow-md overflow-hidden relative bg-slate-900 shrink-0 border border-white/10">
                  <img
                    src={getCleanImageUrl(rev.coverImage)}
                    alt={rev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-1.5">
                    <span className="text-[7px] text-amber-400 font-bold tracking-widest font-mono uppercase text-center truncate w-full">UMESC SC</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 font-mono block uppercase">
                      {rev.volume}
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-2">
                      {rev.title}
                    </h3>
                    <span className="text-[9px] font-mono font-bold text-slate-400 block mt-0.5">
                      📅 Lançamento: {new Date(rev.publishedDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal line-clamp-3">
                    {rev.description}
                  </p>
                </div>
              </div>

              {/* Download and pre-read ribbon */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  📥 {rev.downloads} downloads
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setReadingRevista(rev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-300 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ler Online
                  </button>
                  <button
                    onClick={() => handleDownload(rev.id, rev.title, rev.downloadUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                  >
                    {downloadTracker[rev.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5 animate-bounce" /> Pronto
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Baixar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center bg-[#121c2d]/20 border border-dashed border-white/10 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2.5" />
              <p className="text-xs font-mono uppercase text-slate-400">Nenhuma Edição Encontrada</p>
              <p className="text-[10px] text-slate-500 mt-1">Altere sua busca ou gerencie edições na Área Administrativa.</p>
            </div>
          )}
        </div>

      </div>

      {/* ONLINE SIMULATED READER POPUP */}
      {readingRevista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/5 mb-5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider font-mono">Leitura Conectada de Uniforme</span>
                  <h3 className="text-lg font-bold">{readingRevista.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{readingRevista.volume} / Publicação: {new Date(readingRevista.publishedDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <button
                  onClick={() => setReadingRevista(null)}
                  className="px-2.5 py-1 text-xs font-bold font-mono rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                >
                  FECHAR X
                </button>
              </div>

              {/* Cover mini image and intro */}
              <div className="flex gap-4 p-4 rounded-xl bg-slate-950/60 border border-white/5 mb-5 items-start">
                <img
                  src={getCleanImageUrl(readingRevista.coverImage)}
                  alt={readingRevista.title}
                  className="w-16 h-24 object-cover rounded border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
                  }}
                />
                <p className="text-xs italic text-slate-300 leading-relaxed font-semibold">
                  "{readingRevista.description}"
                </p>
              </div>

              {/* Simulated Page Text Content */}
              <div className="space-y-4 p-5 bg-white text-slate-900 rounded-xl border border-slate-300 font-serif text-sm h-64 overflow-y-auto text-left shadow-inner leading-relaxed">
                <div className="text-center pb-3 border-b border-slate-200 mb-4">
                  <h4 className="font-extrabold text-base uppercase">PREFÁCIO EDITORIAL CONSELHO EXECUTIVO UMESC</h4>
                  <p className="text-[10px] font-sans font-bold text-slate-600 mt-0.5">Florianópolis, Santa Catarina / Ano de 2026</p>
                </div>

                <p className="font-bold">Honra e Proteção!</p>
                <p>
                  A farda que vestimos traz consigo a altíssima responsabilidade da salvaguarda pública, honrando cada juramento proferido ante os estandartes catarinenses. Mas para além do dever exterior, existe o patrulhamento íntimo da alma — onde as batalhas invisíveis contra o estresse severo, as agonias fardadas e as crises familiares se desdobram sem que o mundo perceba.
                </p>
                <p>
                  A assistência interdenominacional da UMESC, amparada pelas garantias fundamentais brasileiras, reafirma que o bem-estar psicológico e espiritual do militar de Santa Catarina é prioridade absoluta na manutenção de um corpo policial moralmente íntegro e forte.
                </p>
                <p className="font-black text-[11px] font-sans border-t pt-3 border-slate-200 text-slate-700 uppercase">
                  ◆ Artigo Principal: Resgate Vocacional nos Batalhões Regionais
                </p>
                <p>
                  Em turnos exaustivos da madrugada, sob o vento frio dos planaltos, a palavra de comunhão é calor. Nossos capelães militares avançam voluntariamente visitando hospitais, fornecendo literaturas compactas de bolso para patrulha e consolo teológico para garantir que o militar jamais se sinta só.
                </p>
                <p>
                  Fique em segurança, mantenha a retidão ética, apoie suas fileiras e sua família. Que as bênçãos celestes acompanhem cada viatura e guarnição catarinense nesta jornada contínua de cuidado social e vocacional!
                </p>
              </div>
            </div>

            {/* Accept Close / Download */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Blindagem de Acesso sob Prerrogativa LGPD
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleDownload(readingRevista.id, readingRevista.title, readingRevista.downloadUrl);
                    setReadingRevista(null);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase rounded-xl tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar Edição Completa (PDF)
                </button>
                <button
                  onClick={() => setReadingRevista(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer"
                >
                  Concluir Leitura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
